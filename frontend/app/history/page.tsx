'use client';

import { useEffect, useState } from 'react';
import { db, type Recommendation, type Shop } from '@/lib/db';
import Card from '@/components/ui/Card';
import { useRouter } from 'next/navigation';

interface HistoryItem extends Recommendation {
  shopName: string;
  shopCategory: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const recs = await db.recommendations.orderBy('createdAt').reverse().limit(50).toArray();
      const result: HistoryItem[] = [];
      for (const r of recs) {
        const shop = await db.shops.get(r.shopId);
        result.push({
          ...r,
          shopName: shop?.name ?? '(已删除)',
          shopCategory: shop?.category ?? '',
        });
      }
      setItems(result);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen  pb-20 px-4 pt-4">
      <h1 className="text-lg font-bold mb-4">📋 推荐历史</h1>

      {loading ? (
        <p className="text-gray-400 text-sm text-center py-10">加载中...</p>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-sm">还没有推荐记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <Card
              key={item.id}
              onClick={() => item.shopId && router.push(`/shops/${item.shopId}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium text-sm">{item.shopName}</span>
                  <span className="text-xs text-gray-400 ml-2">{item.shopCategory}</span>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>{new Date(item.createdAt).toLocaleDateString('zh-CN')}</div>
                  {item.accepted !== undefined && (
                    <div className={item.accepted ? 'text-green-500' : 'text-gray-400'}>
                      {item.accepted ? '已采纳' : '未采纳'}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
