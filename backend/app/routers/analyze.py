"""评论分析接口"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas import AnalyzeRequest, AnalyzeResponse, Indicator
from app.services.review_detector import detector
from app.models import SyncLog
from datetime import datetime

router = APIRouter()

@router.post("/analyze-review", response_model=AnalyzeResponse)
def analyze_review(req: AnalyzeRequest, db: Session = Depends(get_db)):
    result = detector.analyze(req.text)

    # 自动存入 sync_log（供 PWA 同步）
    log = SyncLog(
        user_token=req.user_token,
        text=req.text,
        is_fake=result["is_fake"],
        confidence=result["confidence"],
        indicators=result["indicators"],
        analyzed_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()

    return AnalyzeResponse(
        is_fake=result["is_fake"],
        confidence=result["confidence"],
        indicators=[Indicator(**i) for i in result["indicators"]],
    )
