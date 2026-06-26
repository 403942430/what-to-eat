import { db, type Rule, type Indicator } from './db';
import {
  RULE_DECAY_DAYS,
  RULE_DECAY_RATE,
  RULE_MIN_WEIGHT,
} from './constants';

// ============================================================
// 本地规则引擎 — 加权关键词匹配 + sigmoid 归一化
// ============================================================

/**
 * 本地规则打分
 * 遍历本地规则库 → 匹配评论文本 → 加权求和 → sigmoid 归一化
 * @returns { isFake, confidence, indicators }
 */
export async function localAnalyze(text: string): Promise<{
  isFake: boolean;
  confidence: number;
  indicators: Indicator[];
}> {
  const rules = await db.rules.toArray();
  if (rules.length === 0) {
    return { isFake: false, confidence: 0.5, indicators: [] };
  }

  let totalWeight = 0;
  let hitWeight = 0;
  const indicators: Indicator[] = [];

  for (const rule of rules) {
    // 衰减检查
    const effectiveWeight = getEffectiveWeight(rule);
    if (effectiveWeight < RULE_MIN_WEIGHT) continue;

    totalWeight += effectiveWeight;
    if (text.includes(rule.word)) {
      hitWeight += effectiveWeight;
      indicators.push({
        word: rule.word,
        type: rule.type,
        weight: effectiveWeight,
      });

      // 更新命中计数
      db.rules.update(rule.id, {
        hitCount: (rule.hitCount || 0) + 1,
        lastHit: new Date(),
      });
    }
  }

  if (totalWeight === 0) {
    return { isFake: false, confidence: 0.5, indicators: [] };
  }

  const ratio = hitWeight / totalWeight;
  const confidence = sigmoid(ratio, 0.4, 10);
  const isFake = confidence > 0.5;

  return { isFake, confidence: Math.round(confidence * 10000) / 10000, indicators };
}

/** sigmoid 归一化: 1 / (1 + e^(-k * (x - x0))) */
function sigmoid(x: number, x0: number, k: number): number {
  return 1 / (1 + Math.exp(-k * (x - x0)));
}

/** 计算规则的有效权重（考虑衰减） */
function getEffectiveWeight(rule: Rule): number {
  if (!rule.lastHit) return rule.weight;

  const daysSince = (Date.now() - new Date(rule.lastHit).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSince < RULE_DECAY_DAYS) return rule.weight;

  const decayCycles = Math.floor((daysSince - RULE_DECAY_DAYS) / RULE_DECAY_DAYS) + 1;
  return rule.weight * Math.pow(RULE_DECAY_RATE, decayCycles);
}
