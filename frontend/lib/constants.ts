/** 应用常量 */

/** 贝叶斯修正参数 */
export const BAYESIAN_C = 10;          // 置信阈值：至少需要多少条评论才可信
export const BAYESIAN_PRIOR = 0.70;    // 全局先验均值

/** 推荐引擎权重 */
export const WEIGHT_BAYESIAN = 0.50;
export const WEIGHT_HISTORY = 0.20;
export const WEIGHT_CATEGORY_ROTATION = 0.15;
export const WEIGHT_RECENT_PENALTY = -0.30;  // 近期推荐过的最大扣分
export const WEIGHT_RANDOM = 0.10;           // 随机扰动幅度

/** 规则引擎 */
export const RULE_DECAY_DAYS = 30;           // 多少天未命中开始衰减
export const RULE_DECAY_RATE = 0.9;          // 衰减系数
export const RULE_MIN_WEIGHT = 0.1;          // 低于此权重删除
export const RULE_USER_CORRECT_FACTOR = 0.5; // 用户纠错降权系数

/** API */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://what-to-eat-production-35c2.up.railway.app';
export const API_TIMEOUT_MS = 5000;

/** 默认分类 */
export const DEFAULT_CATEGORIES = [
  '饭', '面', '粉', '炸鸡', '奶茶',
  '麻辣烫', '烧烤', '饺子', '粥', '其他',
] as const;

/** 网络状态 */
export type NetworkStatus = 'online' | 'offline' | 'cloud-available';
