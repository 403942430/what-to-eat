import Dexie, { type EntityTable } from 'dexie';

// ============================================================
// 类型定义
// ============================================================

/** 配送区域 */
export interface Area {
  id: number;
  name: string;
  address: string;
  createdAt: Date;
}

/** 店铺 */
export interface Shop {
  id: number;
  name: string;
  category: string;
  areaId: number;
  address: string;
  platformId?: string;       // 淘宝闪购店铺ID（用于关联）
  reviewCount: number;       // 已分析评论总数
  realReviewCount: number;   // 真实评论数（非虚假）
  platformRating?: number;   // 平台原始评分
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** 个人评分 */
export interface Rating {
  id: number;
  shopId: number;
  score: number;             // 1-5 或 1/0/-1
  tags: string[];
  note: string;
  createdAt: Date;
}

/** 历史订单（从淘宝闪购抓取） */
export interface OrderHistory {
  id: number;
  shopId?: number;           // 关联到本地店铺（可选）
  shopName: string;
  items: string[];           // 商品名称列表
  totalPrice: number;
  orderDate: Date;
  platform: string;          // "淘宝闪购"
}

/** 推荐记录 */
export interface Recommendation {
  id: number;
  shopId: number;
  areaId: number;
  category: string;
  createdAt: Date;
  accepted?: boolean;        // 用户是否采用了推荐
}

/** 分析来源 */
export type AnalysisSource = 'cloud' | 'local';

/** 判断依据 */
export interface Indicator {
  word: string;              // 触发关键词
  type: string;              // 类型：流行语模板/促销用语/刷单特征/...
  weight: number;            // 权重
}

/** 评论分析记录 */
export interface ReviewAnalysis {
  id: number;
  shopId?: number;           // 关联店铺（可选）
  text: string;              // 原始评论文本
  isFake: boolean;           // 是否为虚假评论
  confidence: number;        // 置信度 0-1
  source: AnalysisSource;    // 分析来源
  indicators: Indicator[];   // 判断依据列表
  createdAt: Date;
}

/** 本地规则 */
export interface Rule {
  id: number;
  word: string;              // 关键词
  type: string;              // 类型
  weight: number;            // 当前权重
  hitCount: number;          // 命中次数
  lastHit?: Date;            // 最近命中时间
  createdAt: Date;
}

/** 菜品 */
export interface Dish {
  id: number;
  shopId: number;            // 所属店铺
  name: string;              // 菜品名称
  orderCount: number;        // 点单次数
  lastOrdered?: Date;        // 最近一次点单
  createdAt: Date;
}

// ============================================================
// 数据库定义
// ============================================================

class WhatToEatDB extends Dexie {
  areas!: EntityTable<Area, 'id'>;
  shops!: EntityTable<Shop, 'id'>;
  ratings!: EntityTable<Rating, 'id'>;
  orderHistory!: EntityTable<OrderHistory, 'id'>;
  recommendations!: EntityTable<Recommendation, 'id'>;
  reviewAnalyses!: EntityTable<ReviewAnalysis, 'id'>;
  rules!: EntityTable<Rule, 'id'>;
  dishes!: EntityTable<Dish, 'id'>;

  constructor() {
    super('WhatToEatDB');

    this.version(1).stores({
      areas:            '++id, name',
      shops:            '++id, name, category, areaId, isActive',
      ratings:          '++id, shopId, createdAt',
      orderHistory:     '++id, shopId, orderDate',
      recommendations:  '++id, shopId, areaId, createdAt',
      reviewAnalyses:   '++id, shopId, source, createdAt',
      rules:            '++id, word, type, lastHit',
    });

    this.version(2).stores({
      areas:            '++id, name',
      shops:            '++id, name, category, areaId, isActive',
      ratings:          '++id, shopId, createdAt',
      orderHistory:     '++id, shopId, orderDate',
      recommendations:  '++id, shopId, areaId, createdAt',
      reviewAnalyses:   '++id, shopId, source, createdAt',
      rules:            '++id, word, type, lastHit',
      dishes:           '++id, shopId',
    });
  }
}

/** 数据库单例 */
export const db = new WhatToEatDB();

// ============================================================
// 种子规则（预置的高频刷单关键词）
// ============================================================

export const SEED_RULES: Omit<Rule, 'id' | 'hitCount' | 'lastHit'>[] = [
  { word: '好评返现', type: '刷单特征', weight: 0.9, createdAt: new Date() },
  { word: '五星好评', type: '刷单特征', weight: 0.8, createdAt: new Date() },
  { word: '有红包', type: '促销诱导', weight: 0.7, createdAt: new Date() },
  { word: '加微信', type: '引流特征', weight: 0.8, createdAt: new Date() },
  { word: '扫码领', type: '促销诱导', weight: 0.6, createdAt: new Date() },
  { word: '绝绝子', type: '流行语模板', weight: 0.5, createdAt: new Date() },
  { word: 'yyds', type: '流行语模板', weight: 0.5, createdAt: new Date() },
  { word: '姐妹们冲', type: '水军话术', weight: 0.7, createdAt: new Date() },
  { word: '亲测有效', type: '模板话术', weight: 0.4, createdAt: new Date() },
  { word: '闭眼入', type: '模板话术', weight: 0.4, createdAt: new Date() },
  { word: '无限回购', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '不踩雷', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '赶紧冲', type: '促销用语', weight: 0.6, createdAt: new Date() },
  { word: '限时优惠', type: '促销用语', weight: 0.3, createdAt: new Date() },
  { word: '收藏店铺', type: '引流特征', weight: 0.5, createdAt: new Date() },
  { word: '关注有礼', type: '引流特征', weight: 0.5, createdAt: new Date() },
  { word: '客服小姐姐', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '物超所值', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '强烈推荐', type: '模板话术', weight: 0.2, createdAt: new Date() },
  { word: '第二次买了', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '朋友推荐', type: '水军话术', weight: 0.4, createdAt: new Date() },
  { word: '真的太好吃了', type: '模板话术', weight: 0.2, createdAt: new Date() },
  { word: '价格实惠', type: '模板话术', weight: 0.2, createdAt: new Date() },
  { word: '分量很足', type: '模板话术', weight: 0.2, createdAt: new Date() },
  { word: '比实体店便宜', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '良心商家', type: '模板话术', weight: 0.3, createdAt: new Date() },
  { word: '回购无数次', type: '刷单特征', weight: 0.5, createdAt: new Date() },
  { word: '居然这么好吃', type: '模板话术', weight: 0.2, createdAt: new Date() },
  { word: '下次还来', type: '模板话术', weight: 0.2, createdAt: new Date() },
  { word: '试试看吧', type: '模板话术', weight: 0.3, createdAt: new Date() },
];
