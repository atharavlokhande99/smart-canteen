from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import httpx

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'canteen-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRY_DAYS = 7

# Stripe Configuration
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ===================== MODELS =====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: str
    name: str
    role: str = "student"  # student, staff, admin
    picture: Optional[str] = None
    created_at: datetime

class UserCreate(BaseModel):
    email: str
    password: str
    name: str
    role: str = "student"

class UserLogin(BaseModel):
    email: str
    password: str

class MenuItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str
    name: str
    description: str
    price: float
    category: str
    image_url: str
    available: bool = True
    preparation_time: int = 10  # minutes

class TimeSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    slot_id: str
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    max_orders: int = 10
    current_orders: int = 0
    active: bool = True
    created_by: str

class CartItem(BaseModel):
    item_id: str
    quantity: int

class OrderCreate(BaseModel):
    items: List[CartItem]
    slot_id: str
    origin_url: str

class Order(BaseModel):
    model_config = ConfigDict(extra="ignore")
    order_id: str
    user_id: str
    user_name: str
    user_email: str
    items: List[dict]
    total_amount: float
    slot_id: str
    slot_time: str
    status: str = "pending"  # pending, paid, preparing, ready, completed, cancelled
    payment_status: str = "pending"
    payment_session_id: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class TimeSlotCreate(BaseModel):
    date: str
    start_time: str
    end_time: str
    max_orders: int = 10

class UserRoleUpdate(BaseModel):
    role: str

# ===================== AUTH HELPERS =====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "email": email,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRY_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    # Try cookie first
    session_token = request.cookies.get("session_token")
    
    # Then try Authorization header
    if not session_token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            session_token = auth_header.split(" ")[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Check if it's a JWT token
    try:
        payload = jwt.decode(session_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"user_id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        pass  # Not a JWT, try session token
    
    # Check session token in database
    session = await db.user_sessions.find_one({"session_token": session_token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    # Check expiry
    expires_at = session.get("expires_at")
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

def require_role(*roles):
    async def role_checker(request: Request):
        user = await get_current_user(request)
        if user["role"] not in roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return role_checker

# ===================== AUTH ROUTES =====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate, response: Response):
    # Check if user exists
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    hashed_pw = hash_password(user_data.password)
    
    user_doc = {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password_hash": hashed_pw,
        "role": user_data.role if user_data.role in ["student", "staff"] else "student",
        "picture": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user_doc)
    
    # Create JWT token
    token = create_jwt_token(user_id, user_data.email, user_doc["role"])
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRY_DAYS * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "role": user_doc["role"],
        "token": token
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin, response: Response):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="Please use Google login for this account")
    
    if not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = create_jwt_token(user["user_id"], user["email"], user["role"])
    
    response.set_cookie(
        key="session_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=JWT_EXPIRY_DAYS * 24 * 60 * 60
    )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "picture": user.get("picture"),
        "token": token
    }

@api_router.post("/auth/session")
async def exchange_session(request: Request, response: Response):
    """Exchange Emergent OAuth session_id for app session"""
    body = await request.json()
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent Auth API
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id}
        )
    
    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    oauth_data = resp.json()
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": oauth_data["email"]}, {"_id": 0})
    
    if existing_user:
        user_id = existing_user["user_id"]
        role = existing_user["role"]
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": oauth_data["name"],
                "picture": oauth_data.get("picture")
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        role = "student"
        await db.users.insert_one({
            "user_id": user_id,
            "email": oauth_data["email"],
            "name": oauth_data["name"],
            "role": role,
            "picture": oauth_data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat()
        })
    
    # Store session
    session_token = oauth_data.get("session_token", f"session_{uuid.uuid4().hex}")
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7 * 24 * 60 * 60
    )
    
    return {
        "user_id": user_id,
        "email": oauth_data["email"],
        "name": oauth_data["name"],
        "role": role,
        "picture": oauth_data.get("picture"),
        "token": session_token
    }

@api_router.get("/auth/me")
async def get_me(request: Request):
    user = await get_current_user(request)
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "picture": user.get("picture")
    }

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    session_token = request.cookies.get("session_token")
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    
    response.delete_cookie(key="session_token", path="/")
    return {"message": "Logged out successfully"}

# ===================== MENU ROUTES =====================

@api_router.get("/menu")
async def get_menu():
    items = await db.menu_items.find({"available": True}, {"_id": 0}).to_list(100)
    return {"items": items}

@api_router.get("/menu/all")
async def get_all_menu(user: dict = Depends(require_role("staff", "admin"))):
    items = await db.menu_items.find({}, {"_id": 0}).to_list(100)
    return {"items": items}

@api_router.put("/menu/{item_id}/availability")
async def toggle_availability(item_id: str, user: dict = Depends(require_role("staff", "admin"))):
    item = await db.menu_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    await db.menu_items.update_one(
        {"item_id": item_id},
        {"$set": {"available": not item["available"]}}
    )
    return {"message": "Availability updated"}

# ===================== TIME SLOTS ROUTES =====================

@api_router.get("/slots")
async def get_available_slots():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    slots = await db.time_slots.find(
        {"date": {"$gte": today}, "active": True, "$expr": {"$lt": ["$current_orders", "$max_orders"]}},
        {"_id": 0}
    ).sort("date", 1).to_list(100)
    return {"slots": slots}

@api_router.get("/slots/all")
async def get_all_slots(user: dict = Depends(require_role("staff", "admin"))):
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    slots = await db.time_slots.find({"date": {"$gte": today}}, {"_id": 0}).sort([("date", 1), ("start_time", 1)]).to_list(100)
    return {"slots": slots}

@api_router.post("/slots")
async def create_slot(slot_data: TimeSlotCreate, user: dict = Depends(require_role("staff", "admin"))):
    slot_id = f"slot_{uuid.uuid4().hex[:8]}"
    slot_doc = {
        "slot_id": slot_id,
        "date": slot_data.date,
        "start_time": slot_data.start_time,
        "end_time": slot_data.end_time,
        "max_orders": slot_data.max_orders,
        "current_orders": 0,
        "active": True,
        "created_by": user["user_id"]
    }
    await db.time_slots.insert_one(slot_doc)
    return {"slot_id": slot_id, "message": "Slot created"}

@api_router.delete("/slots/{slot_id}")
async def delete_slot(slot_id: str, user: dict = Depends(require_role("staff", "admin"))):
    result = await db.time_slots.delete_one({"slot_id": slot_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Slot not found")
    return {"message": "Slot deleted"}

@api_router.put("/slots/{slot_id}/toggle")
async def toggle_slot(slot_id: str, user: dict = Depends(require_role("staff", "admin"))):
    slot = await db.time_slots.find_one({"slot_id": slot_id}, {"_id": 0})
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    
    await db.time_slots.update_one(
        {"slot_id": slot_id},
        {"$set": {"active": not slot["active"]}}
    )
    return {"message": "Slot toggled"}

# ===================== ORDER ROUTES =====================

@api_router.post("/orders")
async def create_order(order_data: OrderCreate, request: Request):
    user = await get_current_user(request)
    
    # Get slot
    slot = await db.time_slots.find_one({"slot_id": order_data.slot_id}, {"_id": 0})
    if not slot or not slot["active"]:
        raise HTTPException(status_code=400, detail="Invalid or inactive time slot")
    
    if slot["current_orders"] >= slot["max_orders"]:
        raise HTTPException(status_code=400, detail="Time slot is full")
    
    # Calculate total and get item details
    order_items = []
    total = 0.0
    
    for cart_item in order_data.items:
        item = await db.menu_items.find_one({"item_id": cart_item.item_id, "available": True}, {"_id": 0})
        if not item:
            raise HTTPException(status_code=400, detail=f"Item {cart_item.item_id} not available")
        
        order_items.append({
            "item_id": item["item_id"],
            "name": item["name"],
            "price": item["price"],
            "quantity": cart_item.quantity
        })
        total += item["price"] * cart_item.quantity
    
    order_id = f"order_{uuid.uuid4().hex[:10]}"
    
    # Create Stripe checkout session
    from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionRequest
    
    host_url = order_data.origin_url
    webhook_url = f"{str(request.base_url).rstrip('/')}/api/webhook/stripe"
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    success_url = f"{host_url}/order-success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{host_url}/menu"
    
    checkout_request = CheckoutSessionRequest(
        amount=float(total),
        currency="usd",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "order_id": order_id,
            "user_id": user["user_id"],
            "slot_id": order_data.slot_id
        }
    )
    
    session = await stripe_checkout.create_checkout_session(checkout_request)
    
    # Create order document
    now = datetime.now(timezone.utc)
    order_doc = {
        "order_id": order_id,
        "user_id": user["user_id"],
        "user_name": user["name"],
        "user_email": user["email"],
        "items": order_items,
        "total_amount": total,
        "slot_id": order_data.slot_id,
        "slot_time": f"{slot['date']} {slot['start_time']}-{slot['end_time']}",
        "status": "pending",
        "payment_status": "pending",
        "payment_session_id": session.session_id,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    }
    
    await db.orders.insert_one(order_doc)
    
    # Create payment transaction record
    await db.payment_transactions.insert_one({
        "transaction_id": f"txn_{uuid.uuid4().hex[:12]}",
        "order_id": order_id,
        "user_id": user["user_id"],
        "session_id": session.session_id,
        "amount": total,
        "currency": "usd",
        "payment_status": "pending",
        "metadata": {"order_id": order_id, "slot_id": order_data.slot_id},
        "created_at": now.isoformat()
    })
    
    return {"order_id": order_id, "checkout_url": session.url, "session_id": session.session_id}

@api_router.get("/orders/payment-status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    user = await get_current_user(request)
    
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    status = await stripe_checkout.get_checkout_status(session_id)
    
    # Update order and transaction status
    if status.payment_status == "paid":
        order = await db.orders.find_one({"payment_session_id": session_id}, {"_id": 0})
        if order and order["payment_status"] != "paid":
            await db.orders.update_one(
                {"payment_session_id": session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid"}}
            )
            # Increment slot orders
            await db.time_slots.update_one(
                {"slot_id": order["slot_id"]},
                {"$inc": {"current_orders": 1}}
            )
    
    return {
        "status": status.status,
        "payment_status": status.payment_status,
        "amount_total": status.amount_total,
        "currency": status.currency
    }

@api_router.get("/orders/my")
async def get_my_orders(request: Request):
    user = await get_current_user(request)
    orders = await db.orders.find({"user_id": user["user_id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return {"orders": orders}

@api_router.get("/orders/all")
async def get_all_orders(user: dict = Depends(require_role("staff", "admin"))):
    orders = await db.orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return {"orders": orders}

@api_router.get("/orders/pending")
async def get_pending_orders(user: dict = Depends(require_role("staff", "admin"))):
    orders = await db.orders.find(
        {"status": {"$in": ["paid", "preparing"]}},
        {"_id": 0}
    ).sort("created_at", 1).to_list(100)
    return {"orders": orders}

@api_router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, request: Request, user: dict = Depends(require_role("staff", "admin"))):
    body = await request.json()
    new_status = body.get("status")
    
    if new_status not in ["preparing", "ready", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    result = await db.orders.update_one(
        {"order_id": order_id},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return {"message": "Status updated"}

# ===================== WEBHOOK =====================

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    from emergentintegrations.payments.stripe.checkout import StripeCheckout
    
    body = await request.body()
    stripe_signature = request.headers.get("Stripe-Signature")
    
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
    
    try:
        webhook_response = await stripe_checkout.handle_webhook(body, stripe_signature)
        
        if webhook_response.payment_status == "paid":
            await db.orders.update_one(
                {"payment_session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": "paid",
                    "status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {"payment_status": "paid"}}
            )
        
        return {"status": "ok"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

# ===================== ADMIN ROUTES =====================

@api_router.get("/admin/users")
async def get_all_users(user: dict = Depends(require_role("admin"))):
    users = await db.users.find({}, {"_id": 0, "password_hash": 0}).to_list(500)
    return {"users": users}

@api_router.put("/admin/users/{user_id}/role")
async def update_user_role(user_id: str, role_data: UserRoleUpdate, user: dict = Depends(require_role("admin"))):
    if role_data.role not in ["student", "staff", "admin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    
    result = await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"role": role_data.role}}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Role updated"}

@api_router.get("/admin/analytics")
async def get_analytics(user: dict = Depends(require_role("admin"))):
    # Get counts
    total_users = await db.users.count_documents({})
    total_orders = await db.orders.count_documents({})
    paid_orders = await db.orders.count_documents({"payment_status": "paid"})
    
    # Get revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Get orders by status
    status_pipeline = [
        {"$group": {"_id": "$status", "count": {"$sum": 1}}}
    ]
    status_result = await db.orders.aggregate(status_pipeline).to_list(10)
    orders_by_status = {item["_id"]: item["count"] for item in status_result}
    
    # Users by role
    role_pipeline = [
        {"$group": {"_id": "$role", "count": {"$sum": 1}}}
    ]
    role_result = await db.users.aggregate(role_pipeline).to_list(10)
    users_by_role = {item["_id"]: item["count"] for item in role_result}
    
    return {
        "total_users": total_users,
        "total_orders": total_orders,
        "paid_orders": paid_orders,
        "total_revenue": total_revenue,
        "orders_by_status": orders_by_status,
        "users_by_role": users_by_role
    }

# ===================== SEED DATA =====================

@api_router.post("/seed")
async def seed_data():
    """Seed initial menu items and admin user"""
    
    # Check if already seeded
    existing_items = await db.menu_items.count_documents({})
    if existing_items > 0:
        return {"message": "Already seeded"}
    
    # Menu items
    menu_items = [
        {
            "item_id": "item_burger",
            "name": "Classic Burger",
            "description": "Juicy beef patty with fresh lettuce, tomatoes, and special sauce",
            "price": 8.99,
            "category": "Main Course",
            "image_url": "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
            "available": True,
            "preparation_time": 15
        },
        {
            "item_id": "item_pizza",
            "name": "Margherita Pizza",
            "description": "Fresh mozzarella, tomatoes, and basil on thin crust",
            "price": 12.99,
            "category": "Main Course",
            "image_url": "https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=400",
            "available": True,
            "preparation_time": 20
        },
        {
            "item_id": "item_pasta",
            "name": "Creamy Alfredo Pasta",
            "description": "Fettuccine with rich alfredo sauce and parmesan",
            "price": 10.99,
            "category": "Main Course",
            "image_url": "https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400",
            "available": True,
            "preparation_time": 15
        },
        {
            "item_id": "item_salad",
            "name": "Caesar Salad",
            "description": "Crisp romaine, parmesan, croutons with caesar dressing",
            "price": 7.99,
            "category": "Salads",
            "image_url": "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400",
            "available": True,
            "preparation_time": 5
        },
        {
            "item_id": "item_sandwich",
            "name": "Club Sandwich",
            "description": "Triple-decker with turkey, bacon, lettuce, and tomato",
            "price": 9.49,
            "category": "Sandwiches",
            "image_url": "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400",
            "available": True,
            "preparation_time": 10
        },
        {
            "item_id": "item_fries",
            "name": "French Fries",
            "description": "Crispy golden fries with seasoning",
            "price": 3.99,
            "category": "Sides",
            "image_url": "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400",
            "available": True,
            "preparation_time": 8
        },
        {
            "item_id": "item_coffee",
            "name": "Fresh Coffee",
            "description": "Premium brewed coffee, served hot",
            "price": 2.99,
            "category": "Beverages",
            "image_url": "https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400",
            "available": True,
            "preparation_time": 3
        },
        {
            "item_id": "item_smoothie",
            "name": "Berry Smoothie",
            "description": "Mixed berries blended with yogurt and honey",
            "price": 5.99,
            "category": "Beverages",
            "image_url": "https://images.unsplash.com/photo-1553530666-ba11a90a0819?w=400",
            "available": True,
            "preparation_time": 5
        },
        {
            "item_id": "item_brownie",
            "name": "Chocolate Brownie",
            "description": "Rich chocolate brownie with walnuts",
            "price": 4.49,
            "category": "Desserts",
            "image_url": "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400",
            "available": True,
            "preparation_time": 2
        },
        {
            "item_id": "item_wrap",
            "name": "Chicken Wrap",
            "description": "Grilled chicken with veggies in a flour tortilla",
            "price": 8.49,
            "category": "Main Course",
            "image_url": "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400",
            "available": True,
            "preparation_time": 12
        }
    ]
    
    await db.menu_items.insert_many(menu_items)
    
    # Create admin user
    admin_exists = await db.users.find_one({"email": "admin@canteen.com"}, {"_id": 0})
    if not admin_exists:
        admin_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "admin@canteen.com",
            "name": "Admin User",
            "password_hash": hash_password("admin123"),
            "role": "admin",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(admin_user)
    
    # Create staff user
    staff_exists = await db.users.find_one({"email": "staff@canteen.com"}, {"_id": 0})
    if not staff_exists:
        staff_user = {
            "user_id": f"user_{uuid.uuid4().hex[:12]}",
            "email": "staff@canteen.com",
            "name": "Staff Member",
            "password_hash": hash_password("staff123"),
            "role": "staff",
            "picture": None,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(staff_user)
    
    # Create sample time slots for next 3 days
    today = datetime.now(timezone.utc)
    for day_offset in range(3):
        date = (today + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        slots = [
            ("11:00", "11:30"),
            ("11:30", "12:00"),
            ("12:00", "12:30"),
            ("12:30", "13:00"),
            ("13:00", "13:30"),
            ("17:00", "17:30"),
            ("17:30", "18:00"),
            ("18:00", "18:30")
        ]
        for start, end in slots:
            await db.time_slots.insert_one({
                "slot_id": f"slot_{uuid.uuid4().hex[:8]}",
                "date": date,
                "start_time": start,
                "end_time": end,
                "max_orders": 10,
                "current_orders": 0,
                "active": True,
                "created_by": "system"
            })
    
    return {"message": "Data seeded successfully"}

# ===================== STARTUP =====================

@api_router.get("/")
async def root():
    return {"message": "Smart Canteen API", "status": "running"}

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
