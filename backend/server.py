from dotenv import load_dotenv
from pathlib import Path
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import logging
import uuid
import secrets
from datetime import datetime, timezone, timedelta
from typing import Annotated, List, Optional

import bcrypt
import jwt
from bson import ObjectId
from fastapi import APIRouter, Depends, FastAPI, HTTPException, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, BeforeValidator, ConfigDict, EmailStr, Field

# ---------------- Config ----------------
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ["JWT_SECRET"]
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_MINUTES = 60
REFRESH_TOKEN_DAYS = 7
ADMIN_EMAIL = os.environ["ADMIN_EMAIL"].lower()
ADMIN_PASSWORD = os.environ["ADMIN_PASSWORD"]
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Manager")
CORS_ORIGINS = [o.strip() for o in os.environ.get("CORS_ORIGINS", "").split(",") if o.strip()]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("kabul_star")

# ---------------- Types ----------------
PyObjectId = Annotated[str, BeforeValidator(lambda v: str(v) if isinstance(v, ObjectId) else v)]
Role = str  # "manager" | "teacher" | "student"

# ---------------- Password / Token utils ----------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except Exception:
        return False

def create_access_token(user_id: str, email: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "role": role,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_MINUTES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_DAYS),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def set_auth_cookies(response: Response, access: str, refresh: str) -> None:
    response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                        max_age=ACCESS_TOKEN_MINUTES * 60, path="/")
    response.set_cookie("refresh_token", refresh, httponly=True, secure=True, samesite="none",
                        max_age=REFRESH_TOKEN_DAYS * 86400, path="/")

def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")

# ---------------- Models ----------------
class UserPublic(BaseModel):
    id: PyObjectId = Field(alias="_id")
    email: EmailStr
    name: str
    role: str
    active: bool = True
    created_at: Optional[str] = None
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)

class LoginBody(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = None  # optional role hint from UI

class AnnouncementCreate(BaseModel):
    title: str
    description: str
    image_url: Optional[str] = None
    expires_at: Optional[str] = None
    published: bool = True

class AnnouncementUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    expires_at: Optional[str] = None
    published: Optional[bool] = None

class Announcement(BaseModel):
    id: str
    title: str
    description: str
    image_url: Optional[str] = None
    published: bool = True
    published_at: str
    expires_at: Optional[str] = None
    created_by: Optional[str] = None

class ContactInfoUpdate(BaseModel):
    academy_name: Optional[str] = None
    slogan: Optional[str] = None
    motto: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    working_hours: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None

class ContactInfo(ContactInfoUpdate):
    pass

# ---------------- Auth dependency ----------------
async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user or not user.get("active", True):
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def require_role(*roles: str):
    async def _dep(user: dict = Depends(get_current_user)) -> dict:
        if user.get("role") not in roles:
            raise HTTPException(status_code=403, detail="Forbidden: insufficient role")
        return user
    return _dep

# ---------------- App ----------------
app = FastAPI(title="Kabul Star Academy API")
api = APIRouter(prefix="/api")

@api.get("/")
async def root():
    return {"message": "Kabul Star English Language Academy API", "status": "online"}

# ---------- AUTH ----------
@api.post("/auth/login")
async def login(body: LoginBody, response: Response, request: Request):
    email = body.email.lower().strip()
    # Lockout by email (stable behind proxies/ingresses that rotate client IPs)
    ident = f"email:{email}"

    # Brute force check
    now = datetime.now(timezone.utc)
    la = await db.login_attempts.find_one({"identifier": ident})
    if la and la.get("locked_until") and datetime.fromisoformat(la["locked_until"]) > now:
        raise HTTPException(status_code=429, detail="Too many failed attempts. Try again later.")

    user = await db.users.find_one({"email": email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        attempts = (la.get("attempts", 0) if la else 0) + 1
        update = {"attempts": attempts, "updated_at": now.isoformat()}
        if attempts >= 5:
            update["locked_until"] = (now + timedelta(minutes=15)).isoformat()
        await db.login_attempts.update_one(
            {"identifier": ident},
            {"$set": update, "$setOnInsert": {"identifier": ident}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")

    if not user.get("active", True):
        raise HTTPException(status_code=403, detail="Account disabled")

    if body.role and user.get("role") != body.role:
        raise HTTPException(status_code=403, detail=f"This account is not a {body.role}. Please use the correct portal.")

    await db.login_attempts.delete_one({"identifier": ident})

    uid = str(user["_id"])
    access = create_access_token(uid, user["email"], user["role"])
    refresh = create_refresh_token(uid)
    set_auth_cookies(response, access, refresh)

    return {
        "id": uid,
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user["role"],
        "access_token": access,
    }

@api.post("/auth/logout")
async def logout(response: Response, user: dict = Depends(get_current_user)):
    clear_auth_cookies(response)
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return {
        "id": user["_id"],
        "email": user["email"],
        "name": user.get("name", ""),
        "role": user["role"],
        "course_id": user.get("course_id"),
        "current_level": user.get("current_level"),
        "progress": user.get("progress"),
        "phone": user.get("phone"),
        "branch": user.get("branch"),
        "active": user.get("active", True),
    }

@api.post("/auth/refresh")
async def refresh_token(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access = create_access_token(str(user["_id"]), user["email"], user["role"])
        response.set_cookie("access_token", access, httponly=True, secure=True, samesite="none",
                            max_age=ACCESS_TOKEN_MINUTES * 60, path="/")
        return {"ok": True}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

# ---------- ANNOUNCEMENTS ----------
def _serialize_announcement(doc: dict) -> dict:
    return {
        "id": doc.get("id") or str(doc.get("_id")),
        "title": doc["title"],
        "description": doc["description"],
        "image_url": doc.get("image_url"),
        "published": doc.get("published", True),
        "published_at": doc.get("published_at"),
        "expires_at": doc.get("expires_at"),
        "created_by": doc.get("created_by"),
    }

@api.get("/announcements/public")
async def list_public_announcements():
    now_iso = datetime.now(timezone.utc).isoformat()
    cursor = db.announcements.find({
        "published": True,
        "$or": [{"expires_at": None}, {"expires_at": {"$gt": now_iso}}],
    }).sort("published_at", -1).limit(20)
    docs = await cursor.to_list(20)
    return [_serialize_announcement(d) for d in docs]

@api.get("/announcements")
async def list_all_announcements(user: dict = Depends(require_role("manager"))):
    docs = await db.announcements.find().sort("published_at", -1).to_list(500)
    return [_serialize_announcement(d) for d in docs]

@api.post("/announcements", status_code=201)
async def create_announcement(body: AnnouncementCreate, user: dict = Depends(require_role("manager"))):
    doc = {
        "id": str(uuid.uuid4()),
        "title": body.title,
        "description": body.description,
        "image_url": body.image_url,
        "published": body.published,
        "published_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": body.expires_at,
        "created_by": user["_id"],
    }
    await db.announcements.insert_one(doc)
    return _serialize_announcement(doc)

@api.patch("/announcements/{aid}")
async def update_announcement(aid: str, body: AnnouncementUpdate, user: dict = Depends(require_role("manager"))):
    update = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    res = await db.announcements.update_one({"id": aid}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    doc = await db.announcements.find_one({"id": aid})
    return _serialize_announcement(doc)

@api.delete("/announcements/{aid}")
async def delete_announcement(aid: str, user: dict = Depends(require_role("manager"))):
    res = await db.announcements.delete_one({"id": aid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Announcement not found")
    return {"ok": True}

# ---------- SETTINGS / CONTACT ----------
DEFAULT_CONTACT = {
    "academy_name": "Kabul Star English Language Academy",
    "slogan": "Come to Learn, Leave to Serve",
    "motto": "Together for a Brighter Future",
    "phone": "+93 700 000 000",
    "email": "info@kabulstar.edu",
    "address": "Kabul, Afghanistan",
    "working_hours": "Sat - Thu, 7:00 AM - 8:00 PM",
    "facebook": "",
    "instagram": "",
}

@api.get("/settings/contact")
async def get_contact_info():
    doc = await db.settings.find_one({"key": "contact"})
    data = (doc or {}).get("value") or {}
    return {**DEFAULT_CONTACT, **data}

@api.put("/settings/contact")
async def update_contact_info(body: ContactInfoUpdate, user: dict = Depends(require_role("manager"))):
    doc = await db.settings.find_one({"key": "contact"})
    current = (doc or {}).get("value") or {}
    merged = {**DEFAULT_CONTACT, **current, **{k: v for k, v in body.model_dump(exclude_unset=True).items()}}
    await db.settings.update_one({"key": "contact"}, {"$set": {"value": merged}}, upsert=True)
    return merged

# ---------- Dashboard placeholders ----------
@api.get("/dashboard/manager")
async def dashboard_manager(user: dict = Depends(require_role("manager"))):
    return {
        "role": "manager",
        "stats": {"students": 0, "teachers": 0, "classes": 0, "announcements": await db.announcements.count_documents({})},
        "modules": ["Students", "Teachers", "Classes", "Schedule", "Fees", "Announcements", "Settings"],
    }

@api.get("/dashboard/teacher")
async def dashboard_teacher(user: dict = Depends(require_role("teacher"))):
    return {"role": "teacher", "modules": ["My Classes", "Attendance", "Homework", "Students", "Announcements"]}

@api.get("/dashboard/student")
async def dashboard_student(user: dict = Depends(require_role("student"))):
    return {"role": "student", "modules": ["My Classes", "Schedule", "Homework", "Attendance", "Announcements"]}

# ---------- App wiring ----------
from routes_academy import build_router as build_academy_router
academy_router = build_academy_router(db, get_current_user, require_role, hash_password)
app.include_router(api)
app.include_router(academy_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------- Startup: indexes + seed admin ----------
@app.on_event("startup")
async def on_startup():
    await db.users.create_index("email", unique=True)
    await db.announcements.create_index([("published_at", -1)])
    await db.login_attempts.create_index("identifier")
    await db.settings.create_index("key", unique=True)
    await db.courses.create_index("order")
    await db.classes.create_index("teacher_id")
    await db.attendance.create_index([("class_id", 1), ("date", -1)])
    await db.homework.create_index("class_id")
    await db.exams.create_index("class_id")
    await db.lessons.create_index("class_id")
    await db.messages.create_index("status")
    await db.registrations.create_index("status")
    await academy_router.seed_courses()

    existing = await db.users.find_one({"email": ADMIN_EMAIL})
    if existing is None:
        await db.users.insert_one({
            "email": ADMIN_EMAIL,
            "password_hash": hash_password(ADMIN_PASSWORD),
            "name": ADMIN_NAME,
            "role": "manager",
            "active": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info(f"Seeded admin manager: {ADMIN_EMAIL}")
    elif not verify_password(ADMIN_PASSWORD, existing.get("password_hash", "")):
        await db.users.update_one({"email": ADMIN_EMAIL},
                                  {"$set": {"password_hash": hash_password(ADMIN_PASSWORD),
                                            "role": "manager", "active": True, "name": ADMIN_NAME}})
        logger.info(f"Updated admin password: {ADMIN_EMAIL}")

    # Seed demo teacher & student (idempotent)
    for email, name, role, pw in [
        ("teacher@kabulstar.edu", "Demo Teacher", "teacher", "Teacher@123"),
        ("student@kabulstar.edu", "Demo Student", "student", "Student@123"),
    ]:
        if not await db.users.find_one({"email": email}):
            await db.users.insert_one({
                "email": email, "password_hash": hash_password(pw),
                "name": name, "role": role, "active": True,
                "created_at": datetime.now(timezone.utc).isoformat(),
            })

    # Seed sample announcements only if none exist
    if await db.announcements.count_documents({}) == 0:
        now = datetime.now(timezone.utc)
        samples = [
            {"title": "New Batch Registration Now Open",
             "description": "Registration for the Spring intake is now open. Book 1 through Book 12 and PELP classes are accepting new students. Visit the academy for placement testing.",
             "image_url": None},
            {"title": "Placement Test Schedule",
             "description": "All new students must complete a short placement test. Tests are held every Saturday at 9:00 AM.",
             "image_url": None},
            {"title": "Public Speaking Competition",
             "description": "Book 8 and above students are invited to participate in our annual English public speaking competition next month.",
             "image_url": None},
        ]
        for i, s in enumerate(samples):
            await db.announcements.insert_one({
                "id": str(uuid.uuid4()),
                **s,
                "published": True,
                "published_at": (now - timedelta(days=i)).isoformat(),
                "expires_at": None,
                "created_by": None,
            })


@app.on_event("shutdown")
async def on_shutdown():
    client.close()
