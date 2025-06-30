from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """
    Token schema returned from login
    """
    access_token: str
    refresh_token: Optional[str] = None
    token_type: str


class TokenPayload(BaseModel):
    """
    Token payload schema for JWT
    """
    sub: Optional[int] = None 