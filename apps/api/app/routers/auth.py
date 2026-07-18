"""Auth routes: register + login."""

from __future__ import annotations

import re
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field

from app.services.security import (
    create_token,
    current_user,
    hash_password,
    verify_password,
)
from app.store import UserRecord, store, utcnow

router = APIRouter()

_MOBILE_RE = re.compile(r"^\+?[0-9\s-]{8,20}$")


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    mobile_number: str = Field(min_length=8, max_length=24)
    terms_accepted: bool
    password: str = Field(default="ChangeMe123!", min_length=8, max_length=128)


class LoginRequest(BaseModel):
    identifier: str = Field(min_length=3, max_length=120)
    password: str = Field(min_length=8, max_length=128)


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: dict


def _user_public(user: UserRecord) -> dict:
    return {
        "id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "mobile_number": user.mobile_number,
        "kyc_status": user.kyc.get("status", "not_started"),
        "wallet": (
            {
                "address": user.wallet["address"],
                "status": user.wallet["status"],
            }
            if user.wallet
            else None
        ),
    }


@router.post("/register", response_model=AuthResponse, status_code=201)
def register(body: RegisterRequest) -> AuthResponse:
    if not body.terms_accepted:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Terms & Conditions must be accepted",
        )
    if not _MOBILE_RE.match(body.mobile_number):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid mobile number",
        )
    if store.get_by_email(body.email):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    user = UserRecord(
        id=str(uuid.uuid4()),
        full_name=body.full_name.strip(),
        email=str(body.email).lower(),
        mobile_number=body.mobile_number.strip(),
        password_hash=hash_password(body.password),
        terms_accepted=True,
        created_at=utcnow(),
    )
    store.add_user(user)
    return AuthResponse(access_token=create_token(user), user=_user_public(user))


@router.post("/login", response_model=AuthResponse)
def login(body: LoginRequest) -> AuthResponse:
    user = store.get_by_email(body.identifier.strip())
    if user is None:
        normalized = body.identifier.replace(" ", "")
        for candidate in store.users_by_id.values():
            if candidate.mobile_number.replace(" ", "") == normalized:
                user = candidate
                break
    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email/phone or password",
        )
    return AuthResponse(access_token=create_token(user), user=_user_public(user))


@router.get("/me")
def me(user: UserRecord = Depends(current_user)) -> dict:
    return _user_public(user)
