import { create } from 'zustand';
import type { NetworkStatus } from './constants';
import type { Area, Shop } from './db';

/** 应用全局状态 */
interface AppState {
  // ---- 区域 ----
  areas: Area[];
  activeAreaId: number | null;
  setAreas: (areas: Area[]) => void;
  setActiveArea: (id: number) => void;

  // ---- 网络 ----
  networkStatus: NetworkStatus;
  setNetworkStatus: (status: NetworkStatus) => void;

  // ---- 推荐 ----
  /** 已展示过的店铺 ID（换一批时跳过） */
  shownShopIds: Set<number>;
  addShownShop: (id: number) => void;
  clearShownShops: () => void;
  /** 当前选中的分类筛选（空=全部） */
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  // ---- UI 状态 ----
  isOfflineBannerVisible: boolean;
  setOfflineBannerVisible: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // ---- 区域 ----
  areas: [],
  activeAreaId: null,
  setAreas: (areas) => set({ areas }),
  setActiveArea: (id) => set({ activeAreaId: id }),

  // ---- 网络 ----
  networkStatus: 'online',
  setNetworkStatus: (status) => set({ networkStatus: status }),

  // ---- 推荐 ----
  shownShopIds: new Set(),
  addShownShop: (id) => {
    const next = new Set(get().shownShopIds);
    next.add(id);
    set({ shownShopIds: next });
  },
  clearShownShops: () => set({ shownShopIds: new Set() }),
  selectedCategory: '',
  setSelectedCategory: (cat) => set({ selectedCategory: cat }),

  // ---- UI ----
  isOfflineBannerVisible: false,
  setOfflineBannerVisible: (v) => set({ isOfflineBannerVisible: v }),
}));
