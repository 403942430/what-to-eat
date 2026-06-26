'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { db, type Area } from '@/lib/db';
import ShopForm from '@/components/shop/ShopForm';

export default function AddShopPage() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);

  useEffect(() => {
    db.areas.toArray().then(setAreas);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-20 px-4 pt-4">
      <button
        onClick={() => router.back()}
        className="text-gray-400 text-sm mb-4"
      >
        ← 返回
      </button>
      <h1 className="text-lg font-bold mb-4">➕ 添加店铺</h1>
      <ShopForm
        areas={areas}
        onSaved={() => router.push('/shops')}
      />
    </div>
  );
}
