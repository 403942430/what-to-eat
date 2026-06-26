'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;       // emoji 图标
}

const navItems: NavItem[] = [
  { label: '推荐', href: '/', icon: '🏆' },
  { label: '店铺', href: '/shops', icon: '🏪' },
  { label: '分析', href: '/analyze', icon: '🔍' },
  { label: '设置', href: '/settings', icon: '⚙️' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100
      flex justify-around items-center h-16 safe-area-bottom z-50">
      {navItems.map((item) => {
        const isActive =
          item.href === '/'
            ? pathname === '/'
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-0.5 px-3 py-1
              ${isActive ? 'text-orange-500' : 'text-gray-400'}`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
