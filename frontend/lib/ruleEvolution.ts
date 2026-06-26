import { db, type Indicator } from './db';
import { RULE_USER_CORRECT_FACTOR, RULE_MIN_WEIGHT } from './constants';

// ============================================================
// 规则进化引擎 — 云端 indicators → 本地规则库
// ============================================================

/**
 * 将云端返回的 indicators 喂给本地规则库
 * 进化策略：
 *   - 新关键词 → 新增规则
 *   - 已有关键词 → 权重取平均（向云端靠拢）
 *   - 命中次数归零（重新开始追踪）
 */
export async function evolveFromCloud(indicators: Indicator[]): Promise<void> {
  const existingRules = await db.rules.toArray();
  const existingMap = new Map(existingRules.map((r) => [r.word, r]));

  for (const ind of indicators) {
    const existing = existingMap.get(ind.word);
    if (existing) {
      // 云端再次确认 → 权重向云端靠拢
      await db.rules.update(existing.id, {
        weight: (existing.weight + ind.weight) / 2,
        type: ind.type,   // 更新类型（云端可能更准确）
        lastHit: new Date(),
      });
    } else {
      // 新规则
      await db.rules.add({
        word: ind.word,
        type: ind.type,
        weight: ind.weight,
        hitCount: 1,
        lastHit: new Date(),
        createdAt: new Date(),
      });
    }
  }
}

/**
 * 用户纠错：点"判错了" → 降低相关规则权重
 */
export async function userCorrect(indicators: Indicator[]): Promise<void> {
  for (const ind of indicators) {
    const existing = await db.rules.where('word').equals(ind.word).first();
    if (existing) {
      const newWeight = existing.weight * RULE_USER_CORRECT_FACTOR;
      if (newWeight < RULE_MIN_WEIGHT) {
        await db.rules.delete(existing.id);
      } else {
        await db.rules.update(existing.id, { weight: newWeight });
      }
    }
  }
}

/**
 * 清理过期规则（30天未命中且权重过低的）
 */
export async function pruneDeadRules(): Promise<number> {
  const all = await db.rules.toArray();
  let deleted = 0;

  for (const rule of all) {
    if (rule.weight < RULE_MIN_WEIGHT && rule.lastHit) {
      const daysSince = (Date.now() - new Date(rule.lastHit).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 30) {
        await db.rules.delete(rule.id);
        deleted++;
      }
    }
  }

  return deleted;
}
