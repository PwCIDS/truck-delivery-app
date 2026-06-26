# User management routes

from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database import get_db
from models import User
from schemas import UserResponse, UserUpdate
from auth import get_current_active_user, get_current_admin_user

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("/", response_model=List[UserResponse])
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    全ユーザー取得（管理者のみ）

    管理者権限が必要です。
    """
    users = db.query(User).offset(skip).limit(limit).all()
    return users


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    特定ユーザーの情報を取得

    管理者以外は自分自身の情報のみ取得可能です。
    """
    # 管理者でない場合は自分自身のみアクセス可能
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のユーザーの情報にはアクセスできません"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )

    return user


@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    user_update: UserUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    ユーザー情報を更新

    管理者以外は自分自身の情報のみ更新可能です。
    """
    # 管理者でない場合は自分自身のみ更新可能
    if not current_user.is_admin and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="他のユーザーの情報は更新できません"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )

    # 更新
    if user_update.email is not None:
        user.email = user_update.email

    if user_update.full_name is not None:
        user.full_name = user_update.full_name

    if user_update.password is not None:
        from auth import get_password_hash
        user.hashed_password = get_password_hash(user_update.password)

    db.commit()
    db.refresh(user)

    return user


@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    ユーザーを削除（管理者のみ）

    管理者権限が必要です。
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )

    # 自分自身は削除できない
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身を削除することはできません"
        )

    db.delete(user)
    db.commit()

    return {"message": f"ユーザー '{user.username}' を削除しました"}


@router.post("/{user_id}/toggle-admin")
def toggle_admin_status(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    管理者権限の切り替え（管理者のみ）

    ユーザーの管理者権限をON/OFFします。
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )

    # 自分自身の権限は変更できない
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身の管理者権限は変更できません"
        )

    user.is_admin = not user.is_admin
    db.commit()
    db.refresh(user)

    return {
        "message": f"ユーザー '{user.username}' の管理者権限を{'ON' if user.is_admin else 'OFF'}にしました",
        "is_admin": user.is_admin
    }


@router.post("/{user_id}/toggle-active")
def toggle_active_status(
    user_id: int,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    ユーザーの有効/無効を切り替え（管理者のみ）

    ユーザーの有効/無効状態を切り替えます。
    """
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ユーザーが見つかりません"
        )

    # 自分自身は無効化できない
    if user.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="自分自身を無効化することはできません"
        )

    user.is_active = not user.is_active
    db.commit()
    db.refresh(user)

    return {
        "message": f"ユーザー '{user.username}' を{'有効' if user.is_active else '無効'}にしました",
        "is_active": user.is_active
    }
