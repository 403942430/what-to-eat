'use client';

import { useEffect, useState } from 'react';
import { db, type Area } from '@/lib/db';
import { useAppStore } from '@/lib/store';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function SettingsPage() {
  const setAreas = useAppStore((s) => s.setAreas);
  const setActive = useAppStore((s) => s.setActiveArea);

  const [areaList, setAreaList] = useState<Area[]>([]);
  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [importJson, setImportJson] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    db.areas.toArray().then(setAreaList);
  }, []);

  const addArea = async () => {
    if (!newName.trim()) return;
    const id = await db.areas.add({
      name: newName.trim(),
      address: newAddr.trim(),
      createdAt: new Date(),
    });
    const updated = await db.areas.toArray();
    setAreaList(updated);
    setAreas(updated);
    setActive(Number(id));
    setNewName('');
    setNewAddr('');
  };

  const delArea = async (id: number) => {
    await db.areas.delete(id);
    const updated = await db.areas.toArray();
    setAreaList(updated);
    setAreas(updated);
    if (updated.length > 0) setActive(updated[0].id!);
  };

  const handleImport = async () => {
    try {
      const data = JSON.parse(importJson);
      let shopCount = 0;
      let orderCount = 0;
      let dishCount = 0;
      let areaCount = 0;

      // 先导入区域（后续店铺需要 areaId）
      if (Array.isArray(data.areas)) {
        for (const a of data.areas) {
          const existing = await db.areas.where('name').equals(a.name).first();
          if (!existing) {
            const id = await db.areas.add({
              name: a.name,
              address: a.address || '',
              createdAt: new Date(),
            });
            // 如果后续 shops 用 areaId 引用，需要做映射
            a._importedId = id;
          } else {
            a._importedId = existing.id;
          }
          areaCount++;
        }
      }
      // 构建 areaName → areaId 映射
      const areaMap = new Map<string, number>();
      (await db.areas.toArray()).forEach((a) => { if (a.id) areaMap.set(a.name, a.id); });

      if (Array.isArray(data.shops)) {
        for (const s of data.shops) {
          // areaName → areaId 自动转换
          const resolvedAreaId = s.areaId ?? (s.areaName ? areaMap.get(s.areaName) : undefined);
          if (!resolvedAreaId) continue; // 跳过没有区域的店铺
          await db.shops.add({
            ...s,
            areaId: resolvedAreaId,
            reviewCount: s.reviewCount ?? 0,
            realReviewCount: s.realReviewCount ?? 0,
            isActive: s.isActive ?? true,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          shopCount++;
        }
      }
      if (Array.isArray(data.orders)) {
        for (const o of data.orders) {
          await db.orderHistory.add({
            ...o,
            items: o.items ?? [],
            platform: o.platform ?? '淘宝闪购',
            orderDate: new Date(o.orderDate),
          });
          orderCount++;
        }
      }
      if (Array.isArray(data.dishes)) {
        // 按 shopName 匹配店铺 ID
        const allShops = await db.shops.toArray();
        for (const d of data.dishes) {
          const shop = allShops.find((s) => s.name === d.shopName);
          if (shop) {
            await db.dishes.add({
              shopId: shop.id!,
              name: d.name,
              orderCount: d.orderCount ?? 0,
              lastOrdered: d.lastOrdered ? new Date(d.lastOrdered) : undefined,
              createdAt: new Date(),
            });
            dishCount++;
          }
        }
      }

      setMsg(`导入成功：${areaCount} 个区域，${shopCount} 家店铺，${dishCount} 道菜品，${orderCount} 条订单`);
      setImportJson('');
      // 通知其他页面刷新数据
      window.dispatchEvent(new Event('data-updated'));
    } catch {
      setMsg('JSON 格式错误，请检查');
    }
  };

  // 一键初始化测试数据
  const handleSeedData = async () => {
    if (!confirm('这将清空现有数据并填入测试数据，确定？')) return;
    setMsg('初始化中...');

    // 清空
    await db.areas.clear();
    await db.shops.clear();
    await db.dishes.clear();

    // 区域
    const homeId = await db.areas.add({ name: '家', address: '某某小区', createdAt: new Date() });
    const workId = await db.areas.add({ name: '公司', address: '某某大厦', createdAt: new Date() });

    // 店铺
    const shopsData = [
      { name: '老王鸡排饭',   category: '饭',   areaId: homeId },
      { name: '阿强麻辣烫',   category: '麻辣烫', areaId: homeId },
      { name: '赵姐炸鸡',     category: '炸鸡',   areaId: homeId },
      { name: '兰州拉面馆',   category: '面',     areaId: homeId },
      { name: '张记饺子馆',   category: '饺子',   areaId: homeId },
      { name: '柳州螺蛳粉',   category: '粉',     areaId: homeId },
      { name: '鲜茶一杯',     category: '奶茶',   areaId: workId },
      { name: '东北烧烤王',   category: '烧烤',   areaId: workId },
      { name: '小刘粥铺',     category: '粥',     areaId: workId },
      { name: '粤式煲仔饭',   category: '饭',     areaId: workId },
    ];
    const shopIds: Record<string, number> = {};
    for (const s of shopsData) {
      const id = await db.shops.add({
        ...s,
        address: s.areaId === homeId ? '某某路' : '某某大厦',
        reviewCount: Math.floor(Math.random() * 300) + 5,
        realReviewCount: Math.floor(Math.random() * 250) + 3,
        platformRating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      shopIds[s.name] = Number(id);
    }

    // 菜品
    const dishesData: [string, string, number][] = [
      ['老王鸡排饭','招牌鸡排饭',15], ['老王鸡排饭','照烧鸡腿饭',10], ['老王鸡排饭','咖喱鸡肉饭',7],
      ['阿强麻辣烫','番茄炸蛋冒菜套餐',12], ['阿强麻辣烫','麻辣牛肉冒菜',8],
      ['赵姐炸鸡','韩式炸鸡半只',9], ['赵姐炸鸡','无骨鸡块',6],
      ['兰州拉面馆','牛肉拉面',20], ['兰州拉面馆','大盘鸡拌面',14], ['兰州拉面馆','炒刀削面',8],
      ['柳州螺蛳粉','原味螺蛳粉',18], ['柳州螺蛳粉','叉烧螺蛳粉',11],
      ['东北烧烤王','羊肉串',25], ['东北烧烤王','烤茄子',16], ['东北烧烤王','烤鸡翅',12],
      ['粤式煲仔饭','腊味煲仔饭',10], ['粤式煲仔饭','滑鸡煲仔饭',7],
      ['鲜茶一杯','珍珠奶茶',20], ['鲜茶一杯','杨枝甘露',14],
    ];
    for (const [shopName, dishName, count] of dishesData) {
      await db.dishes.add({
        shopId: shopIds[shopName],
        name: dishName,
        orderCount: count,
        createdAt: new Date(),
      });
    }

    // 刷新
    const updated = await db.areas.toArray();
    setAreaList(updated);
    setAreas(updated);
    if (updated.length > 0) setActive(updated[0].id!);
    window.dispatchEvent(new Event('data-updated'));
    setMsg(`初始化成功：${updated.length} 个区域，${shopsData.length} 家店铺，${dishesData.length} 道菜品`);
  };

  const handleExport = async () => {
    const [shops, dishes, orders, ratings, rules] = await Promise.all([
      db.shops.toArray(),
      db.dishes.toArray(),
      db.orderHistory.toArray(),
      db.ratings.toArray(),
      db.rules.toArray(),
    ]);
    const blob = new Blob(
      [JSON.stringify({ shops, dishes, orders, ratings, rules, exportedAt: new Date().toISOString() }, null, 2)],
      { type: 'application/json' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `what-to-eat-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 px-4 pt-4">
      <h1 className="text-lg font-bold mb-4">⚙️ 设置</h1>

      {/* 一键初始化 */}
      <Card className="mb-4 !border-orange-200 !bg-orange-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm text-orange-800">🧪 初始化测试数据</h2>
            <p className="text-xs text-orange-500 mt-0.5">清空并填入 2 区域 + 10 店 + 19 菜</p>
          </div>
          <button
            onClick={handleSeedData}
            className="px-4 py-2 bg-orange-500 text-white text-sm font-bold rounded-xl
              hover:bg-orange-600 active:scale-95 transition-all"
          >
            一键初始化
          </button>
        </div>
      </Card>

      {/* 区域管理 */}
      <Card className="mb-4">
        <h2 className="font-bold mb-3">📍 配送区域</h2>
        <div className="space-y-2 mb-3">
          {areaList.map((a) => (
            <div key={a.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
              <div>
                <span className="font-medium text-sm">{a.name}</span>
                <span className="text-xs text-gray-400 ml-2">{a.address}</span>
              </div>
              <button
                onClick={() => delArea(a.id!)}
                className="text-red-400 text-sm"
              >
                删除
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="区域名（如：家）"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <input
            value={newAddr}
            onChange={(e) => setNewAddr(e.target.value)}
            placeholder="地址"
            className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-sm
              focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
          <Button size="sm" onClick={addArea}>添加</Button>
        </div>
      </Card>

      {/* 数据导入 */}
      <Card className="mb-4">
        <h2 className="font-bold mb-3">📥 剪贴板导入</h2>
        <textarea
          value={importJson}
          onChange={(e) => setImportJson(e.target.value)}
          placeholder="粘贴从 Kiwi 脚本导出的 JSON..."
          rows={4}
          className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none
            focus:outline-none focus:ring-2 focus:ring-orange-400 mb-2"
        />
        <Button size="sm" onClick={handleImport} className="w-full">
          导入
        </Button>
        {msg && (
          <p className={`text-sm mt-2 ${msg.includes('成功') ? 'text-green-600' : 'text-red-500'}`}>
            {msg}
          </p>
        )}
      </Card>

      {/* 数据备份 */}
      <Card>
        <h2 className="font-bold mb-3">📤 数据备份</h2>
        <p className="text-sm text-gray-400 mb-3">
          导出全部数据（店铺、订单、评分、规则）为 JSON 文件
        </p>
        <Button variant="secondary" size="sm" onClick={handleExport} className="w-full">
          导出备份
        </Button>
      </Card>
    </div>
  );
}
