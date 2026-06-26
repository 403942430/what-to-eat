import type { Metadata, Viewport } from 'next';
import BottomNav from '@/components/ui/BottomNav';
import SWRegister from '@/components/SWRegister';
import './globals.css';

export const metadata: Metadata = {
  title: '今天吃什么',
  description: '外卖推荐 + 虚假评论检测',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    title: '今天吃什么',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192.svg" />
      </head>
      <body className="min-h-full bg-gray-50 text-gray-900">
        <SWRegister />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
