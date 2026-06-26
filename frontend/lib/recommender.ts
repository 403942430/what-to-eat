import { db, type Shop, type Dish } from './db';
import {
  BAYESIAN_C,
  BAYESIAN_PRIOR,
  WEIGHT_BAYESIAN,
  WEIGHT_HISTORY,
  WEIGHT_CATEGORY_ROTATION,
  WEIGHT_RECENT_PENALTY,
  WEIGHT_RANDOM,
} from './constants';

// ============================================================
// 贝叶斯平均修正
// ============================================================

/**
 * 贝叶斯修正好评率
 * 公式: (C × prior + n × observed) / (C + n)
 * 解决小样本偏差：评论少的店好评率向全局均值回归
 */
export function bayesianScore(shop: Shop): number {
  const { reviewCount, realReviewCount } = shop;
  if (reviewCount === 0) return BAYESIAN_PRIOR;
  const observed = realReviewCount / reviewCount;
  return (BAYESIAN_C * BAYESIAN_PRIOR + reviewCount * observed) / (BAYESIAN_C + reviewCount);
}

// ============================================================
// 推荐引擎
// ============================================================

/** 推荐结果 */
export interface RecommendResult {
  shop: Shop;
  score: number;
  dishes?: Dish[];          // 该店热门菜品（填完评分后拉取）
  breakdown: {
    bayesian: number;
    history: number;
    rotation: number;
    penalty: number;
    random: number;
  };
}

/**
 * 获取推荐引擎的全局先验均值
 * 计算所有店铺的平均好评率
 */
async function getGlobalPrior(): Promise<number> {
  const allShops = await db.shops.toArray();
  if (allShops.length === 0) return BAYESIAN_PRIOR;

  let totalReal = 0;
  let totalAll = 0;
  for (const s of allShops) {
    totalReal += s.realReviewCount;
    totalAll += s.reviewCount;
  }
  return totalAll > 0 ? totalReal / totalAll : BAYESIAN_PRIOR;
}

/**
 * 计算历史订单偏好得分
 * 用户之前点过这个分类的店 → 加分
 */
async function calcHistoryPreference(
  shop: Shop,
  _areaId: number
): Promise<number> {
  const orders = await db.orderHistory
    .where('shopId')
    .equals(shop.id)
    .toArray();

  if (orders.length === 0) return 0;
  // 点过越多次，偏好越高（上限 1.0）
  return Math.min(orders.length / 5, 1.0);
}

/**
 * 分类轮换加成
 * 最近几次推荐中出现过的分类 → 降权，没出现过的 → 加权
 */
async function calcCategoryRotation(
  category: string,
  _areaId: number,
  recentCount = 10,
): Promise<number> {
  const recent = await db.recommendations
    .orderBy('createdAt')
    .reverse()
    .limit(recentCount)
    .toArray();

  const categoryCount = recent.filter((r) => r.category === category).length;
  // 该分类最近出现次数越多，加成越低
  if (categoryCount === 0) return 1.0;
  if (categoryCount === 1) return 0.6;
  if (categoryCount === 2) return 0.3;
  return 0; // 出现 ≥3 次不加成
}

/**
 * 近期避重复扣分
 * N 天内推荐过 → 扣分
 */
async function calcRecentPenalty(
  shopId: number,
  daysWindow = 3,
): Promise<number> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysWindow);

  const count = await db.recommendations
    .where('shopId')
    .equals(shopId)
    .and((r) => r.createdAt >= cutoff)
    .count();

  if (count === 0) return 0;
  return WEIGHT_RECENT_PENALTY * count; // 越多越扣
}

/** Shuffled random between [-range, +range] */
function randomJitter(range = WEIGHT_RANDOM): number {
  return (Math.random() * 2 - 1) * range;
}

// ============================================================
// 主推荐函数
// ============================================================

/**
 * 为指定区域推荐一家店铺
 * @param areaId 区域 ID
 * @param category 分类筛选（空 = 全部）
 * @param excludeIds 需要排除的店铺 ID（换一批用）
 * @returns 推荐结果，如果没有可推荐的店铺返回 null
 */
export async function recommend(
  areaId: number,
  category = '',
  excludeIds: number[] = [],
): Promise<RecommendResult | null> {
  // 1. 构建候选池
  let candidates = await db.shops
    .where('areaId')
    .equals(areaId)
    .and((s) => s.isActive && s.reviewCount > 0)
    .toArray();

  if (category) {
    candidates = candidates.filter((s) => s.category === category);
  }
  if (excludeIds.length > 0) {
    const exclude = new Set(excludeIds);
    candidates = candidates.filter((s) => !exclude.has(s.id));
  }
  if (candidates.length === 0) return null;

  // 2. 计算每个候选的得分
  const prior = await getGlobalPrior();
  const scored: RecommendResult[] = [];

  for (const shop of candidates) {
    const bScore = bayesianScore(shop);
    const history = await calcHistoryPreference(shop, areaId);
    const rotation = await calcCategoryRotation(shop.category, areaId);
    const penalty = await calcRecentPenalty(shop.id);
    const jitter = randomJitter();

    const score =
      WEIGHT_BAYESIAN * bScore +
      WEIGHT_HISTORY * history +
      WEIGHT_CATEGORY_ROTATION * rotation +
      penalty +
      jitter;

    scored.push({
      shop,
      score,
      breakdown: {
        bayesian: bScore,
        history,
        rotation,
        penalty,
        random: jitter,
      },
    });
  }

  // 3. 按得分降序排列
  scored.sort((a, b) => b.score - a.score);

  // 4. 获取该店的招牌菜
  const top = scored[0];
  const dishes = await db.dishes
    .where('shopId')
    .equals(top.shop.id!)
    .reverse()
    .sortBy('orderCount');

  // 5. 记录推荐
  await db.recommendations.add({
    shopId: top.shop.id!,
    areaId,
    category: top.shop.category,
    createdAt: new Date(),
  });

  return { ...top, dishes: dishes.slice(0, 5) };
}

/**
 * 获取候选池大小（用于"还有 N 家可选"的展示）
 */
export async function getCandidateCount(
  areaId: number,
  category = '',
  excludeIds: number[] = [],
): Promise<number> {
  let shops = await db.shops
    .where('areaId')
    .equals(areaId)
    .and((s) => s.isActive && s.reviewCount > 0)
    .toArray();

  if (category) {
    shops = shops.filter((s) => s.category === category);
  }
  if (excludeIds.length > 0) {
    const exclude = new Set(excludeIds);
    shops = shops.filter((s) => !exclude.has(s.id));
  }
  return shops.length;
}
