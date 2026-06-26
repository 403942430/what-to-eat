"""数据同步接口"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import SyncLog
from app.schemas import AnalyzeResponse, Indicator
from datetime import datetime

router = APIRouter()

@router.get("/sync")
def sync_data(
    token: str = Query(...),
    since: str | None = Query(None),
    db: Session = Depends(get_db),
):
    """PWA 拉取 Kiwi 分析结果"""
    query = db.query(SyncLog).filter(
        SyncLog.user_token == token,
        SyncLog.synced == False,
    )
    if since:
        try:
            since_dt = datetime.fromisoformat(since)
            query = query.filter(SyncLog.analyzed_at > since_dt)
        except ValueError:
            pass

    logs = query.order_by(SyncLog.analyzed_at.asc()).limit(200).all()

    analyses = []
    for log in logs:
        analyses.append({
            "id": log.id,
            "text": log.text,
            "is_fake": log.is_fake,
            "confidence": log.confidence,
            "indicators": log.indicators or [],
            "analyzed_at": log.analyzed_at.isoformat() if log.analyzed_at else "",
        })
        log.synced = True

    db.commit()
    return {"analyses": analyses}
