from datetime import datetime, timedelta, timezone
from typing import Annotated
from fastapi.middleware.cors import CORSMiddleware
import jwt, sqlite3, secrets, time
from fastapi import Depends, FastAPI, HTTPException, Request, status, Response
from jwt.exceptions import InvalidTokenError
from pwdlib import PasswordHash
from models.cookieUser import CookieUser, CookieUserDTO, CookieUserLoginDTO, CookieUserProfileDTO
from models.item import ItemDTO
from models.pod import PodCreateDTO


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



@app.post("/login")
async def login_for_access_token(
    userData: CookieUserLoginDTO,
    response: Response,
):
    is_admin = False
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
        return {"msg": True, "birthday": user.birthday}
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

@app.get("/allusers")
async def get_all_users(token : Annotated[str, Depends(get_token_from_request)]):
    if(not token):
        raise HTTPException(status_code=401, detail="Unauthorized")
    
    query = """
    SELECT * FROM cookie_user
    """
    cur.execute(query)
    users = cur.fetchall()
    return users

@app.get("/items")
async def get_all_items(
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    query = """
    SELECT id, item_name, user_id, upper_price, lower_price, link, description FROM item WHERE user_id = ?
    """
    cur.execute(query, (current_user.id,))
    items = cur.fetchall()
    
    # For each item, get the pods it belongs to
    result = []
    for item in items:
        item_dict = dict(item)
        
        # Get pods this item is in
        pod_query = """
        SELECT p.id, p.name
        FROM pod p
        JOIN item_in_pod iip ON p.id = iip.pod_id
        WHERE iip.item_id = ?
        """
        cur.execute(pod_query, (item["id"],))
        pod_rows = cur.fetchall()
        
        item_dict["pods"] = [{"id": row["id"], "name": row["name"]} for row in pod_rows]
        result.append(item_dict)
    
    return result

@app.post("/item")
async def create_item(
    itemData: ItemDTO,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        query = "INSERT INTO item (item_name, user_id, upper_price, lower_price, link, description) VALUES (?, ?, ?, ?, ?, ?)"
        cur.execute(query, (itemData.item_name, current_user.id, itemData.upper_price, itemData.lower_price, itemData.link, itemData.description))
        con.commit()
        return {"msg": "Item created successfully", "item_id": cur.lastrowid}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create item: {str(e)}")
    
@app.put("/item")
async def update_item(
    itemData: ItemDTO,
    item_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        query = "UPDATE item SET item_name = ?, upper_price = ?, lower_price = ?, link = ?, description = ? WHERE id = ? AND user_id = ?"
        cur.execute(query, (itemData.item_name, itemData.upper_price, itemData.lower_price, itemData.link, itemData.description, item_id, current_user.id))
        con.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found or not owned by user")
        return {"msg": "Item updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update item: {str(e)}")
    
@app.delete("/item")
async def delete_item(
    item_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        query = "DELETE FROM item WHERE id = ? AND user_id = ?"
        cur.execute(query, (item_id, current_user.id))
        con.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found or not owned by user")
        return {"msg": "Item deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete item: {str(e)}")
    
@app.get("/profile")
async def get_user_profile(
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    return CookieUserProfileDTO(
        id=current_user.id,
        username=current_user.username,
        first_name=current_user.first_name,
        surname=current_user.surname,
        birthday=current_user.birthday
    )
    
    
@app.delete("/user")
async def delete_user(
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
    response: Response,
):
    try:
        query = "DELETE FROM cookie_user WHERE id = ?"
        cur.execute(query, (current_user.id,))
        con.commit()
        
        if cur.rowcount == 0:
            response.delete_cookie(key="access_token")
            raise HTTPException(status_code=404, detail="User not found")
        return {"msg": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete user: {str(e)}")
    
@app.post("/item/pod")
async def add_item_to_pod(
    item_id: int,
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the item belongs to the current user
        item_check_query = "SELECT * FROM item WHERE id = ? AND user_id = ?"
        cur.execute(item_check_query, (item_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Item does not belong to the current user")

        # Check if the user is a member of the pod
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Not a member of this pod")

        # Add the item to the pod
        insert_query = "INSERT INTO item_in_pod (item_id, pod_id, purchased_by) VALUES (?, ?, ?)"
        cur.execute(insert_query, (item_id, pod_id, None))
        con.commit()
        return {"msg": "Item added to pod successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add item to pod: {str(e)}")
    
    
@app.delete("/item/pod")
async def remove_item_from_pod(
    item_id: int,
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the item belongs to the current user
        item_check_query = "SELECT * FROM item WHERE id = ? AND user_id = ?"
        cur.execute(item_check_query, (item_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Item does not belong to the current user")

        # Check if the user is a member of the pod
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Not a member of this pod")

        # Remove the item from the pod
        delete_query = "DELETE FROM item_in_pod WHERE item_id = ? AND pod_id = ?"
        cur.execute(delete_query, (item_id, pod_id))
        con.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found in the specified pod")
        return {"msg": "Item removed from pod successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove item from pod: {str(e)}")

@app.delete("/pod")
async def delete_pod(
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the current user is the owner of the pod
        owner_check_query = "SELECT * FROM pod WHERE id = ? AND owner_id = ?"
        cur.execute(owner_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Only the pod owner can delete the pod")

        # Delete the pod
        delete_query = "DELETE FROM pod WHERE id = ?"
        cur.execute(delete_query, (pod_id,))
        con.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Pod not found")
        return {"msg": "Pod deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete pod: {str(e)}")

@app.get("/pod/ownership")
async def check_pod_ownership(
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        owner_check_query = "SELECT * FROM pod WHERE owner_id = :owner_id"
        cur.execute(owner_check_query, {"owner_id": current_user.id})
        rows = cur.fetchall()
        return {"owned_pods": [dict(row) for row in rows]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to check pod ownership: {str(e)}")
    
@app.post("/pod/members")
async def add_member_to_pod(
    pod_id: int,
    member_ids: list[int],
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the current user is the owner of the pod
        owner_check_query = "SELECT * FROM pod WHERE id = ? AND owner_id = ?"
        cur.execute(owner_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Only the pod owner can add members")

        # Check if the member to add exists
        user_check_query = "SELECT * FROM cookie_user WHERE id = ?"
        for member_id in member_ids:
            cur.execute(user_check_query, (member_id,))
            if cur.fetchone() is None:
                raise HTTPException(status_code=404, detail=f"User to add with ID {member_id} not found")

        # Add the member to the pod
        insert_query = "INSERT INTO pod_member (pod_id, user_id) VALUES (?, ?)"
        for member_id in member_ids:
            cur.execute(insert_query, (pod_id, member_id))
        con.commit()
        return {"msg": "Member added to pod successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add member to pod: {str(e)}")
    
@app.delete("/pod/members")
async def remove_member_from_pod(
    pod_id: int,
    member_ids: list[int],
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the current user is the owner of the pod
        owner_check_query = "SELECT * FROM pod WHERE id = ? AND owner_id = ?"
        cur.execute(owner_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Only the pod owner can remove members")

        # Remove the member from the pod
        delete_query = "DELETE FROM pod_member WHERE pod_id = ? AND user_id = ?"
        for member_id in member_ids:
            cur.execute(delete_query, (pod_id, member_id))
        con.commit()
        cleanup_items_query = "DELETE FROM item_in_pod WHERE pod_id = ? AND item_id IN (SELECT id FROM item WHERE user_id = ?)"
        for member_id in member_ids:
            cur.execute(cleanup_items_query, (pod_id, member_id))
        con.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Member not found in the specified pod")
        return {"msg": "Member removed from pod successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove member from pod: {str(e)}")
    
@app.get("/pod/info/{pod_id}")
async def get_pod_info(
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the user is a member of the pod
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Not a member of this pod")

        # Get pod info
        pod_info_query = "SELECT * FROM pod WHERE id = ?"
        cur.execute(pod_info_query, (pod_id,))
        pod_row = cur.fetchone()
        if pod_row is None:
            raise HTTPException(status_code=404, detail="Pod not found")
        
        # Get pod members with their names
        get_pod_users_query = """
        SELECT cu.id, cu.first_name, cu.surname 
        FROM cookie_user cu
        JOIN pod_member pm ON cu.id = pm.user_id
        WHERE pm.pod_id = ?
        """
        cur.execute(get_pod_users_query, (pod_id,))
        user_rows = cur.fetchall()
        
        members = [{
            "id": row["id"],
            "name": f"{row['first_name']}|{row['surname']}"
        } for row in user_rows]
        
        pod_row = dict(pod_row)
        pod_row["members"] = members

        return dict(pod_row)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get pod info: {str(e)}")
    
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
    items_by_member: dict[tuple[str, str], dict] = {}

    for member_id in member_ids:
        # Get user info
        user_query = "SELECT first_name, surname, birthday FROM cookie_user WHERE id = ?"
        cur.execute(user_query, (member_id,))
        user_row = cur.fetchone()

        if not user_row:
            continue

        first_name = user_row["first_name"]
        surname = user_row["surname"]
        birthday = user_row["birthday"]
        key = (first_name, surname)

        # Get all items for this user that are in this pod
        items_query = """
        SELECT i.id, i.item_name, i.link, i.description, i.purchased, 
               i.upper_price, i.lower_price, iip.purchased_by
        FROM item i
        JOIN item_in_pod iip ON i.id = iip.item_id
        WHERE iip.pod_id = ? AND i.user_id = ?
        """
        cur.execute(items_query, (pod_id, member_id))
        item_rows = cur.fetchall()

        items: list[dict] = []
        for item_row in item_rows:
            items.append({
                "id": item_row["id"],
                "item_name": item_row["item_name"],
                "link": item_row["link"],
                "description": item_row["description"],
                "purchased": bool(item_row["purchased"]),
                "purchased_by": item_row["purchased_by"],
                "upper_price": item_row["upper_price"],
                "lower_price": item_row["lower_price"]
            })

        items_by_member[key] = {
            "birthday": birthday,
            "items": items
        }

    # Serialize tuple keys to a JSON-friendly string format "First|Last"
    result: dict[str, dict] = {f"{k[0]}|{k[1]}": v for k, v in items_by_member.items()}
    return result

@app.post("/item/purchased")
async def mark_item_as_purchased(
    item_id: int,
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the user is a member of the pod
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Not a member of this pod")

        # Mark the item as purchased by the current user
        update_query = "UPDATE item_in_pod SET purchased_by = ? WHERE item_id = ? AND pod_id = ?"
        cur.execute(update_query, (current_user.id, item_id, pod_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found in the specified pod")
        
        # Also update the item table's purchased flag
        update_item_query = "UPDATE item SET purchased = 1 WHERE id = ?"
        cur.execute(update_item_query, (item_id,))
        
        con.commit()
        return {"msg": "Item marked as purchased successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to mark item as purchased: {str(e)}")
    
@app.delete("/item/purchased")
async def unmark_item_as_purchased(
    item_id: int,
    pod_id: int,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        # Check if the user is a member of the pod
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Not a member of this pod")

        # Unmark the item as purchased
        update_query = "UPDATE item_in_pod SET purchased_by = NULL WHERE item_id = ? AND pod_id = ?"
        cur.execute(update_query, (item_id, pod_id))
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Item not found in the specified pod")
        
        # Also update the item table's purchased flag
        # Only set to 0 if this item is not purchased in ANY other pod
        check_other_pods = "SELECT COUNT(*) as count FROM item_in_pod WHERE item_id = ? AND purchased_by IS NOT NULL"
        cur.execute(check_other_pods, (item_id,))
        other_purchases = cur.fetchone()["count"]
        
        if other_purchases == 0:
            update_item_query = "UPDATE item SET purchased = 0 WHERE id = ?"
            cur.execute(update_item_query, (item_id,))
        
        con.commit()
        return {"msg": "Item unmarked as purchased successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to unmark item as purchased: {str(e)}")


@app.post("/pod/invite/{pod_id}")
async def create_pod_invite(
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
    pod_id: int,
    expires_minutes: int = 30,
):
    try:
        # require the user to be a member (or owner) to create an invite
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is None:
            raise HTTPException(status_code=403, detail="Not a member of this pod")

        code = secrets.token_urlsafe(8)  # short, URL-safe code
        now = int(time.time())
        expires_at = now + int(expires_minutes) * 60

        insert_query = """
        INSERT INTO pod_invite (code, pod_id, created_by, created_at, expires_at, used)
        VALUES (?, ?, ?, ?, ?, 0)
        """
        cur.execute(insert_query, (code, pod_id, current_user.id, now, expires_at))
        con.commit()

        return {
            "code": code,
            "link": f"/pod/join/{code}",
            "expires_at": expires_at,
        }
    except HTTPException:
        raise
    except Exception as e:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create invite: {str(e)}")


@app.post("/pod/join/{code}")
async def join_pod_by_code(
    code: str,
    current_user: Annotated[CookieUser, Depends(get_current_active_user)],
):
    try:
        lookup = "SELECT pod_id, expires_at, used FROM pod_invite WHERE code = ?"
        cur.execute(lookup, (code,))
        row = cur.fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Invalid invite code")

        pod_id = row["pod_id"]
        expires_at = row["expires_at"]
        used = row["used"]
        now = int(time.time())

        if expires_at < now:
            raise HTTPException(status_code=400, detail="Invite code expired")
        # optional: treat as one-time use
        if used:
            raise HTTPException(status_code=400, detail="Invite code already used")

        # check membership
        member_check_query = "SELECT * FROM pod_member WHERE pod_id = ? AND user_id = ?"
        cur.execute(member_check_query, (pod_id, current_user.id))
        if cur.fetchone() is not None:
            return {"msg": "User is already a member of the pod"}

        # add member
        add_user_query = "INSERT INTO pod_member (pod_id, user_id) VALUES (?, ?)"
        cur.execute(add_user_query, (pod_id, current_user.id))

        # mark used (optional)
        cur.execute("UPDATE pod_invite SET used = 1 WHERE code = ?", (code,))

        con.commit()
        return {"msg": "User added to pod via invite", "pod_id": pod_id}
    except HTTPException:
        raise
    except Exception as e:
        con.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to join pod via invite: {str(e)}")