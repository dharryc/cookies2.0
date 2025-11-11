from pydantic import BaseModel

class CookieUserDTO(BaseModel):
    username: str
    first_name: str
    surname: str
    birthday: str
    unhashed_password: str
    
class CookieUser(BaseModel):
    id: int
    username: str
    first_name: str
    surname: str
    birthday: str
    password_hash: str