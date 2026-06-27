// 今天吃什么 - 美团外卖工具脚本
// 用法：Kiwi浏览器打开美团H5 → 地址栏粘贴以下代码 → 回车
// javascript:(function(){var s=document.createElement('script');s.src='URL';document.head.appendChild(s);})()

(function () {
  if (document.getElementById('wte-loaded')) return;
  document.getElementById('wte-loaded') || (window._wte_loaded = true);

  const API_BASE = 'https://what-to-eat-production-35c2.up.railway.app';
  const TOKEN = 'wte_' + Date.now().toString(36);

  function createButton(text, bg, onClick) {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = 'background:'+bg+';color:#fff;border:none;padding:10px 14px;border-radius:20px;font-size:13px;font-weight:bold;margin:4px;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.2);';
    btn.onclick = onClick;
    return btn;
  }

  function scrapeShops() {
    const shops = [];
    const seen = new Set();
    document.querySelectorAll('[class*="shop"], [class*="restaurant"], [class*="poi"], [class*="store"], [class*="Shop"]').forEach(el => {
      const name = el.textContent.trim().slice(0, 40);
      if (name.length > 2 && !seen.has(name)) { seen.add(name); shops.push(name); }
    });
    if (shops.length === 0) {
      alert('未识别到店铺。请在美团H5店铺列表页使用。\nh5.waimai.meituan.com');
      return;
    }
    const json = JSON.stringify({ shops: shops.map(n => ({ name: n, platform: '美团外卖' })), count: shops.length }, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('已复制 ' + shops.length + ' 家店铺到剪贴板！\n打开PWA → 设置 → 粘贴导入');
    });
  }

  function scrapeCurrentShop() {
    const title = document.querySelector('h1, [class*="title"], [class*="name"], [class*="shop-name"]');
    const shopName = title ? title.textContent.trim().slice(0, 40) : '未知店铺';
    const dishes = [];
    document.querySelectorAll('[class*="food"], [class*="menu-item"], [class*="dish"], [class*="product"], [class*="goods"]').forEach(el => {
      const n = el.querySelector('[class*="name"], span');
      if (n) dishes.push(n.textContent.trim().slice(0, 30));
    });
    const json = JSON.stringify({ shop: { name: shopName, platform: '美团外卖' }, dishes: dishes.slice(0, 20) }, null, 2);
    navigator.clipboard.writeText(json).then(() => {
      alert('已复制「' + shopName + '」及 ' + dishes.length + ' 道菜品！\n打开PWA → 设置 → 粘贴导入');
    });
  }

  async function analyzeReviews() {
    let count = 0;
    const comments = document.querySelectorAll('[class*="comment"], [class*="review"], [class*="evaluate"], [class*="rating"]');
    for (const el of comments) {
      if (el.dataset.wte) continue;
      el.dataset.wte = '1';
      const text = el.textContent.trim().slice(0, 1000);
      if (text.length < 4) continue;
      try {
        const resp = await fetch(API_BASE + '/api/analyze-review', {
          method: 'POST', headers: {'Content-Type':'application/json'},
          body: JSON.stringify({text, user_token: TOKEN})
        });
        if (!resp.ok) continue;
        const d = await resp.json();
        const badge = document.createElement('span');
        badge.style.cssText = 'display:inline-block;margin-left:4px;padding:1px 6px;border-radius:10px;font-size:11px;font-weight:bold;' +
          (d.is_fake ? 'background:#fee2e2;color:#dc2626;' : 'background:#dcfce7;color:#16a34a;');
        badge.textContent = d.is_fake ? '可疑' + Math.round(d.confidence*100) + '%' : '可信';
        el.appendChild(badge);
        count++;
      } catch(e) {}
    }
    if (count > 0) alert('已分析 ' + count + ' 条评论');
  }

  // 注入面板
  const panel = document.createElement('div');
  panel.id = 'wte-loaded';
  panel.style.cssText = 'position:fixed;bottom:100px;right:12px;z-index:99999;display:flex;flex-direction:column;gap:6px;font-family:sans-serif;';
  panel.appendChild(createButton('📋 抓取店铺', '#f97316', scrapeShops));
  panel.appendChild(createButton('🍜 抓取菜品', '#fb923c', scrapeCurrentShop));
  panel.appendChild(createButton('🔍 分析评论', '#ef4444', analyzeReviews));
  document.body.appendChild(panel);
})();
