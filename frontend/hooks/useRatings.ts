import { useState, useEffect, useCallback } from 'react';
import { db, type Rating } from '@/lib/db';

export function useRatings(shopId: number | undefined) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    if (!shopId) { setRatings([]); setLoading(false); return; }
    setLoading(true);
    db.ratings.where('shopId').equals(shopId).reverse().sortBy('createdAt').then((list) => {
      setRatings(list);
      setLoading(false);
    });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addRating = useCallback(async (
    score: number,
    tags: string[],
    note: string
  ) => {
    if (!shopId) return;
    await db.ratings.add({
      shopId,
      score,
      tags,
      note,
      createdAt: new Date(),
    });
    refresh();
  }, [shopId, refresh]);

  return { ratings, loading, addRating, refresh };
}
