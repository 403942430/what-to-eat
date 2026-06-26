'use client';

import Card from '@/components/ui/Card';
import type { Shop } from '@/lib/db';
import { bayesianScore } from '@/lib/recommender';
import { useRouter } from 'next/navigation';

interface ShopCardProps {
  shop: Shop;
}

export default function ShopCard({ shop }: ShopCardProps) {
  const router = useRouter();
  const bScore = bayesianScore(shop);

  return (
    <Card onClick={() => router.push(`/shops/${shop.id}`)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
              {shop.category}
            </span>
            {!shop.isActive && (
              <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full">
                已隐藏
              </span>
            )}
          </div>
          <h3 className="font-bold text-base truncate">{shop.name}</h3>
          <p className="text-sm text-gray-400 truncate mt-0.5">{shop.address}</p>
        </div>
        <div className="text-right ml-3">
          <div className="text-lg font-bold text-orange-500">
            {(bScore * 100).toFixed(0)}
          </div>
          <div className="text-xs text-gray-400">
            {shop.realReviewCount}/{shop.reviewCount}评
          </div>
        </div>
      </div>
    </Card>
  );
}
