from typing import Optional
from pydantic import BaseModel


class Token(BaseModel):
    """
    Token schema returned from login
    """
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    """
    Token payload schema for JWT
    """
    sub: Optional[int] = None 