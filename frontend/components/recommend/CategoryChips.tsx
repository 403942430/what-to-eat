'use client';

import Tag from '@/components/ui/Tag';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface CategoryChipsProps {
  selected: string;
  onSelect: (cat: string) => void;
}

const CAT_EMOJI: Record<string, string> = {
  饭: '🍚', 面: '🍜', 粉: '🍝', 炸鸡: '🍗',
  奶茶: '🥤', 麻辣烫: '🫕', 烧烤: '🍖', 饺子: '🥟',
  粥: '🥣', 其他: '🍽️',
};

export default function CategoryChips({ selected, onSelect }: CategoryChipsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      <Tag
        label="全部"
        active={selected === ''}
        onClick={() => onSelect('')}
      />
      {DEFAULT_CATEGORIES.map((cat) => (
        <Tag
          key={cat}
          label={`${CAT_EMOJI[cat] || ''} ${cat}`}
          active={selected === cat}
          onClick={() => onSelect(cat)}
        />
      ))}
    </div>
  );
}
