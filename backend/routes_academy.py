"""Academy management routes: courses, registrations, users, classes,
attendance, homework, exams, messages (with manager approval)."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Optional, List, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr


# ---------------- Pydantic models (module level so FastAPI detects body) ----------------
class CourseIn(BaseModel):
    name: str
    duration_months: float = 1
    description: Optional[str] = None
    order: int = 0
    category: Optional[str] = None
    archived: bool = False
    materials: List[str] = []


class CoursePatch(BaseModel):
    name: Optional[str] = None
    duration_months: Optional[float] = None
    description: Optional[str] = None
    order: Optional[int] = None
    category: Optional[str] = None
    archived: Optional[bool] = None
    materials: Optional[List[str]] = None


class RegistrationIn(BaseModel):
    full_name: str
    father_name: Optional[str] = None
    phone: str
    email: Optional[EmailStr] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    current_level: Optional[str] = None
    desired_course_id: Optional[str] = None
    preferred_class_type: Optional[str] = None
    preferred_schedule: Optional[str] = None
    preferred_branch: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    notes: Optional[str] = None


class ApproveIn(BaseModel):
    course_id: Optional[str] = None
    password: str = "Student@123"


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str
    phone: Optional[str] = None
    branch: Optional[str] = None
    course_id: Optional[str] = None


class UserPatch(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    active: Optional[bool] = None
    course_id: Optional[str] = None
    class_id: Optional[str] = None
    branch: Optional[str] = None
    current_level: Optional[str] = None
    progress: Optional[float] = None
    notes: Optional[str] = None
    password: Optional[str] = None


class ClassIn(BaseModel):
    name: str
    course_id: str
    teacher_id: Optional[str] = None
    student_ids: List[str] = []
    class_type: str = "physical"  # physical | online
    branch_id: Optional[str] = None
    room_id: Optional[str] = None
    room: Optional[str] = None
    online: bool = False
    days: List[str] = []
    start_time: Optional[str] = None  # "HH:MM"
    end_time: Optional[str] = None
    start_date: Optional[str] = None  # "YYYY-MM-DD"
    end_date: Optional[str] = None
    status: str = "active"  # active | paused | completed
    meeting_platform: Optional[str] = None
    meeting_url: Optional[str] = None
    meeting_instructions: Optional[str] = None
    schedule: Optional[str] = None
    branch: Optional[str] = None
    archived: bool = False


class ClassPatch(BaseModel):
    name: Optional[str] = None
    course_id: Optional[str] = None
    teacher_id: Optional[str] = None
    student_ids: Optional[List[str]] = None
    class_type: Optional[str] = None
    branch_id: Optional[str] = None
    room_id: Optional[str] = None
    room: Optional[str] = None
    online: Optional[bool] = None
    days: Optional[List[str]] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    status: Optional[str] = None
    meeting_platform: Optional[str] = None
    meeting_url: Optional[str] = None
    meeting_instructions: Optional[str] = None
    schedule: Optional[str] = None
    branch: Optional[str] = None
    archived: Optional[bool] = None


class BranchIn(BaseModel):
    name: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    archived: bool = False


class BranchPatch(BaseModel):
    name: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    archived: Optional[bool] = None


class RoomIn(BaseModel):
    name: str
    branch_id: str
    capacity: Optional[int] = None
    archived: bool = False


class RoomPatch(BaseModel):
    name: Optional[str] = None
    branch_id: Optional[str] = None
    capacity: Optional[int] = None
    archived: Optional[bool] = None


class AttendanceMark(BaseModel):
    class_id: str
    date: str
    entries: List[dict]


class HomeworkIn(BaseModel):
    class_id: str
    title: str
    description: Optional[str] = None
    assigned_date: Optional[str] = None
    due_date: Optional[str] = None
    attachments: List[str] = []


class HomeworkPatch(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    attachments: Optional[List[str]] = None
    status: Optional[str] = None


class ExamIn(BaseModel):
    class_id: str
    title: str
    date: str
    time: Optional[str] = None
    location: Optional[str] = None
    instructions: Optional[str] = None


class LessonIn(BaseModel):
    class_id: str
    date: Optional[str] = None
    title: str
    description: Optional[str] = None
    topics: Optional[str] = None
    notes: Optional[str] = None


class MessageIn(BaseModel):
    class_id: Optional[str] = None
    recipient_ids: List[str] = []
    subject: str
    body: str


def build_router(db, get_current_user, require_role, hash_password):
    r = APIRouter(prefix="/api")

    def now_iso() -> str:
        return datetime.now(timezone.utc).isoformat()

    def _s(doc: dict) -> dict:
        if not doc:
            return doc
        d = dict(doc)
        d.pop("_id", None)
        d.pop("password_hash", None)
        return d

    # -------- COURSES --------
    @r.get("/courses/public")
    async def list_public_courses():
        docs = await db.courses.find({"archived": {"$ne": True}}).sort("order", 1).to_list(200)
        return [_s(d) for d in docs]

    @r.get("/courses")
    async def list_courses(user=Depends(require_role("manager", "teacher"))):
        docs = await db.courses.find().sort("order", 1).to_list(500)
        return [_s(d) for d in docs]

    @r.post("/courses", status_code=201)
    async def create_course(body: CourseIn, user=Depends(require_role("manager"))):
        doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso()}
        await db.courses.insert_one(doc)
        return _s(doc)

    @r.patch("/courses/{cid}")
    async def update_course(cid: str, body: CoursePatch, user=Depends(require_role("manager"))):
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if not upd:
            raise HTTPException(400, "No fields")
        res = await db.courses.update_one({"id": cid}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "Course not found")
        return _s(await db.courses.find_one({"id": cid}))

    @r.delete("/courses/{cid}")
    async def archive_course(cid: str, user=Depends(require_role("manager"))):
        res = await db.courses.update_one({"id": cid}, {"$set": {"archived": True}})
        if res.matched_count == 0:
            raise HTTPException(404, "Course not found")
        return {"ok": True}

    # -------- REGISTRATIONS --------
    @r.post("/registrations/public", status_code=201)
    async def create_registration(body: RegistrationIn):
        doc = {
            "id": str(uuid.uuid4()),
            **body.model_dump(),
            "status": "pending",
            "created_at": now_iso(),
        }
        await db.registrations.insert_one(doc)
        return {"ok": True, "id": doc["id"]}

    @r.get("/registrations")
    async def list_registrations(status: Optional[str] = None,
                                 user=Depends(require_role("manager"))):
        q = {"status": status} if status else {}
        docs = await db.registrations.find(q).sort("created_at", -1).to_list(1000)
        return [_s(d) for d in docs]

    @r.post("/registrations/{rid}/approve")
    async def approve_registration(rid: str, body: ApproveIn,
                                   user=Depends(require_role("manager"))):
        reg = await db.registrations.find_one({"id": rid})
        if not reg:
            raise HTTPException(404, "Registration not found")
        if reg.get("status") == "approved":
            raise HTTPException(400, "Already approved")

        email = (reg.get("email") or f"{reg['id'][:8]}@student.kabulstar.edu").lower()
        if await db.users.find_one({"email": email}):
            email = f"{reg['id'][:8]}.{email}"

        user_doc = {
            "email": email,
            "password_hash": hash_password(body.password),
            "name": reg["full_name"],
            "role": "student",
            "active": True,
            "phone": reg.get("phone"),
            "father_name": reg.get("father_name"),
            "age": reg.get("age"),
            "gender": reg.get("gender"),
            "address": reg.get("address"),
            "emergency_contact": reg.get("emergency_contact"),
            "current_level": reg.get("current_level"),
            "course_id": body.course_id or reg.get("desired_course_id"),
            "branch": reg.get("preferred_branch"),
            "start_date": now_iso(),
            "created_at": now_iso(),
        }
        ins = await db.users.insert_one(user_doc)
        await db.registrations.update_one(
            {"id": rid},
            {"$set": {"status": "approved", "approved_at": now_iso(),
                      "user_id": str(ins.inserted_id), "issued_email": email}},
        )
        return {"ok": True, "email": email, "temp_password": body.password}

    @r.post("/registrations/{rid}/reject")
    async def reject_registration(rid: str, user=Depends(require_role("manager"))):
        res = await db.registrations.update_one(
            {"id": rid}, {"$set": {"status": "rejected", "rejected_at": now_iso()}}
        )
        if res.matched_count == 0:
            raise HTTPException(404, "Not found")
        return {"ok": True}

    # -------- USERS (students & teachers) --------
    @r.get("/users")
    async def list_users(role: Optional[str] = None,
                         user=Depends(get_current_user)):
        # Manager: all users. Teacher: only students in their own classes.
        if user["role"] == "manager":
            q = {"role": role} if role else {"role": {"$in": ["teacher", "student"]}}
            docs = await db.users.find(q).sort("created_at", -1).to_list(2000)
            return [_s({**d, "id": str(d["_id"])}) for d in docs]
        if user["role"] == "teacher":
            if role and role != "student":
                raise HTTPException(403, "Forbidden")
            from bson import ObjectId
            own_classes = await db.classes.find(
                {"teacher_id": user["_id"], "archived": {"$ne": True}}, {"student_ids": 1}
            ).to_list(500)
            sid_set = set()
            for c in own_classes:
                for s in c.get("student_ids") or []:
                    sid_set.add(s)
            if not sid_set:
                return []
            oids = []
            for sid in sid_set:
                try:
                    oids.append(ObjectId(sid))
                except Exception:
                    pass
            docs = await db.users.find({"role": "student", "_id": {"$in": oids}}).to_list(2000)
            return [_s({**d, "id": str(d["_id"])}) for d in docs]
        raise HTTPException(403, "Forbidden")

    @r.post("/users", status_code=201)
    async def create_user(body: UserCreate, user=Depends(require_role("manager"))):
        if body.role not in ("teacher", "student"):
            raise HTTPException(400, "Role must be teacher or student")
        email = body.email.lower()
        if await db.users.find_one({"email": email}):
            raise HTTPException(400, "Email already exists")
        doc = {
            "email": email,
            "password_hash": hash_password(body.password),
            "name": body.name,
            "role": body.role,
            "active": True,
            "phone": body.phone,
            "branch": body.branch,
            "course_id": body.course_id,
            "created_at": now_iso(),
        }
        ins = await db.users.insert_one(doc)
        return _s({**doc, "id": str(ins.inserted_id)})

    @r.patch("/users/{uid}")
    async def update_user(uid: str, body: UserPatch,
                          user=Depends(require_role("manager"))):
        from bson import ObjectId
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if "password" in upd:
            upd["password_hash"] = hash_password(upd.pop("password"))
        if not upd:
            raise HTTPException(400, "No fields")
        try:
            oid = ObjectId(uid)
        except Exception:
            raise HTTPException(400, "Bad id")
        res = await db.users.update_one({"_id": oid}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "User not found")
        return {"ok": True}

    # -------- BRANCHES --------
    @r.get("/branches")
    async def list_branches(user=Depends(get_current_user)):
        docs = await db.branches.find({"archived": {"$ne": True}}).sort("name", 1).to_list(200)
        return [_s(d) for d in docs]

    @r.post("/branches", status_code=201)
    async def create_branch(body: BranchIn, user=Depends(require_role("manager"))):
        doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso()}
        await db.branches.insert_one(doc)
        return _s(doc)

    @r.patch("/branches/{bid}")
    async def update_branch(bid: str, body: BranchPatch,
                            user=Depends(require_role("manager"))):
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if not upd:
            raise HTTPException(400, "No fields")
        res = await db.branches.update_one({"id": bid}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "Branch not found")
        return _s(await db.branches.find_one({"id": bid}))

    @r.delete("/branches/{bid}")
    async def archive_branch(bid: str, user=Depends(require_role("manager"))):
        res = await db.branches.update_one({"id": bid}, {"$set": {"archived": True}})
        if res.matched_count == 0:
            raise HTTPException(404, "Branch not found")
        return {"ok": True}

    # -------- ROOMS --------
    @r.get("/rooms")
    async def list_rooms(branch_id: Optional[str] = None,
                         user=Depends(get_current_user)):
        q: dict[str, Any] = {"archived": {"$ne": True}}
        if branch_id:
            q["branch_id"] = branch_id
        docs = await db.rooms.find(q).sort("name", 1).to_list(500)
        return [_s(d) for d in docs]

    @r.post("/rooms", status_code=201)
    async def create_room(body: RoomIn, user=Depends(require_role("manager"))):
        if not await db.branches.find_one({"id": body.branch_id, "archived": {"$ne": True}}):
            raise HTTPException(400, "Branch not found")
        doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso()}
        await db.rooms.insert_one(doc)
        return _s(doc)

    @r.patch("/rooms/{rid}")
    async def update_room(rid: str, body: RoomPatch,
                          user=Depends(require_role("manager"))):
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if not upd:
            raise HTTPException(400, "No fields")
        res = await db.rooms.update_one({"id": rid}, {"$set": upd})
        if res.matched_count == 0:
            raise HTTPException(404, "Room not found")
        return _s(await db.rooms.find_one({"id": rid}))

    @r.delete("/rooms/{rid}")
    async def archive_room(rid: str, user=Depends(require_role("manager"))):
        res = await db.rooms.update_one({"id": rid}, {"$set": {"archived": True}})
        if res.matched_count == 0:
            raise HTTPException(404, "Room not found")
        return {"ok": True}

    # -------- CONFLICT DETECTION --------
    def _times_overlap(a_s: str, a_e: str, b_s: str, b_e: str) -> bool:
        return a_s < b_e and b_s < a_e

    def _dates_overlap(a_s: Optional[str], a_e: Optional[str],
                       b_s: Optional[str], b_e: Optional[str]) -> bool:
        if a_e and b_s and a_e < b_s:
            return False
        if b_e and a_s and b_e < a_s:
            return False
        return True

    async def _detect_conflicts(payload: dict, exclude_id: Optional[str] = None) -> list[dict]:
        days = set(payload.get("days") or [])
        st = payload.get("start_time")
        et = payload.get("end_time")
        teacher_id = payload.get("teacher_id")
        room_id = payload.get("room_id")
        if not (st and et and days and (teacher_id or room_id)):
            return []
        q: dict[str, Any] = {"archived": {"$ne": True}}
        if exclude_id:
            q["id"] = {"$ne": exclude_id}
        ors: list[dict] = []
        if teacher_id:
            ors.append({"teacher_id": teacher_id})
        if room_id:
            ors.append({"room_id": room_id})
        q["$or"] = ors
        results = []
        async for c in db.classes.find(q):
            c_days = set(c.get("days") or [])
            if not (days & c_days):
                continue
            if not (c.get("start_time") and c.get("end_time")):
                continue
            if not _times_overlap(st, et, c["start_time"], c["end_time"]):
                continue
            if not _dates_overlap(payload.get("start_date"), payload.get("end_date"),
                                  c.get("start_date"), c.get("end_date")):
                continue
            reasons = []
            if teacher_id and c.get("teacher_id") == teacher_id:
                reasons.append("teacher")
            if room_id and c.get("room_id") == room_id:
                reasons.append("room")
            results.append({
                "class_id": c["id"],
                "name": c.get("name"),
                "conflicts": reasons,
                "days": sorted(list(days & c_days)),
                "start_time": c["start_time"],
                "end_time": c["end_time"],
            })
        return results

    @r.post("/classes/check-conflicts")
    async def check_conflicts(body: ClassIn, user=Depends(require_role("manager"))):
        return {"conflicts": await _detect_conflicts(body.model_dump())}

    @r.post("/classes", status_code=201)
    async def create_class(body: ClassIn, force: bool = False,
                           user=Depends(require_role("manager"))):
        conflicts = await _detect_conflicts(body.model_dump())
        if conflicts and not force:
            raise HTTPException(status_code=409, detail={"conflicts": conflicts})
        doc = {"id": str(uuid.uuid4()), **body.model_dump(), "created_at": now_iso()}
        await db.classes.insert_one(doc)
        return _s(doc)

    @r.get("/classes")
    async def list_classes(user=Depends(get_current_user)):
        role = user["role"]
        if role == "manager":
            q = {"archived": {"$ne": True}}
        elif role == "teacher":
            q = {"teacher_id": user["_id"], "archived": {"$ne": True}}
        else:
            q = {"student_ids": user["_id"], "archived": {"$ne": True}}
        docs = await db.classes.find(q).to_list(500)
        return [_s(d) for d in docs]

    @r.patch("/classes/{cid}")
    async def update_class(cid: str, body: ClassPatch, force: bool = False,
                           user=Depends(require_role("manager"))):
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        if not upd:
            raise HTTPException(400, "No fields")
        existing = await db.classes.find_one({"id": cid})
        if not existing:
            raise HTTPException(404, "Not found")
        merged = {**existing, **upd}
        conflicts = await _detect_conflicts(merged, exclude_id=cid)
        if conflicts and not force:
            raise HTTPException(status_code=409, detail={"conflicts": conflicts})
        await db.classes.update_one({"id": cid}, {"$set": upd})
        return _s(await db.classes.find_one({"id": cid}))

    @r.delete("/classes/{cid}")
    async def archive_class(cid: str, user=Depends(require_role("manager"))):
        res = await db.classes.update_one({"id": cid}, {"$set": {"archived": True}})
        if res.matched_count == 0:
            raise HTTPException(404, "Class not found")
        return {"ok": True}

    async def _teacher_owns_class(user: dict, class_id: str) -> bool:
        cls = await db.classes.find_one({"id": class_id, "archived": {"$ne": True}})
        if not cls:
            return False
        if user["role"] == "manager":
            return True
        return cls.get("teacher_id") == user["_id"]

    async def _visible_class_ids(user: dict) -> list[str]:
        """Non-archived class IDs the caller can see."""
        if user["role"] == "student":
            q = {"student_ids": user["_id"], "archived": {"$ne": True}}
        elif user["role"] == "teacher":
            q = {"teacher_id": user["_id"], "archived": {"$ne": True}}
        else:
            q = {"archived": {"$ne": True}}
        return [c["id"] async for c in db.classes.find(q, {"id": 1})]

    # -------- ATTENDANCE --------
    @r.post("/attendance", status_code=201)
    async def mark_attendance(body: AttendanceMark, user=Depends(get_current_user)):
        if not await _teacher_owns_class(user, body.class_id):
            raise HTTPException(403, "Forbidden")
        if not body.entries:
            raise HTTPException(400, "No entries provided")
        for e in body.entries:
            if not isinstance(e, dict) or "student_id" not in e or "status" not in e:
                raise HTTPException(422, "Each entry needs student_id and status")
            if e["status"] not in ("present", "absent", "late", "excused"):
                raise HTTPException(422, f"Invalid status: {e['status']}")
        await db.attendance.delete_many({"class_id": body.class_id, "date": body.date})
        docs = [
            {"id": str(uuid.uuid4()), "class_id": body.class_id, "date": body.date,
             "student_id": e["student_id"], "status": e["status"], "note": e.get("note"),
             "marked_by": user["_id"], "marked_at": now_iso()}
            for e in body.entries
        ]
        await db.attendance.insert_many(docs)
        return {"ok": True, "count": len(docs)}

    @r.get("/attendance")
    async def get_attendance(class_id: Optional[str] = None,
                             student_id: Optional[str] = None,
                             user=Depends(get_current_user)):
        q: dict[str, Any] = {}
        role = user["role"]
        if role == "student":
            q["student_id"] = user["_id"]
            q["class_id"] = {"$in": await _visible_class_ids(user)}
        elif role == "teacher":
            visible = await _visible_class_ids(user)
            if class_id:
                if class_id not in visible:
                    raise HTTPException(403, "Forbidden")
                q["class_id"] = class_id
            else:
                q["class_id"] = {"$in": visible}
        else:
            if class_id:
                q["class_id"] = class_id
            if student_id:
                q["student_id"] = student_id
        docs = await db.attendance.find(q).sort("date", -1).to_list(2000)
        return [_s(d) for d in docs]

    # -------- HOMEWORK --------
    @r.post("/homework", status_code=201)
    async def create_homework(body: HomeworkIn,
                              user=Depends(require_role("teacher", "manager"))):
        if not await _teacher_owns_class(user, body.class_id):
            raise HTTPException(403, "Forbidden")
        doc = {
            "id": str(uuid.uuid4()), **body.model_dump(),
            "assigned_date": body.assigned_date or now_iso(),
            "status": "open", "teacher_id": user["_id"], "created_at": now_iso(),
        }
        await db.homework.insert_one(doc)
        return _s(doc)

    @r.patch("/homework/{hid}")
    async def update_homework(hid: str, body: HomeworkPatch,
                              user=Depends(require_role("teacher", "manager"))):
        hw = await db.homework.find_one({"id": hid})
        if not hw:
            raise HTTPException(404, "Not found")
        if user["role"] == "teacher" and hw.get("teacher_id") != user["_id"]:
            raise HTTPException(403, "Forbidden")
        upd = {k: v for k, v in body.model_dump(exclude_unset=True).items()}
        await db.homework.update_one({"id": hid}, {"$set": upd})
        return _s(await db.homework.find_one({"id": hid}))

    @r.get("/homework")
    async def list_homework(class_id: Optional[str] = None,
                            user=Depends(get_current_user)):
        role = user["role"]
        visible = await _visible_class_ids(user)
        if role in ("student", "teacher"):
            q: dict[str, Any] = {"class_id": {"$in": visible}}
        else:
            q = {}
        if class_id:
            if role != "manager" and class_id not in visible:
                raise HTTPException(403, "Forbidden")
            q["class_id"] = class_id
        docs = await db.homework.find(q).sort("assigned_date", -1).to_list(500)
        return [_s(d) for d in docs]

    # -------- EXAMS --------
    @r.post("/exams", status_code=201)
    async def create_exam(body: ExamIn,
                          user=Depends(require_role("teacher", "manager"))):
        if not await _teacher_owns_class(user, body.class_id):
            raise HTTPException(403, "Forbidden")
        doc = {"id": str(uuid.uuid4()), **body.model_dump(),
               "teacher_id": user["_id"], "created_at": now_iso()}
        await db.exams.insert_one(doc)
        return _s(doc)

    @r.get("/exams")
    async def list_exams(user=Depends(get_current_user)):
        role = user["role"]
        visible = await _visible_class_ids(user)
        if role in ("student", "teacher"):
            q = {"class_id": {"$in": visible}}
        else:
            q = {}
        docs = await db.exams.find(q).sort("date", 1).to_list(200)
        return [_s(d) for d in docs]

    @r.delete("/exams/{eid}")
    async def del_exam(eid: str,
                       user=Depends(require_role("teacher", "manager"))):
        exam = await db.exams.find_one({"id": eid})
        if not exam:
            raise HTTPException(404, "Not found")
        if user["role"] == "teacher" and exam.get("teacher_id") != user["_id"]:
            raise HTTPException(403, "Forbidden")
        await db.exams.delete_one({"id": eid})
        return {"ok": True}

    # -------- LESSONS --------
    @r.post("/lessons", status_code=201)
    async def create_lesson(body: LessonIn,
                            user=Depends(require_role("teacher", "manager"))):
        if not await _teacher_owns_class(user, body.class_id):
            raise HTTPException(403, "Forbidden")
        doc = {"id": str(uuid.uuid4()), **body.model_dump(),
               "date": body.date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
               "teacher_id": user["_id"], "created_at": now_iso()}
        await db.lessons.insert_one(doc)
        return _s(doc)

    @r.get("/lessons")
    async def list_lessons(user=Depends(get_current_user)):
        role = user["role"]
        visible = await _visible_class_ids(user)
        if role in ("student", "teacher"):
            q = {"class_id": {"$in": visible}}
        else:
            q = {}
        docs = await db.lessons.find(q).sort("date", -1).to_list(200)
        return [_s(d) for d in docs]

    # -------- MESSAGES --------
    @r.post("/messages", status_code=201)
    async def send_message(body: MessageIn, user=Depends(get_current_user)):
        if user["role"] not in ("teacher", "manager"):
            raise HTTPException(403, "Forbidden")
        if user["role"] == "teacher" and body.class_id:
            if not await _teacher_owns_class(user, body.class_id):
                raise HTTPException(403, "Forbidden class")
        status = "sent" if user["role"] == "manager" else "pending"
        doc = {
            "id": str(uuid.uuid4()),
            "author_id": user["_id"],
            "author_role": user["role"],
            "author_name": user.get("name", user["email"]),
            "class_id": body.class_id,
            "recipient_ids": body.recipient_ids,
            "subject": body.subject,
            "body": body.body,
            "status": status,
            "created_at": now_iso(),
        }
        await db.messages.insert_one(doc)
        return _s(doc)

    @r.get("/messages")
    async def list_messages(box: str = "inbox", user=Depends(get_current_user)):
        role = user["role"]
        if role == "student":
            q = {"recipient_ids": user["_id"], "status": {"$in": ["approved", "sent"]}}
        elif role == "teacher":
            q = {"author_id": user["_id"]}
        else:
            if box == "pending":
                q = {"status": "pending"}
            else:
                q = {}
        docs = await db.messages.find(q).sort("created_at", -1).to_list(500)
        return [_s(d) for d in docs]

    @r.post("/messages/{mid}/approve")
    async def approve_message(mid: str, user=Depends(require_role("manager"))):
        res = await db.messages.update_one(
            {"id": mid, "status": "pending"},
            {"$set": {"status": "approved", "approved_at": now_iso(), "approved_by": user["_id"]}},
        )
        if res.matched_count == 0:
            raise HTTPException(404, "Not found or not pending")
        return {"ok": True}

    @r.post("/messages/{mid}/reject")
    async def reject_message(mid: str, user=Depends(require_role("manager"))):
        res = await db.messages.update_one(
            {"id": mid, "status": "pending"},
            {"$set": {"status": "rejected", "rejected_at": now_iso(), "rejected_by": user["_id"]}},
        )
        if res.matched_count == 0:
            raise HTTPException(404, "Not found or not pending")
        return {"ok": True}

    # -------- SEED default branch + rooms --------
    async def seed_branches_rooms():
        if await db.branches.count_documents({}) > 0:
            return
        bid = str(uuid.uuid4())
        await db.branches.insert_one({
            "id": bid, "name": "Kabul Star Main", "address": "Kabul, Afghanistan",
            "phone": "+93 700 000 000", "email": "main@kabulstar.edu",
            "archived": False, "created_at": now_iso(),
        })
        for i in range(1, 5):
            await db.rooms.insert_one({
                "id": str(uuid.uuid4()), "name": f"Room {i}", "branch_id": bid,
                "capacity": 25, "archived": False, "created_at": now_iso(),
            })

    r.seed_branches_rooms = seed_branches_rooms  # type: ignore[attr-defined]

    # -------- SEED default courses --------
    async def seed_courses():
        if await db.courses.count_documents({}) > 0:
            return
        default = [
            ("Pre-Beginner", 1.0, "Foundation"),
            ("Beginner", 1.0, "Foundation"),
            ("Book 1", 1.0, "Main"), ("Book 2", 1.0, "Main"), ("Book 3", 1.0, "Main"),
            ("Book 4", 1.0, "Main"), ("Book 5", 1.0, "Main"), ("Book 6", 1.0, "Main"),
            ("Book 7", 1.0, "Main"), ("Book 8", 1.0, "Main"), ("Book 9", 1.0, "Main"),
            ("Book 10", 1.5, "Main"), ("Book 11", 1.5, "Main"), ("Book 12", 1.5, "Main"),
            ("PELP", 1.5, "Professional"),
        ]
        for i, (name, months, cat) in enumerate(default):
            await db.courses.insert_one({
                "id": str(uuid.uuid4()), "name": name, "duration_months": months,
                "category": cat, "order": i, "archived": False, "materials": [],
                "description": None, "created_at": now_iso(),
            })

    r.seed_courses = seed_courses  # type: ignore[attr-defined]
    return r
