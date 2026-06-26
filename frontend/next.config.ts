import type { NextConfig } from 'next';
import withSerwist from '@serwist/next';

const withPWA = withSerwist({
  swSrc: 'app/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig: NextConfig = withPWA({
  turbopack: {},
});

export default nextConfig;
