// ==UserScript==
// @name         今天吃什么 - 美团外卖助手
// @namespace    what-to-eat
// @version      0.2.0
// @description  抓取美团外卖H5订单 + 评论真假自动标记
// @author       今天吃什么
// @match        https://h5.waimai.meituan.com/*
// @match        https://waimai.meituan.com/*
// @match        https://i.meituan.com/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function () {
  'use strict';

  const API_BASE = 'https://what-to-eat-production-35c2.up.railway.app';
  const USER_TOKEN = localStorage.getItem('wte_meituan_token') || generateToken();
  localStorage.setItem('wte_meituan_token', USER_TOKEN);

  function generateToken() {
    return 'wte_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ==================== 店铺/订单抓取 ====================
  function scrapeOrders() {
    const orders = [];
    // 美团H5常见选择器
    const selectors = [
      '[class*="order-item"]', '[class*="OrderItem"]', '[class*="order-card"]',
      '[class*="history-item"]', 'li[class*="order"]', '.order-list li',
      '[class*="order-list"] > div',
    ];
    let rows = [];
    for (const sel of selectors) {
      rows = document.querySelectorAll(sel);
      if (rows.length > 0) break;
    }

    if (rows.length === 0) {
      // 尝试从当前页面抓取店铺信息
      scrapeCurrentShop();
      return;
    }

    rows.forEach((row) => {
      const nameEl = row.querySelector('[class*="shop"], [class*="Shop"], [class*="store"], [class*="Store"], [class*="title"], [class*="name"]');
      const priceEl = row.querySelector('[class*="price"], [class*="Price"], [class*="amount"], [class*="total"]');
      if (!nameEl) return;
      orders.push({
        shopName: nameEl.textContent.trim().slice(0, 50),
        totalPrice: priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0,
        items: [],
        orderDate: new Date().toISOString().slice(0, 10),
        platform: '美团外卖',
      });
    });

    if (orders.length > 0) {
      exportJSON({ orders });
    }
  }

  // 抓取当前浏览的店铺
  function scrapeCurrentShop() {
    const shop = {};
    const nameEl = document.querySelector('[class*="shop-name"], [class*="restaurant-name"], [class*="poi-name"], h1');
    if (nameEl) shop.shopName = nameEl.textContent.trim().slice(0, 50);
    // 找菜品
    const foodItems = document.querySelectorAll('[class*="food-item"], [class*="menu-item"], [class*="dish-item"], [class*="product"]');
    const dishes = [];
    foodItems.forEach((item) => {
      const name = item.querySelector('[class*="name"], [class*="title"], span');
      if (name) dishes.push(name.textContent.trim().slice(0, 30));
    });
    if (shop.shopName) {
      exportJSON({ shop: shop, dishes: dishes.slice(0, 20) });
    } else {
      alert('[今天吃什么] 未识别当前页面结构。请在订单列表页或店铺页重试。\n支持：h5.waimai.meituan.com');
    }
  }

  function exportJSON(data) {
    const json = JSON.stringify({ ...data, exportedAt: new Date().toISOString() }, null, 2);
    GM_setClipboard(json, 'text');
    const shopCount = data.orders ? data.orders.length : (data.shop ? 1 : 0);
    const dishCount = data.dishes ? data.dishes.length : 0;
    alert(`[今天吃什么] 已复制到剪贴板！\n店铺: ${shopCount}\n菜品: ${dishCount}\n打开PWA → 设置 → 粘贴导入`);
  }

  // ==================== 评论标记 ====================
  function markReviews() {
    const commentSelectors = [
      '[class*="comment"]', '[class*="Comment"]', '[class*="review"]',
      '[class*="Review"]', '[class*="evaluate"]', '[class*="rating-text"]',
      '[class*="feedback"]',
    ];
    let comments = [];
    for (const sel of commentSelectors) {
      comments = document.querySelectorAll(sel);
      if (comments.length > 0) break;
    }
    if (comments.length === 0) return;

    comments.forEach(async (el) => {
      if (el.dataset.wteMarked) return;
      el.dataset.wteMarked = '1';
      const text = el.textContent.trim().slice(0, 2000);
      if (text.length < 4) return;

      try {
        const resp = await fetch(`${API_BASE}/api/analyze-review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, user_token: USER_TOKEN }),
        });
        if (!resp.ok) return;
        const data = await resp.json();
        const badge = document.createElement('span');
        badge.style.cssText = `
          display:inline-block;margin-left:6px;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold;
          ${data.is_fake ? 'background:#fee2e2;color:#dc2626;' : 'background:#dcfce7;color:#16a34a;'}
        `;
        badge.textContent = data.is_fake ? '🔴可疑(' + Math.round(data.confidence * 100) + '%)' : '🟢可信';
        el.appendChild(badge);
      } catch { /* 网络不可达 */ }
    });
  }

  // ==================== 注入控制面板 ====================
  function injectPanel() {
    if (document.getElementById('wte-panel')) return;
    const panel = document.createElement('div');
    panel.id = 'wte-panel';
    panel.style.cssText = `
      position:fixed;bottom:80px;right:16px;z-index:99999;display:flex;flex-direction:column;gap:8px;
    `;
    const style = 'background:#f97316;color:#fff;border:none;padding:10px 16px;border-radius:20px;font-size:13px;font-weight:bold;box-shadow:0 2px 8px rgba(249,115,22,0.3);cursor:pointer;';

    const btnScrape = document.createElement('button');
    btnScrape.textContent = '📋 抓取';
    btnScrape.style.cssText = style;
    btnScrape.onclick = scrapeOrders;
    panel.appendChild(btnScrape);

    const btnMark = document.createElement('button');
    btnMark.textContent = '🔍 分析评论';
    btnMark.style.cssText = style + 'background:#fff;color:#f97316;border:2px solid #f97316;';
    btnMark.onclick = markReviews;
    panel.appendChild(btnMark);

    document.body.appendChild(panel);
  }

  // ==================== 启动 ====================
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(injectPanel, 1500));
  } else {
    setTimeout(injectPanel, 1500);
  }
  setInterval(markReviews, 4000);
})();
