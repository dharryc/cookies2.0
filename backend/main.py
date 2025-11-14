from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
import jwt, sqlite3
from fastapi import Depends, FastAPI, HTTPException, Request, status, Response
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from models.cookieUser import CookieUser, CookieUserDTO, CookieUserLoginDTO
from models.item import Item, ItemDTO
from models.itemInPod import ItemInPod, ItemInPodDTO
from models.pod import Pod, PodCreateDTO
from models.podMember import PodMember, PodMemberDTO
from models.priceRange import PriceRange, PriceRangeDTO


# to get a string like this run:
# openssl rand -hex 32
SECRET_KEY = "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 120

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

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
    if verify_password(password, user.hashed_password):
        return user
    return False


def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: Annotated[str, Depends(get_token_from_request)]):
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


@app.post("/login")
async def login_for_access_token(
    userData: CookieUserLoginDTO,
    response: Response,
):
    user = authenticate_user(userData.username, userData.password)
    if not user:
        return False
    query = "SELECT * FROM cookie_user WHERE username = ?"
    cur.execute(query, (userData.username,))
    row = cur.fetchone()
    userData = CookieUser(**dict(row))
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "id": user.id}, expires_delta=access_token_expires
    )

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        samesite="lax",
        # secure=True ### SET THIS IN PROD
    )
    
    return True

@app.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"msg": "Successfully logged out"}

@app.post("/user")
async def create_user_test(user: CookieUserDTO):
    try:
        hashed_password = get_password_hash(user.unhashed_password)
        query = "INSERT INTO cookie_user (username, first_name, surname, birthday, hashed_password) VALUES (?, ?, ?, ?, ?)"
        cur.execute(query, (user.username, user.first_name, user.surname, user.birthday, hashed_password))
        con.commit()
        return {"msg": True}
    except Exception as e:
        return {"msg": "Error creating user"}

@app.get("/validate")
async def validate_token(token: Annotated[str, Depends(get_token_from_request)]):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if(payload.get("exp") - datetime.now(timezone.utc).timestamp() <= 0):
            return False
        if(payload.get("sub") is None):
            return False
        if(payload.get("id") is None):
            return False
        return True
    except InvalidTokenError as e:
        return False
    
@app.post("/new/pod")
async def create_pod(
    podData: PodCreateDTO,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Insert the pod
        query = "INSERT INTO pod (name, owner_id) VALUES (?, ?)"
        cur.execute(query, (podData.name, current_user.id))
        pod_id = cur.lastrowid

        # Add the owner as a member of the pod
        member_query = "INSERT INTO pod_member (pod_id, user_id) VALUES (?, ?)"
        cur.execute(member_query, (pod_id, current_user.id))
        
        added_members = [current_user.id]
        
        # Validate and insert additional members
        if podData.members_to_add_by_id:
            # Remove duplicates while preserving order
            seen = {current_user.id}  # Owner already added
            unique_members = []
            for m in podData.members_to_add_by_id:
                if m in seen:
                    continue
                seen.add(m)
                unique_members.append(m)

            # Check existence of all member ids
            invalid_members = []
            for member_id in unique_members:
                cur.execute("SELECT id FROM cookie_user WHERE id = ?", (member_id,))
                if cur.fetchone() is None:
                    invalid_members.append(member_id)

            if invalid_members:
                raise HTTPException(
                    status_code=400,
                    detail={"msg": "Invalid member ids", "invalid_ids": invalid_members},
                )

            # Insert validated members
            for member_id in unique_members:
                cur.execute(member_query, (pod_id, member_id))
                added_members.append(member_id)
        
        # Commit transaction only if everything succeeded
        con.commit()
        return {
            "msg": "Pod created successfully", 
            "pod_id": pod_id,
            "members_added": added_members
        }
        
    except HTTPException:
        # Rollback on HTTP exceptions (validation failures)
        con.rollback()
        raise
    except Exception as e:
        # Rollback on any other error
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create pod: {str(e)}")

@app.get("/pods")
async def get_user_pods(
    token: Annotated[str, Depends(get_token_from_request)],
):
    data = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    user_id = data.get("id")
    query = "SELECT pod_id FROM pod_member WHERE user_id = ?"
    cur.execute(query, (user_id,))
    rows = cur.fetchall()
    pods = []
    podNames = []
    for row in rows:
        pods.append(row["pod_id"])
    for pod_id in pods:
        podNameQuery = "SELECT name FROM pod WHERE id = ?"
        cur.execute(podNameQuery, (pod_id,))
        pod_name_row = cur.fetchone()
        if pod_name_row:
            pod_name = pod_name_row["name"]
            podNames.append({"pod_id": pod_id, "pod_name": pod_name})
    return podNames

@app.get("/pod/{pod_id}")
async def get_pod_details(
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    # Check if the user is a member of the pod
    member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
    cur.execute(member_check_query, (pod_id, current_user.id))
    if cur.fetchone() is None:
        raise HTTPException(status_code=403, detail="Not a member of this pod")

    # Get all members of the pod (excluding current user)
    members_query = """
    SELECT user_id FROM pod_member WHERE pod_id = ?
    """
    cur.execute(members_query, (pod_id,))
    member_rows = cur.fetchall()
    member_ids = [row["user_id"] for row in member_rows if row["user_id"] != current_user.id]
    
    # Use a Python tuple (first_name, surname) as the internal key
    # Note: JSON object keys must be strings. We will serialize the tuple
    # to a string "first|surname" for the HTTP response while keeping
    # tuple semantics internally.
    items_by_member: dict[tuple[str, str], list] = {}

    for member_id in member_ids:
        # Get user info
        user_query = "SELECT first_name, surname FROM cookie_user WHERE id = ?"
        cur.execute(user_query, (member_id,))
        user_row = cur.fetchone()

        if not user_row:
            continue

        first_name = user_row["first_name"]
        surname = user_row["surname"]
        key = (first_name, surname)

        # Get all items for this user that are in this pod
        items_query = """
        SELECT i.id, i.link, i.description, i.purchased, i.price_range_id, 
               iip.purchased_by, pr.name as price_range_name, pr.min_price, pr.max_price
        FROM item i
        JOIN item_in_pod iip ON i.id = iip.item_id
        LEFT JOIN price_range pr ON i.price_range_id = pr.id
        WHERE iip.pod_id = ? AND i.user_id = ?
        """
        cur.execute(items_query, (pod_id, member_id))
        item_rows = cur.fetchall()

        items: list[dict] = []
        for item_row in item_rows:
            items.append({
                "id": item_row["id"],
                "link": item_row["link"],
                "description": item_row["description"],
                "purchased": bool(item_row["purchased"]),
                "purchased_by": item_row["purchased_by"],
                "price_range": {
                    "id": item_row["price_range_id"],
                    "name": item_row["price_range_name"],
                    "min_price": item_row["min_price"],
                    "max_price": item_row["max_price"]
                } if item_row["price_range_id"] else None
            })

        items_by_member[key] = items

    # Serialize tuple keys to a JSON-friendly string format "First|Last"
    result: dict[str, list] = {f"{k[0]}|{k[1]}": v for k, v in items_by_member.items()}
    return result

@app.get("/allusers")
async def get_all_users():
    query = """
    SELECT * FROM cookie_user
    """
    cur.execute(query)
    users = cur.fetchall()
    return users