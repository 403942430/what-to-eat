'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import type { Area, Shop } from '@/lib/db';
import { db } from '@/lib/db';

interface ShopFormProps {
  areas: Area[];
  shop?: Shop;                 // 编辑模式时传入
  onSaved: () => void;
}

export default function ShopForm({ areas, shop, onSaved }: ShopFormProps) {
  const [name, setName] = useState(shop?.name || '');
  const [category, setCategory] = useState(shop?.category || DEFAULT_CATEGORIES[0]);
  const [areaId, setAreaId] = useState(shop?.areaId || (areas[0]?.id || 0));
  const [address, setAddress] = useState(shop?.address || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (areas.length > 0 && !areaId) {
      setAreaId(areas[0].id!);
    }
  }, [areas]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError('请输入店铺名称'); return; }
    setSaving(true);
    setError('');

    try {
      const data = {
        name: name.trim(),
        category,
        areaId,
        address: address.trim(),
        reviewCount: shop?.reviewCount ?? 0,
        realReviewCount: shop?.realReviewCount ?? 0,
        isActive: shop?.isActive ?? true,
        updatedAt: new Date(),
        ...(shop?.platformId ? { platformId: shop.platformId } : {}),
        ...(shop?.platformRating ? { platformRating: shop.platformRating } : {}),
      };

      if (shop?.id) {
        await db.shops.update(shop.id, data);
      } else {
        await db.shops.add({ ...data, createdAt: new Date() } as Shop);
      }
      onSaved();
    } catch (e) {
      setError('保存失败，请重试');
    } finally {
      setSaving(false);
    }
  };

  if (areas.length === 0) {
    return <p className="text-gray-400 text-sm py-8 text-center">请先在设置中添加配送区域</p>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>
      )}

      {/* 店铺名称 */}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">店铺名称</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：老王鸡排饭"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base
            focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      {/* 分类 */}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">分类</label>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${category === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 区域 */}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">配送区域</label>
        <select
          value={areaId}
          onChange={(e) => setAreaId(Number(e.target.value))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base
            focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
        >
          {areas.map((a) => (
            <option key={a.id} value={a.id}>{a.name} — {a.address}</option>
          ))}
        </select>
      </div>

      {/* 地址 */}
      <div>
        <label className="text-sm text-gray-500 mb-1 block">店铺地址（可选）</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="详细地址"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-base
            focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
      </div>

      <Button onClick={handleSubmit} disabled={saving} className="w-full">
        {saving ? '保存中...' : shop ? '保存修改' : '添加店铺'}
      </Button>
    </div>
  );
}
