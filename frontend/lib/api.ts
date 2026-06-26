import { API_BASE_URL, API_TIMEOUT_MS } from './constants';
import { checkNetworkStatus } from './network';
import { localAnalyze } from './ruleEngine';
import { evolveFromCloud } from './ruleEvolution';
import { db, type Indicator } from './db';

// ============================================================
// 云端 API 调用 + 有网/无网自动切换
// ============================================================

export interface AnalysisResult {
  isFake: boolean;
  confidence: number;
  indicators: Indicator[];
  source: 'cloud' | 'local';
}

/**
 * 分析评论：优先调云端 API，超时/断网则降级本地规则引擎
 */
export async function analyzeReview(
  text: string,
  userToken: string = 'anonymous',
): Promise<AnalysisResult> {
  const status = await checkNetworkStatus();

  if (status === 'cloud-available') {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      const resp = await fetch(`${API_BASE_URL}/api/analyze-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, user_token: userToken }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        // 云端分析结果写入本地 + 规则进化
        await db.reviewAnalyses.add({
          text,
          isFake: data.is_fake,
          confidence: data.confidence,
          source: 'cloud',
          indicators: data.indicators || [],
          createdAt: new Date(),
        });
        await evolveFromCloud(data.indicators || []);
        return { ...data, source: 'cloud' };
      }
    } catch {
      // 云端不可达，降级
    }
  }

  // 降级：本地规则引擎
  const local = await localAnalyze(text);
  await db.reviewAnalyses.add({
    text,
    isFake: local.isFake,
    confidence: local.confidence,
    source: 'local',
    indicators: local.indicators,
    createdAt: new Date(),
  });
  return { ...local, source: 'local' };
}
