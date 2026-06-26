'use client';

import { useEffect } from 'react';
import { db } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import Tag from '@/components/ui/Tag';

export default function AreaSwitcher() {
  const areas = useAppStore((s) => s.areas);
  const activeId = useAppStore((s) => s.activeAreaId);
  const setAreas = useAppStore((s) => s.setAreas);
  const setActive = useAppStore((s) => s.setActiveArea);

  useEffect(() => {
    db.areas.toArray().then((list) => {
      setAreas(list);
      if (list.length > 0 && !activeId) {
        setActive(list[0].id!);
      }
    });
  }, []);

  if (areas.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {areas.map((a) => (
        <Tag
          key={a.id}
          label={a.name}
          active={a.id === activeId}
          onClick={() => setActive(a.id!)}
        />
      ))}
    </div>
  );
}
