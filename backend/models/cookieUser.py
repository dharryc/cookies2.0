from typing import Optional
from pydantic import BaseModel

class CookieUserDTO(BaseModel):
    username: str
    first_name: str
    surname: str
    birthday: Optional[str] = None
    unhashed_password: str
    
class CookieUser(BaseModel):
    id: int
    username: str
    first_name: str
    surname: str
    birthday: Optional[str] = None
    hashed_password: str
    is_admin: int
    
class CookieUserLoginDTO(BaseModel):
    username: str
    password: str
    
class CookieUserProfileDTO(BaseModel):
    id: int
    username: str
    first_name: str
    surname: str
    birthday: Optional[str] = None
    is_admin: bool

class CookieUserUpdateDTO(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    surname: Optional[str] = None
    birthday: Optional[str] = None