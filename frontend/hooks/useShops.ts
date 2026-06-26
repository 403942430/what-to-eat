import { useState, useEffect, useCallback } from 'react';
import { db, type Shop } from '@/lib/db';

export function useShops(areaId: number | null) {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!areaId) { setShops([]); setLoading(false); return; }
    setLoading(true);
    db.shops.where('areaId').equals(areaId).toArray().then((list) => {
      setShops(list);
      setLoading(false);
    });
  }, [areaId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { shops, loading, refresh };
}

export function useShop(id: number) {
  const [shop, setShop] = useState<Shop | null>(null);
  useEffect(() => {
    db.shops.get(id).then((s) => setShop(s ?? null));
  }, [id]);
  return shop;
}
