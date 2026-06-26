'use client';

import { useMemo } from 'react';
import type { RecommendResult } from '@/lib/recommender';

interface RecommendCardProps {
  result: RecommendResult;
  candidateCount: number;
  onReroll: () => void;
  loading: boolean;
}

/** 分类 → 图标 + 颜色 */
const CATEGORY_STYLE: Record<string, { emoji: string; bg: string; text: string }> = {
  饭:     { emoji: '🍚', bg: 'bg-amber-50',  text: 'text-amber-700' },
  面:     { emoji: '🍜', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  粉:     { emoji: '🍝', bg: 'bg-orange-50', text: 'text-orange-700' },
  炸鸡:   { emoji: '🍗', bg: 'bg-red-50',    text: 'text-red-700' },
  奶茶:   { emoji: '🥤', bg: 'bg-pink-50',   text: 'text-pink-700' },
  麻辣烫: { emoji: '🫕', bg: 'bg-red-50',    text: 'text-red-700' },
  烧烤:   { emoji: '🍖', bg: 'bg-amber-50',  text: 'text-amber-700' },
  饺子:   { emoji: '🥟', bg: 'bg-yellow-50', text: 'text-yellow-700' },
  粥:     { emoji: '🥣', bg: 'bg-green-50',  text: 'text-green-700' },
  其他:   { emoji: '🍽️', bg: 'bg-gray-50',   text: 'text-gray-700' },
};

const DEFAULT_STYLE = { emoji: '🍽️', bg: 'bg-gray-50', text: 'text-gray-700' };

/** 分数颜色 */
function scoreColor(score: number): string {
  if (score >= 85) return 'text-green-500';
  if (score >= 70) return 'text-orange-500';
  return 'text-red-400';
}

function scoreLabel(score: number): string {
  if (score >= 85) return '很棒';
  if (score >= 70) return '不错';
  return '一般';
}

export default function RecommendCard({
  result,
  candidateCount,
  onReroll,
  loading,
}: RecommendCardProps) {
  const { shop, breakdown } = result;
  const catStyle = CATEGORY_STYLE[shop.category] || DEFAULT_STYLE;
  const score = Math.round(breakdown.bayesian * 100);

  // 评论可信度条形（真实/总）
  const trustPct = shop.reviewCount > 0
    ? Math.round((shop.realReviewCount / shop.reviewCount) * 100)
    : 0;

  if (loading) {
    return (
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-gray-200 rounded-full" />
          <div className="flex-1 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3" />
            <div className="h-7 bg-gray-200 rounded w-2/3" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
        <div className="h-12 bg-gray-200 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      {/* 顶部彩色条 */}
      <div className={`h-1.5 ${catStyle.bg} bg-current ${catStyle.text.replace('text-', 'bg-').replace('-700', '-400')}`}
        style={{ backgroundColor: undefined }}
      />

      <div className="p-5">
        {/* 第一行：图标 + 店名 + 分数 */}
        <div className="flex items-start gap-4 mb-4">
          {/* 分类图标 */}
          <div className={`w-16 h-16 rounded-2xl ${catStyle.bg} flex items-center justify-center text-3xl shrink-0`}>
            {catStyle.emoji}
          </div>

          {/* 店名等信息 */}
          <div className="flex-1 min-w-0">
            <span className={`inline-block text-xs font-medium px-2.5 py-0.5 rounded-full ${catStyle.bg} ${catStyle.text} mb-1.5`}>
              {shop.category}
            </span>
            <h2 className="text-xl font-bold text-gray-900 truncate">{shop.name}</h2>
            <p className="text-sm text-gray-400 truncate mt-0.5">{shop.address}</p>
          </div>

          {/* 分数圆环 */}
          <div className="shrink-0 text-center">
            <div className={`w-16 h-16 rounded-full border-4 flex items-center justify-center
              ${score >= 85 ? 'border-green-200 bg-green-50' : score >= 70 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
              <div>
                <div className={`text-xl font-extrabold leading-none ${scoreColor(score)}`}>
                  {score}
                </div>
                <div className="text-[10px] text-gray-400 mt-0.5">分</div>
              </div>
            </div>
            <div className={`text-xs mt-1 ${scoreColor(score)} font-medium`}>
              {scoreLabel(score)}
            </div>
          </div>
        </div>

        {/* 招牌菜 */}
        {result.dishes && result.dishes.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-400 font-medium mb-2">🔥 热门菜品</p>
            <div className="flex flex-wrap gap-2">
              {result.dishes.map((d) => (
                <span key={d.id}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-50 text-orange-700
                    rounded-xl text-sm font-medium">
                  {d.name}
                  <span className="text-xs text-orange-400 ml-0.5">×{d.orderCount}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 评论统计条 */}
        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1.5">
            <span>评论可信度</span>
            <span className="font-medium">{shop.realReviewCount} / {shop.reviewCount} 条真实</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${trustPct >= 80 ? 'bg-green-400' : trustPct >= 60 ? 'bg-yellow-400' : 'bg-red-400'}`}
              style={{ width: `${trustPct}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1">
            <span>0%</span>
            <span>{trustPct}%</span>
            <span>100%</span>
          </div>
          {shop.platformRating && (
            <div className="text-xs text-gray-400 mt-2 text-center">
              平台评分 ⭐ {shop.platformRating}
            </div>
          )}
        </div>

        {/* 第三行：按钮 */}
        <button
          onClick={onReroll}
          disabled={candidateCount <= 1}
          className="w-full py-3 bg-gradient-to-r from-orange-400 to-orange-500 text-white rounded-2xl
            text-sm font-bold shadow-md shadow-orange-200
            hover:from-orange-500 hover:to-orange-600 active:scale-[0.98]
            disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-400 disabled:shadow-none
            transition-all duration-200"
        >
          🎲 换一个尝尝
          {candidateCount > 1 && (
            <span className="font-normal ml-1 opacity-80">（{candidateCount - 1}家可选）</span>
          )}
        </button>
      </div>
    </div>
  );
}
