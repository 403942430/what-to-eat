'use client';

import { useEffect, useState, useCallback } from 'react';
import AreaSwitcher from '@/components/area/AreaSwitcher';
import CategoryChips from '@/components/recommend/CategoryChips';
import RecommendCard from '@/components/recommend/RecommendCard';
import NetworkBadge from '@/components/NetworkBadge';
import { useAppStore } from '@/lib/store';
import { recommend, getCandidateCount, type RecommendResult } from '@/lib/recommender';
import { checkNetworkStatus, watchNetworkChange } from '@/lib/network';
import { db, SEED_RULES } from '@/lib/db';

export default function Home() {
  const activeAreaId = useAppStore((s) => s.activeAreaId);
  const networkStatus = useAppStore((s) => s.networkStatus);
  const setNetworkStatus = useAppStore((s) => s.setNetworkStatus);
  const selectedCategory = useAppStore((s) => s.selectedCategory);
  const setSelectedCategory = useAppStore((s) => s.setSelectedCategory);
  const shownShopIds = useAppStore((s) => s.shownShopIds);
  const addShownShop = useAppStore((s) => s.addShownShop);
  const clearShownShops = useAppStore((s) => s.clearShownShops);

  const [result, setResult] = useState<RecommendResult | null>(null);
  const [candidateCount, setCandidateCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [initDone, setInitDone] = useState(false);

  // 初始化：网络检测 + 种子规则写入
  useEffect(() => {
    checkNetworkStatus().then(setNetworkStatus);
    const unwatch = watchNetworkChange(setNetworkStatus);

    // 首次启动写入种子规则（如果规则表为空）
    db.rules.count().then((n) => {
      if (n === 0) {
        db.rules.bulkAdd(SEED_RULES.map((r, i) => ({ ...r, id: i + 1, hitCount: 0 })));
      }
      setInitDone(true);
    });

    return unwatch;
  }, []);

  // 执行推荐
  const doRecommend = useCallback(async () => {
    if (!activeAreaId) return;
    setLoading(true);
    try {
      const excludeIds = Array.from(shownShopIds);
      const res = await recommend(activeAreaId, selectedCategory, excludeIds);
      if (res) {
        setResult(res);
        addShownShop(res.shop.id!);
      }
      const count = await getCandidateCount(activeAreaId, selectedCategory, excludeIds);
      setCandidateCount(count);
    } finally {
      setLoading(false);
    }
  }, [activeAreaId, selectedCategory, shownShopIds]);

  useEffect(() => {
    if (initDone && activeAreaId) {
      doRecommend();
    }
  }, [initDone, activeAreaId, selectedCategory]);

  // 换一个
  const handleReroll = () => doRecommend();

  // 切换分类时重置已展示列表
  const handleCategoryChange = (cat: string) => {
    clearShownShops();
    setSelectedCategory(cat);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-gray-50 pb-20">
      {/* 顶部 */}
      <div className="px-4 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900">
            🏆 今天吃什么
          </h1>
          <p className="text-xs text-gray-400 mt-0.5">每天纠结的终结者</p>
        </div>
        <NetworkBadge status={networkStatus} />
      </div>

      <div className="px-4 space-y-3">
        {/* 区域切换 */}
        <AreaSwitcher />

        {/* 分类筛选 */}
        <CategoryChips selected={selectedCategory} onSelect={handleCategoryChange} />

        {/* 推荐卡片 */}
        {activeAreaId ? (
          result ? (
            <RecommendCard
              result={result}
              candidateCount={candidateCount}
              onReroll={handleReroll}
              loading={loading}
            />
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4 animate-bounce">🤔</div>
              <p className="text-gray-400 font-medium">
                {initDone ? '该区域还没有店铺' : '加载中...'}
              </p>
              <p className="text-gray-300 text-sm mt-1">
                {initDone ? '去 🏪 店铺 添加几家吧' : ''}
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📍</div>
            <p className="text-gray-400 font-medium">还没有配送区域</p>
            <p className="text-gray-300 text-sm mt-1">去 ⚙️ 设置 添加「家」或「公司」</p>
          </div>
        )}
      </div>
    </div>
  );
}
