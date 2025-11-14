from typing import Optional
from pydantic import BaseModel

class CookieUserDTO(BaseModel):
    username: str
    first_name: str
    surname: str
    birthday: Optional[str] = None
    unhashed_password: str

class CookieUserResponse(BaseModel):
    id: int
    username: str
    first_name: str
    surname: str
    birthday: Optional[str] = None
    
class CookieUser(BaseModel):
    id: int
    username: str
    first_name: str
    surname: str
    birthday: Optional[str] = None
    hashed_password: str
    
class CookieUserLoginDTO(BaseModel):
    username: str
    password: str