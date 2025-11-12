from datetime import datetime, timedelta, timezone
from typing import Annotated
import jwt, sqlite3
from fastapi import Depends, FastAPI, HTTPException, Request, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from models.cookieUser import CookieUser, CookieUserDTO, CookieUserResponse
from models.item import Item, ItemDTO
from models.itemInPod import ItemInPod, ItemInPodDTO
from models.pod import Pod, PodCreateDTO
from models.podMember import PodMember, PodMemberDTO
from models.priceRange import PriceRange, PriceRangeDTO


# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Database setup
con = sqlite3.connect('storage.db', check_same_thread=False)
con.row_factory = sqlite3.Row
cur = con.cursor()
with open('init.sql', 'r') as f:
    sql_script = f.read()
con.executescript(sql_script)
con.commit()


async def get_token_from_request(request: Request) -> str:
    auth = request.headers.get("Authorization")
    if auth and auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1]
    token = request.cookies.get("access_token")
    if token:
        return token
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )


password_hash = PasswordHash.recommended()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()


def verify_password(plain_password, hashed_password):
    return password_hash.verify(plain_password, hashed_password)


def get_password_hash(password):
    return password_hash.hash(password)


def get_user(username: str):
    query = "SELECT * FROM cookie_user WHERE username = ?"
    cur.execute(query, (username,))
    row = cur.fetchone()
    if row:
        return CookieUser(**dict(row))
    return None


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub") or payload.get("username")
        if not username:
            raise credentials_exception
    except InvalidTokenError:
        raise credentials_exception
    user = get_user(username=username)
    if user is None:
        raise credentials_exception
    return user


async def get_current_active_user(
    current_user: Annotated[CookieUser, Depends(get_current_user)],
):
    if not current_user:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


@app.post("/token")
async def login_for_access_token(
    form_data: Annotated[OAuth2PasswordRequestForm, Depends()],
    response: Response,
):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        # secure=True ### SET THIS IN PROD
    )
    
    return {"msg": "Logged in"}

@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"msg": "Successfully logged out"}

@app.post("/user")
async def create_user_test(userData : Annotated[CookieUserDTO, Depends()],):
    hashed_password = get_password_hash(userData.unhashed_password)
    query = "INSERT INTO cookie_user (username, first_name, surname, birthday, hashed_password) VALUES (?, ?, ?, ?, ?)"
    cur.execute(query, (userData.username, userData.first_name, userData.surname, userData.birthday or None, hashed_password))
    con.commit()
    return {"msg": "User created successfully"}

@app.get("/validate")
async def validate_token(token: Annotated[str, Depends(get_token_from_request)]):
    try:
        jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return  True
    except InvalidTokenError:
        return False