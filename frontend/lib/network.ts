import { API_BASE_URL, API_TIMEOUT_MS, type NetworkStatus } from './constants';

/**
 * 检测网络连接状态
 * - online: 有网络连接
 * - offline: 无网络连接
 * - cloud-available: 云端 API 可访问
 */
export async function checkNetworkStatus(): Promise<NetworkStatus> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return 'offline';
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    const resp = await fetch(`${API_BASE_URL}/api/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);
    return resp.ok ? 'cloud-available' : 'online';
  } catch {
    // API 不可达，但有网络
    return 'online';
  }
}

/**
 * 监听浏览器 online/offline 事件
 * @param callback 状态变化回调
 * @returns 取消监听的函数
 */
export function watchNetworkChange(
  callback: (status: NetworkStatus) => void
): () => void {
  const handler = () => checkNetworkStatus().then(callback);
  window.addEventListener('online', handler);
  window.addEventListener('offline', handler);
  return () => {
    window.removeEventListener('online', handler);
    window.removeEventListener('offline', handler);
  };
}
