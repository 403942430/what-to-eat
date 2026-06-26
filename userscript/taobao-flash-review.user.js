// ==UserScript==
// @name         今天吃什么 - 淘宝闪购助手
// @namespace    what-to-eat
// @version      0.1.0
// @description  抓取历史订单 + 评论真假自动标记
// @author       今天吃什么
// @match        https://*.taobao.com/*
// @match        https://*.tmall.com/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  const API_BASE = 'http://localhost:8000';  // Railway 部署后修改
  const USER_TOKEN = localStorage.getItem('wte_token') || generateToken();
  localStorage.setItem('wte_token', USER_TOKEN);

  function generateToken() {
    return 'wte_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
  }

  // ==================== 订单抓取 ====================
  async function scrapeOrders() {
    const orders = [];
    const rows = document.querySelectorAll('[class*="order"], [class*="OrderItem"], [data-id]');
    if (rows.length === 0) {
      alert('[今天吃什么] 未找到订单元素，可能页面结构已变化');
      return;
    }

    rows.forEach((row) => {
      const nameEl = row.querySelector('[class*="shop"], [class*="Shop"], [class*="store"], [class*="Store"], [class*="title"], [class*="Title"]');
      const priceEl = row.querySelector('[class*="price"], [class*="Price"], [class*="amount"]');
      const dateEl = row.querySelector('[class*="date"], [class*="Date"], [class*="time"]');
      const itemsEl = row.querySelectorAll('[class*="item"], [class*="product"]');

      if (!nameEl) return;
      const shopName = nameEl.textContent.trim();
      const totalPrice = priceEl ? parseFloat(priceEl.textContent.replace(/[^0-9.]/g, '')) || 0 : 0;
      const orderDate = dateEl ? dateEl.textContent.trim() : '';
      const items = [];
      itemsEl.forEach((el) => items.push(el.textContent.trim()));

      orders.push({
        shopName: shopName || '未知店铺',
        items: items.length > 0 ? items : ['未知商品'],
        totalPrice,
        orderDate: orderDate || new Date().toISOString().slice(0, 10),
        platform: '淘宝闪购',
      });
    });

    if (orders.length > 0) {
      const json = JSON.stringify({ orders, exportedAt: new Date().toISOString() }, null, 2);
      GM_setClipboard(json, 'text');
      alert(`[今天吃什么] 已抓取 ${orders.length} 条订单，JSON 已复制到剪贴板！\n打开PWA → 设置 → 粘贴导入`);
    }
  }

  // ==================== 评论标记 ====================
  function markReviews() {
    const comments = document.querySelectorAll('[class*="comment"], [class*="Comment"], [class*="review"], [class*="Review"], [class*="evaluate"]');
    if (comments.length === 0) return;

    comments.forEach(async (el) => {
      if (el.dataset.wteMarked) return;
      el.dataset.wteMarked = '1';

      const text = el.textContent.trim().slice(0, 2000);
      if (text.length < 5) return;

      try {
        const resp = await fetch(`${API_BASE}/api/analyze-review`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, user_token: USER_TOKEN }),
        });
        if (!resp.ok) return;
        const data = await resp.json();

        // 注入标记
        const badge = document.createElement('span');
        badge.style.cssText = `
          display:inline-block;margin-left:6px;padding:2px 8px;border-radius:12px;font-size:12px;font-weight:bold;
          ${data.is_fake
            ? 'background:#fee2e2;color:#dc2626;'
            : 'background:#dcfce7;color:#16a34a;'}
        `;
        badge.textContent = data.is_fake ? '🔴可疑' : '🟢可信';
        el.appendChild(badge);
      } catch {
        // 网络不可达，跳过
      }
    });
  }

  // ==================== 注入控制面板 ====================
  function injectPanel() {
    const panel = document.createElement('div');
    panel.id = 'wte-panel';
    panel.style.cssText = `
      position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:8px;
    `;

    // 抓取订单按钮
    const btnScrape = document.createElement('button');
    btnScrape.textContent = '📋 抓取订单';
    btnScrape.style.cssText = `
      background:#f97316;color:#fff;border:none;padding:10px 16px;border-radius:20px;
      font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(249,115,22,0.3);cursor:pointer;
    `;
    btnScrape.onclick = scrapeOrders;
    panel.appendChild(btnScrape);

    // 标记评论按钮
    const btnMark = document.createElement('button');
    btnMark.textContent = '🔍 标记评论';
    btnMark.style.cssText = `
      background:#fff;color:#f97316;border:2px solid #f97316;padding:10px 16px;border-radius:20px;
      font-size:14px;font-weight:bold;box-shadow:0 2px 8px rgba(0,0,0,0.1);cursor:pointer;
    `;
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

  // 评论页自动标记
  setInterval(markReviews, 3000);
})();
