"""数据备份接口"""
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import UserBackup
from app.schemas import BackupRequest

router = APIRouter()

@router.post("/backup")
def create_backup(req: BackupRequest, db: Session = Depends(get_db)):
    backup = UserBackup(user_token=req.token, data_json=req.data_json)
    db.add(backup)
    db.commit()
    return {"ok": True}

@router.get("/restore")
def restore_backup(
    token: str = Query(...),
    db: Session = Depends(get_db),
):
    backup = (
        db.query(UserBackup)
        .filter(UserBackup.user_token == token)
        .order_by(UserBackup.created_at.desc())
        .first()
    )
    if not backup:
        return {"data_json": None}
    return {"data_json": backup.data_json}
