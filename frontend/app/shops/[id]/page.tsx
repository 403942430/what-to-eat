'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useShop } from '@/hooks/useShops';
import { useRatings } from '@/hooks/useRatings';
import { bayesianScore } from '@/lib/recommender';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';
import Card from '@/components/ui/Card';

const SCORE_OPTIONS = [
  { value: 3, emoji: '👍', label: '好吃' },
  { value: 2, emoji: '😐', label: '一般' },
  { value: 1, emoji: '👎', label: '避雷' },
];

export default function ShopDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const shop = useShop(Number(id));
  const { ratings, loading: ratingsLoading, addRating } = useRatings(shop?.id);

  const [showForm, setShowForm] = useState(false);
  const [score, setScore] = useState(3);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  if (!shop) {
    return (
      <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-20 flex items-center justify-center">
        <p className="text-gray-400">加载中...</p>
      </div>
    );
  }

  const bScore = bayesianScore(shop);

  const handleRate = async () => {
    setSaving(true);
    await addRating(score, [], note);
    setSaving(false);
    setNote('');
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部 */}
      <div className="bg-white px-4 pt-4 pb-6 border-b border-gray-100">
        <button onClick={() => router.back()} className="text-gray-400 text-sm mb-3">
          ← 返回
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Tag label={shop.category} />
              {!shop.isActive && <Tag label="已隐藏" />}
            </div>
            <h1 className="text-xl font-bold mt-1">{shop.name}</h1>
            <p className="text-sm text-gray-400 mt-0.5">{shop.address}</p>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">
              {(bScore * 100).toFixed(0)}
            </div>
            <div className="text-xs text-gray-400">贝叶斯评分</div>
          </div>
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-400">
          <span>真实评论 {shop.realReviewCount}</span>
          <span>总评论 {shop.reviewCount}</span>
          {shop.platformRating && <span>平台 {shop.platformRating}⭐</span>}
        </div>
      </div>

      {/* 评分区域 */}
      <div className="px-4 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold">我的评价</h2>
          <Button size="sm" variant="ghost" onClick={() => setShowForm(!showForm)}>
            {showForm ? '取消' : '+ 评价'}
          </Button>
        </div>

        {showForm && (
          <Card className="mb-4">
            <div className="space-y-3">
              <div className="flex gap-3 justify-center">
                {SCORE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setScore(opt.value)}
                    className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-colors
                      ${score === opt.value
                        ? 'bg-orange-50 ring-2 ring-orange-400'
                        : 'bg-gray-50 hover:bg-gray-100'}`}
                  >
                    <span className="text-2xl">{opt.emoji}</span>
                    <span className="text-xs text-gray-500">{opt.label}</span>
                  </button>
                ))}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="写点笔记（味道怎么样、分量如何...）"
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none
                  focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
              <Button onClick={handleRate} disabled={saving} size="sm" className="w-full">
                {saving ? '保存中...' : '提交评价'}
              </Button>
            </div>
          </Card>
        )}

        {/* 历史评价列表 */}
        {ratingsLoading ? (
          <p className="text-gray-400 text-sm text-center py-5">加载中...</p>
        ) : ratings.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-5">还没有评价记录</p>
        ) : (
          <div className="space-y-2">
            {ratings.map((r) => (
              <Card key={r.id} className="!p-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl">
                    {r.score >= 3 ? '👍' : r.score >= 2 ? '😐' : '👎'}
                  </span>
                  <div className="flex-1 min-w-0">
                    {r.note && <p className="text-sm text-gray-700">{r.note}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(r.createdAt).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
