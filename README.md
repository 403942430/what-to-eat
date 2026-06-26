# 今天吃什么

外卖推荐 + 虚假评论检测 PWA

## 项目结构

- `frontend/` — Next.js PWA 前端
- `backend/` — FastAPI 云端 NLP 后端
- `userscript/` — Tampermonkey 浏览器脚本

## 开发

```bash
# 前端
cd frontend && npm run dev

# 后端
cd backend && uvicorn app.main:app --reload
```
