'use client';

import type { NetworkStatus } from '@/lib/constants';

interface NetworkBadgeProps {
  status: NetworkStatus;
}

const statusConfig: Record<NetworkStatus, { label: string; color: string; dot: string }> = {
  'cloud-available': {
    label: '在线',
    color: 'bg-green-100 text-green-700 border-green-200',
    dot: 'bg-green-500',
  },
  online: {
    label: '离线分析',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500',
  },
  offline: {
    label: '离线',
    color: 'bg-gray-100 text-gray-500 border-gray-200',
    dot: 'bg-gray-400',
  },
};

export default function NetworkBadge({ status }: NetworkBadgeProps) {
  const config = statusConfig[status];

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs
        border ${config.color} transition-colors duration-300`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}
