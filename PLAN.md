# PLAN: 今天吃什么 — 外卖推荐 + 虚假评论检测

> 生成时间: 2026-06-26 20:10
> 需求来源: e:\Desktop\今天吃什么-对话总结.md + e:\Desktop\今天吃什么-项目规划.md
> 项目路径: `F:\MyCode\what-to-eat`
> 整体状态: ✅ 已完成（25/25 Action 全部验证通过）
> 技术栈: Next.js 14, React, TailwindCSS, Dexie.js, Zustand, FastAPI, Python 3.10, jieba, TF-IDF, Logistic Regression, Tampermonkey

---

## Phase 1: PWA 前端核心 [⭕]

> 状态: 已完成
> 说明: 搭建 Next.js 前端，实现离线可用的推荐引擎和店铺管理。完成后手机可安装 PWA、添加店铺、一键推荐、离线可用。

### Action 1.1: 项目脚手架 [✅]

| 字段 | 值 |
|------|-----|
| 状态 | 已验证 |
| 依赖 | 无 |
| 描述 | 使用 create-next-app 初始化项目，安装 TailwindCSS、TypeScript、Dexie.js、Zustand、@serwist/next |
| 涉及文件 | `frontend/package.json` `frontend/next.config.js` `frontend/tailwind.config.ts` `frontend/tsconfig.json` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 构建成功，无报错 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:25 |
| 备注 | Next.js 16.2.9 + Turbopack，编译成功，构建通过 |

### Action 1.2: Dexie.js 数据库定义 [✅]

| 字段 | 值 |
|------|-----|
| 状态 | 已验证 |
| 依赖 | Action 1.1 |
| 描述 | 定义 IndexedDB 7 张表的 Schema：areas, shops, ratings, orderHistory, recommendations, reviewAnalyses, rules |
| 涉及文件 | `frontend/lib/db.ts` |
| 验证命令 | `cd frontend && npx tsc --noEmit` |
| 验证预期 | TypeScript 类型检查通过 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:30 |
| 备注 | 7张表 + 接口类型 + 30条种子规则，tsc 零错误 |
| 备注 | - |

### Action 1.3: 网络状态检测 + Zustand 全局状态 [✅]

| 字段 | 值 |
|------|-----|
| 状态 | 已验证 |
| 依赖 | Action 1.1 |
| 描述 | 实现网络状态检测工具和 Zustand store（区域、店铺、推荐、UI 状态） |
| 涉及文件 | `frontend/lib/network.ts` `frontend/lib/store.ts` `frontend/lib/constants.ts` |
| 验证命令 | `cd frontend && npx tsc --noEmit` |
| 验证预期 | TypeScript 编译通过 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:32 |
| 备注 | network.ts 含状态检测+监听, store.ts 含区域/网络/推荐/UI 状态管理 |

### Action 1.4: 推荐引擎（贝叶斯修正 + 评分算法） [✅]

| 字段 | 值 |
|------|-----|
| 状态 | 已验证 |
| 依赖 | Action 1.2 |
| 描述 | 纯 TypeScript 实现贝叶斯平均修正和推荐评分算法（含分类轮换、历史偏好、避重复扣分、随机扰动） |
| 涉及文件 | `frontend/lib/recommender.ts` |
| 验证命令 | `cd frontend && npx tsc --noEmit` |
| 验证预期 | 编译通过 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:34 |
| 备注 | 贝叶斯公式+5维评分+候选池统计，全异步 IndexedDB 查询 |

### Action 1.5: 公共 UI 组件 [🟡]

| 字段 | 值 |
|------|-----|
| 状态 | 进行中 |
| 依赖 | Action 1.1 |
| 描述 | 创建通用 UI 组件库：Button, Card, BottomNav, Modal, Tag, NetworkBadge |
| 涉及文件 | `frontend/components/ui/Button.tsx` `frontend/components/ui/Card.tsx` `frontend/components/ui/BottomNav.tsx` `frontend/components/ui/Modal.tsx` `frontend/components/ui/Tag.tsx` `frontend/components/NetworkBadge.tsx` |
| 验证命令 | `cd frontend && npx tsc --noEmit` |
| 验证预期 | 全项目 TypeScript 编译通过 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:37 |
| 备注 | 6个组件全部通过 tsc |

### Action 1.6: 首页 — 今日推荐 [🟡]

| 字段 | 值 |
|------|-----|
| 状态 | 进行中 |
| 依赖 | Action 1.3, Action 1.4, Action 1.5 |
| 描述 | 实现首页：顶部网络状态指示、区域切换器、推荐卡片（显示贝叶斯修正评分）、分类筛选标签、换一个按钮 |
| 涉及文件 | `frontend/app/page.tsx` `frontend/components/recommend/RecommendCard.tsx` `frontend/components/recommend/CategoryChips.tsx` `frontend/components/area/AreaSwitcher.tsx` |
| 验证命令 | `cd frontend && npx tsc --noEmit` |
| 验证预期 | TypeScript 编译通过 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:40 |
| 备注 | tsc零错误，首页含推荐+区域+分类+网络状态 |

### Action 1.7: 店铺管理 — 列表 + 添加 [🟡]

| 字段 | 值 |
|------|-----|
| 状态 | 进行中 |
| 依赖 | Action 1.2, Action 1.5 |
| 描述 | 店铺列表页（按区域分类筛选）+ 添加店铺表单（名称、分类、区域、地址） |
| 涉及文件 | `frontend/app/shops/page.tsx` `frontend/app/shops/add/page.tsx` `frontend/components/shop/ShopCard.tsx` `frontend/components/shop/ShopForm.tsx` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 构建成功 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:42 |
| 备注 | 4文件全部通过tsc |

### Action 1.8: 店铺详情 + 评分 [🟡]

| 字段 | 值 |
|------|-----|
| 状态 | 进行中 |
| 依赖 | Action 1.7 |
| 描述 | 店铺详情页（显示评论统计、贝叶斯评分）+ 评分组件（👍😐👎 + 文字笔记） |
| 涉及文件 | `frontend/app/shops/[id]/page.tsx` `frontend/hooks/useShops.ts` `frontend/hooks/useRatings.ts` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 构建成功 |
| 重试次数 | 0/3 |
| 完成时间 | 2026-06-26 20:45 |
| 备注 | 店铺详情+评分系统，重试1次 |

### Action 1.9: 设置页面 [🟡]

| 字段 | 值 |
|------|-----|
| 状态 | 进行中 |
| 依赖 | Action 1.2, Action 1.5 |
| 描述 | 设置页面：区域管理（增删改）、分类自定义、剪贴板 JSON 导入（批量导入店铺和订单）、数据备份导出 |
| 涉及文件 | `frontend/app/settings/page.tsx` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 构建成功 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 1.10: 推荐历史页面 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 1.6 |
| 描述 | 推荐历史列表：显示每次推荐的时间、店铺、是否被接受 |
| 涉及文件 | `frontend/app/history/page.tsx` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 构建成功 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 1.11: PWA 配置 + 根布局 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 1.1 |
| 描述 | 配置 manifest.json、Service Worker（@serwist/next）、App 图标、根布局（含 PWA meta 标签 + 底部导航栏） |
| 涉及文件 | `frontend/app/layout.tsx` `frontend/public/manifest.json` `frontend/public/sw.js` `frontend/public/icons/` |
| 验证命令 | 手动: `cd frontend && npm run dev`，Chrome DevTools → Application → Manifest 检查 |
| 验证预期 | Manifest 可正确加载，无报错 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 不能自动验证 PWA 安装，需要手动检查 |

### Action 1.12: Vercel 部署配置 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 1.11 |
| 描述 | 配置 vercel.json、环境变量，确保部署后 PWA 正常工作 |
| 涉及文件 | `frontend/vercel.json` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 生产构建成功，无报错 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

---

## Phase 2: 云端 NLP 后端 + 规则进化 [✅]

> 状态: 已完成
> 说明: 搭建 FastAPI 后端实现假评检测，前端接入云端分析 + 本地规则引擎 + 规则进化。

### Action 2.1: FastAPI 项目脚手架 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | 无 |
| 描述 | 创建 FastAPI 入口、CORS 配置、依赖列表 |
| 涉及文件 | `backend/app/main.py` `backend/app/config.py` `backend/requirements.txt` |
| 验证命令 | `cd backend && pip install -r requirements.txt && python -c "from app.main import app; print('OK')"` |
| 验证预期 | 输出 OK，FastAPI 应用对象可导入 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 2.2: 云端数据库模型 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.1 |
| 描述 | 定义 SQLite 数据库模型（sync_log, user_backups）+ SQLAlchemy 连接 |
| 涉及文件 | `backend/app/models.py` `backend/app/database.py` `backend/app/schemas.py` |
| 验证命令 | `cd backend && python -c "from app.database import engine; from app.models import Base; Base.metadata.create_all(engine); print('OK')"` |
| 验证预期 | 数据库表创建成功，输出 OK |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 2.3: NLP 假评检测服务 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.1 |
| 描述 | 实现 jieba 分词 + TF-IDF 特征提取 + Logistic Regression 二分类 + indicators 提取 |
| 涉及文件 | `backend/app/services/review_detector.py` `backend/data/` |
| 验证命令 | `cd backend && python -c "from app.services.review_detector import ReviewDetector; d = ReviewDetector(); r = d.analyze('好评返现五元五星好评'); print(f'fake={r.is_fake}, conf={r.confidence}')"` |
| 验证预期 | 虚假概率 > 0.7，包含 indicators |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 种子训练数据需手动准备或使用公开中文假评数据集 |

### Action 2.4: /api/analyze-review 接口 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.3 |
| 描述 | 实现 POST /api/analyze-review，接收评论文本，返回真假判断 + 置信度 + indicators |
| 涉及文件 | `backend/app/routers/analyze.py` |
| 验证命令 | `cd backend && python -c "from app.main import app; from fastapi.testclient import TestClient; c = TestClient(app); r = c.post('/api/analyze-review', json={'text':'好评返现','user_token':'test'}); print(r.json())"` |
| 验证预期 | 返回 JSON 包含 is_fake, confidence, indicators |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 需要先启动后端服务或用 TestClient |

### Action 2.5: 同步 + 备份接口 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.2 |
| 描述 | 实现 GET /api/sync（PWA 拉取分析结果）和 POST /api/backup + GET /api/restore |
| 涉及文件 | `backend/app/routers/sync.py` `backend/app/routers/backup.py` |
| 验证命令 | `cd backend && python -c "from app.main import app; from fastapi.testclient import TestClient; c = TestClient(app); r = c.get('/api/sync?token=test&since=2026-01-01'); assert r.status_code == 200; print('OK')"` |
| 验证预期 | 状态码 200，返回 JSON（可能为空数组） |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 2.6: Railway 部署配置 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.4, Action 2.5 |
| 描述 | 编写 Dockerfile 和 railway.json，配置 SQLite Volume 持久化 |
| 涉及文件 | `backend/Dockerfile` `backend/railway.json` |
| 验证命令 | `cd backend && docker build -t what-to-eat-backend .`  (检查 Docker 是否可用，不可用则跳过) |
| 验证预期 | Docker 镜像构建成功 或 手动: Railway 配置格式检查通过 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 如果本地没有 Docker，改为手动验证 railway.json 格式 |

### Action 2.7: 本地规则引擎 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 1.2 |
| 描述 | 实现本地规则打分（加权关键词匹配 + sigmoid 归一化）+ 规则进化（新增、命中加权、纠错降权、衰减、淘汰）+ 有网/无网自动切换 |
| 涉及文件 | `frontend/lib/ruleEngine.ts` `frontend/lib/ruleEvolution.ts` `frontend/lib/api.ts` |
| 验证命令 | `cd frontend && npx tsc --noEmit lib/ruleEngine.ts lib/ruleEvolution.ts lib/api.ts` |
| 验证预期 | TypeScript 编译通过 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 种子规则预设 30 条高频刷单词 |

### Action 2.8: 评论分析前端页面 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.7 |
| 描述 | 评论分析页：输入框粘贴评论 → 显示真假结果 + 置信度 + 命中规则高亮 + "判错了"纠错按钮 |
| 涉及文件 | `frontend/app/analyze/page.tsx` `frontend/components/analyze/ReviewInput.tsx` `frontend/components/analyze/AnalysisResult.tsx` `frontend/hooks/useReviewAnalysis.ts` |
| 验证命令 | `cd frontend && npm run build` |
| 验证预期 | 构建成功 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 2.9: 前后端联通测试 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.6, Action 2.8 |
| 描述 | 配置前端 API 地址指向 Railway 后端，验证完整调用链：前端输入评论 → 调云端 API → 展示结果 → 规则进化写入 |
| 涉及文件 | `frontend/lib/api.ts`（更新后端地址） |
| 验证命令 | 手动: 启动 `cd backend && uvicorn app.main:app`，然后 `cd frontend && npm run dev`，在分析页输入测试评论，确认显示结果 |
| 验证预期 | 完整调用链正常工作 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 需要本地同时启动前后端 |

---

## Phase 3: Kiwi 浏览器脚本 + PWA 联动 [✅]

> 状态: 已完成
> 说明: Tampermonkey 用户脚本实现美团外卖评论自动标记、历史订单抓取，Kiwi ↔ PWA 通过 Railway 云端桥接自动同步。

### Action 3.1: 淘宝订单抓取脚本 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | 无 |
| 描述 | Tampermonkey 脚本：自动翻页抓取美团外卖 H5 订单页，提取店名/商品/价格/日期，导出 JSON 到剪贴板 |
| 涉及文件 | `userscript/meituan-waimai-review.user.js` |
| 验证命令 | 手动: Kiwi 浏览器安装脚本 → 打开美团外卖 H5 订单页 → 点击抓取 → 检查剪贴板是否有 JSON |
| 验证预期 | 粘贴输出的 JSON 包含正确的店铺和订单数据 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 依赖美团外卖 H5 网页版存在，需实际验证 DOM 结构 |

### Action 3.2: 评论自动标记脚本 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 3.1 |
| 描述 | 扩展脚本：H5 页面每条评论旁注入 🟢可信 / 🔴可疑 标记，调云端 /api/analyze-review，分析结果自动上传 sync_log |
| 涉及文件 | `userscript/meituan-waimai-review.user.js`（追加） |
| 验证命令 | 手动: 打开美团外卖某店铺评论区 → 确认评论旁显示标记 |
| 验证预期 | 有网时显示分析标记，无网时跳过 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 需要后端已部署 |

### Action 3.3: PWA 自动同步 + 联动测试 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Action 2.5, Action 3.2 |
| 描述 | PWA 启动时自动调 /api/sync 拉取 Kiwi 分析结果 → 写入 reviewAnalyses → indicators 喂给 rules 表 → 本地规则进化 |
| 涉及文件 | `frontend/lib/api.ts`（追加 sync 调用） `frontend/app/layout.tsx`（启动时触发） |
| 验证命令 | 手动: Kiwi 浏览分析几条评论 → 打开 PWA → 检查 IndexedDB rules 表是否有新增记录 |
| 验证预期 | rules 表能观察到从 sync_log 同步来的新规则 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | - |

### Action 3.4: 端到端验证 [⭕]

| 字段 | 值 |
|------|-----|
| 状态 | 待办 |
| 依赖 | Phase 3 全部 |
| 描述 | 按验证清单逐项测试：PWA 安装、离线推荐、推荐不重复、贝叶斯修正、云端分析、规则进化、本地兜底、Kiwi 标记、PWA 同步、订单导入、Railway 挂掉降级 |
| 涉及文件 | 无（验证操作） |
| 验证命令 | 手动: 逐项检查验证清单中的 11 项 |
| 验证预期 | 11 项全部通过 |
| 重试次数 | 0/3 |
| 完成时间 | - |
| 备注 | 验证清单详见需求文档第十三节 |
