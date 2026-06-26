'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { db, type Shop } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import ShopCard from '@/components/shop/ShopCard';
import CategoryChips from '@/components/recommend/CategoryChips';
import Button from '@/components/ui/Button';
import Tag from '@/components/ui/Tag';

export default function ShopsPage() {
  const activeAreaId = useAppStore((s) => s.activeAreaId);
  const setActiveArea = useAppStore((s) => s.setActiveArea);
  const areas = useAppStore((s) => s.areas);
  const [shops, setShops] = useState<Shop[]>([]);
  const [category, setCategory] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadShops = () => {
    setLoading(true);
    db.shops.toArray().then((list) => {
      setShops(list);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadShops();
    // 监听导入事件，导入后自动刷新
    const handler = () => loadShops();
    window.addEventListener('data-updated', handler);
    return () => window.removeEventListener('data-updated', handler);
  }, []);

  const filtered = useMemo(() => {
    let result = shops.filter((s) => s.isActive);
    if (!showAll && activeAreaId) {
      result = result.filter((s) => s.areaId === activeAreaId);
    }
    if (category) {
      result = result.filter((s) => s.category === category);
    }
    return result;
  }, [shops, showAll, activeAreaId, category]);

  return (
    <div className="min-h-screen  pb-20 px-4 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-lg font-bold">🏪 店铺管理</h1>
        <Link href="/shops/add">
          <Button size="sm">+ 添加</Button>
        </Link>
      </div>

      {/* 区域切换 */}
      <div className="flex gap-2 overflow-x-auto pb-1 mb-2">
        <Tag label="全部" active={showAll} onClick={() => setShowAll(true)} />
        {areas.map((a) => (
          <Tag
            key={a.id}
            label={a.name}
            active={!showAll && a.id === activeAreaId}
            onClick={() => { setShowAll(false); setActiveArea(a.id!); }}
          />
        ))}
      </div>

      {/* 分类筛选 */}
      <CategoryChips selected={category} onSelect={setCategory} />

      {/* 数量提示 */}
      <p className="text-xs text-gray-400 mt-3 mb-2">{filtered.length} 家店铺</p>

      {/* 列表 */}
      {loading ? (
        <p className="text-gray-400 text-sm text-center py-10">加载中...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏪</p>
          <p className="text-sm">还没有店铺，点右上角 + 添加</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((shop) => (
            <ShopCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
}
