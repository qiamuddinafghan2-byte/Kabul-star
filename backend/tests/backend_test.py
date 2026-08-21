"""Phase-2 backend tests: courses, registrations, users, classes, attendance,
homework, exams, lessons, messages + role guards."""
import time
import uuid

import pytest
import requests

from conftest import BASE_URL, make_client


# ---------------- COURSES ----------------
class TestCourses:
    def test_public_courses_seeded_and_ordered(self, anon):
        r = anon.get(f"{BASE_URL}/api/courses/public")
        assert r.status_code == 200, r.text
        data = r.json()
        names = [c["name"] for c in data]
        assert len(data) >= 15, f"expected >=15 seeded courses, got {len(data)}: {names}"
        assert names[0] == "Pre-Beginner"
        assert names[1] == "Beginner"
        assert "PELP" in names
        assert names.index("PELP") > names.index("Book 12")
        orders = [c["order"] for c in data]
        assert orders == sorted(orders)
        for c in data:
            assert "_id" not in c
            assert "id" in c and "duration_months" in c

    def test_courses_list_requires_role(self, anon, student):
        assert anon.get(f"{BASE_URL}/api/courses").status_code == 401
        assert student.get(f"{BASE_URL}/api/courses").status_code == 403

    def test_manager_course_crud(self, manager, anon):
        name = f"TEST_Course_{uuid.uuid4().hex[:6]}"
        r = manager.post(f"{BASE_URL}/api/courses",
                         json={"name": name, "duration_months": 2.5, "order": 99,
                               "category": "TEST"})
        assert r.status_code == 201, r.text
        c = r.json()
        assert c["name"] == name and c["duration_months"] == 2.5
        cid = c["id"]

        # visible publicly
        pub = anon.get(f"{BASE_URL}/api/courses/public").json()
        assert cid in [x["id"] for x in pub]

        # patch
        r = manager.patch(f"{BASE_URL}/api/courses/{cid}", json={"duration_months": 3})
        assert r.status_code == 200, r.text
        assert r.json()["duration_months"] == 3
        # verify persisted
        pub = anon.get(f"{BASE_URL}/api/courses/public").json()
        assert [x for x in pub if x["id"] == cid][0]["duration_months"] == 3

        # archive
        assert manager.delete(f"{BASE_URL}/api/courses/{cid}").status_code == 200
        pub = anon.get(f"{BASE_URL}/api/courses/public").json()
        assert cid not in [x["id"] for x in pub], "archived course still public"
        allc = manager.get(f"{BASE_URL}/api/courses").json()
        arch = [x for x in allc if x["id"] == cid]
        assert arch and arch[0]["archived"] is True

    def test_course_not_found(self, manager):
        assert manager.patch(f"{BASE_URL}/api/courses/nope", json={"name": "x"}).status_code == 404
        assert manager.delete(f"{BASE_URL}/api/courses/nope").status_code == 404

    def test_course_create_requires_manager(self, anon, teacher, student):
        body = {"name": "TEST_x"}
        assert anon.post(f"{BASE_URL}/api/courses", json=body).status_code == 401
        assert teacher.post(f"{BASE_URL}/api/courses", json=body).status_code == 403
        assert student.post(f"{BASE_URL}/api/courses", json=body).status_code == 403


# ---------------- REGISTRATIONS ----------------
class TestRegistrations:
    def test_public_registration_no_auth(self, anon):
        r = anon.post(f"{BASE_URL}/api/registrations/public",
                      json={"full_name": "TEST Applicant", "phone": "0700000001"})
        assert r.status_code == 201, r.text
        assert r.json()["ok"] is True and r.json()["id"]

    @pytest.mark.parametrize("payload", [
        {"phone": "0700000002"},
        {"full_name": "TEST NoPhone"},
        {},
    ])
    def test_registration_validation(self, anon, payload):
        r = anon.post(f"{BASE_URL}/api/registrations/public", json=payload)
        assert r.status_code == 422, f"{payload} -> {r.status_code}"

    def test_registrations_list_guarded(self, anon, teacher):
        assert anon.get(f"{BASE_URL}/api/registrations").status_code == 401
        assert teacher.get(f"{BASE_URL}/api/registrations").status_code == 403

    def test_approve_creates_student(self, anon, manager):
        email = f"test_reg_{uuid.uuid4().hex[:8]}@example.com"
        courses = anon.get(f"{BASE_URL}/api/courses/public").json()
        course_id = courses[0]["id"]
        rid = anon.post(f"{BASE_URL}/api/registrations/public", json={
            "full_name": "TEST Approve Me", "phone": "0700000003", "email": email,
            "age": 20, "gender": "male",
        }).json()["id"]

        pend = manager.get(f"{BASE_URL}/api/registrations", params={"status": "pending"})
        assert pend.status_code == 200
        assert rid in [x["id"] for x in pend.json()]

        r = manager.post(f"{BASE_URL}/api/registrations/{rid}/approve",
                         json={"course_id": course_id, "password": "Student@123"})
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["email"] == email
        assert body["temp_password"] == "Student@123"

        # registration marked approved
        allreg = manager.get(f"{BASE_URL}/api/registrations").json()
        reg = [x for x in allreg if x["id"] == rid][0]
        assert reg["status"] == "approved"
        assert reg.get("issued_email") == email

        # new student in users list with right course/role
        users = manager.get(f"{BASE_URL}/api/users", params={"role": "student"})
        assert users.status_code == 200
        match = [u for u in users.json() if u["email"] == email]
        assert match, "approved student not in /users?role=student"
        u = match[0]
        assert u["role"] == "student"
        assert u["course_id"] == course_id
        assert u["active"] is True
        assert "password_hash" not in u and "_id" not in u
        assert isinstance(u["id"], str)

        # can login with issued credentials
        c = make_client(email, "Student@123")
        assert c.user["role"] == "student"

        # double approve -> 400
        r2 = manager.post(f"{BASE_URL}/api/registrations/{rid}/approve", json={"password": "x"})
        assert r2.status_code == 400, r2.text

    def test_reject_registration(self, anon, manager):
        rid = anon.post(f"{BASE_URL}/api/registrations/public", json={
            "full_name": "TEST Reject Me", "phone": "0700000004"}).json()["id"]
        r = manager.post(f"{BASE_URL}/api/registrations/{rid}/reject")
        assert r.status_code == 200, r.text
        rejected = manager.get(f"{BASE_URL}/api/registrations", params={"status": "rejected"}).json()
        assert rid in [x["id"] for x in rejected]

    def test_approve_missing_registration(self, manager):
        r = manager.post(f"{BASE_URL}/api/registrations/{uuid.uuid4()}/approve", json={})
        assert r.status_code == 404
        assert manager.post(f"{BASE_URL}/api/registrations/{uuid.uuid4()}/reject").status_code == 404


# ---------------- USERS ----------------
class TestUsers:
    def test_create_teacher_and_patch(self, manager):
        email = f"test_teacher_{uuid.uuid4().hex[:8]}@example.com"
        r = manager.post(f"{BASE_URL}/api/users", json={
            "email": email, "password": "Teach@123", "name": "TEST Teacher",
            "role": "teacher", "phone": "0700"})
        assert r.status_code == 201, r.text
        u = r.json()
        assert u["role"] == "teacher" and u["email"] == email and u["active"] is True
        assert "password_hash" not in u and "_id" not in u
        uid = u["id"]

        # login works
        make_client(email, "Teach@123")

        # duplicate email
        assert manager.post(f"{BASE_URL}/api/users", json={
            "email": email, "password": "x", "name": "dup", "role": "teacher"}).status_code == 400

        # invalid role
        assert manager.post(f"{BASE_URL}/api/users", json={
            "email": f"x{email}", "password": "x", "name": "y", "role": "manager"}).status_code == 400

        # password update
        assert manager.patch(f"{BASE_URL}/api/users/{uid}", json={"password": "New@1234"}).status_code == 200
        make_client(email, "New@1234")

        # suspend
        assert manager.patch(f"{BASE_URL}/api/users/{uid}", json={"active": False}).status_code == 200
        r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": "New@1234"})
        assert r.status_code == 403, f"suspended user could login: {r.status_code}"

        users = manager.get(f"{BASE_URL}/api/users", params={"role": "teacher"}).json()
        got = [x for x in users if x["id"] == uid]
        assert got and got[0]["active"] is False

    def test_patch_bad_and_missing_id(self, manager):
        assert manager.patch(f"{BASE_URL}/api/users/notanid", json={"name": "x"}).status_code == 400
        assert manager.patch(f"{BASE_URL}/api/users/64b7f9f9f9f9f9f9f9f9f9f9",
                             json={"name": "x"}).status_code == 404

    def test_users_guards(self, anon, teacher, student):
        body = {"email": "g@g.com", "password": "x", "name": "g", "role": "teacher"}
        assert anon.post(f"{BASE_URL}/api/users", json=body).status_code == 401
        assert teacher.post(f"{BASE_URL}/api/users", json=body).status_code == 403
        assert student.get(f"{BASE_URL}/api/users").status_code == 403
        assert anon.get(f"{BASE_URL}/api/users").status_code == 401


# ---------------- FULL E2E: class -> attendance/hw/exam/lesson -> messages ----------------
class TestAcademyFlow:
    """Sequential end-to-end flow. Keep in one class (xdist loadscope)."""
    state = {}

    def test_00_setup_class(self, manager, teacher, student, creds):
        course_id = manager.get(f"{BASE_URL}/api/courses").json()[0]["id"]
        teacher_id = teacher.user["id"]
        student_id = student.user["id"]
        r = manager.post(f"{BASE_URL}/api/classes", json={
            "name": f"TEST_Class_{uuid.uuid4().hex[:6]}", "course_id": course_id,
            "teacher_id": teacher_id, "student_ids": [student_id],
            "room": "R1", "schedule": "Sat 9AM"})
        assert r.status_code == 201, r.text
        cls = r.json()
        assert cls["teacher_id"] == teacher_id and student_id in cls["student_ids"]
        TestAcademyFlow.state.update(cls_id=cls["id"], teacher_id=teacher_id,
                                    student_id=student_id, course_id=course_id)

        # other class owned by nobody (for 403 checks)
        r2 = manager.post(f"{BASE_URL}/api/classes", json={
            "name": f"TEST_Other_{uuid.uuid4().hex[:6]}", "course_id": course_id,
            "teacher_id": "000000000000000000000000", "student_ids": []})
        assert r2.status_code == 201
        TestAcademyFlow.state["other_cls_id"] = r2.json()["id"]

    def test_01_class_visibility_per_role(self, manager, teacher, student):
        cid = self.state["cls_id"]
        other = self.state["other_cls_id"]
        mgr = manager.get(f"{BASE_URL}/api/classes")
        assert mgr.status_code == 200
        mids = [c["id"] for c in mgr.json()]
        assert cid in mids and other in mids

        tr = teacher.get(f"{BASE_URL}/api/classes")
        assert tr.status_code == 200
        tids = [c["id"] for c in tr.json()]
        assert cid in tids and other not in tids, "teacher sees classes not assigned to them"

        sr = student.get(f"{BASE_URL}/api/classes")
        assert sr.status_code == 200
        sids = [c["id"] for c in sr.json()]
        assert cid in sids and other not in sids, "student sees classes they are not in"

    def test_02_class_guards(self, anon, teacher):
        assert anon.get(f"{BASE_URL}/api/classes").status_code == 401
        assert teacher.post(f"{BASE_URL}/api/classes", json={
            "name": "x", "course_id": "y"}).status_code == 403

    def test_03_class_patch(self, manager):
        cid = self.state["cls_id"]
        r = manager.patch(f"{BASE_URL}/api/classes/{cid}", json={"room": "R2"})
        assert r.status_code == 200 and r.json()["room"] == "R2"
        got = [c for c in manager.get(f"{BASE_URL}/api/classes").json() if c["id"] == cid][0]
        assert got["room"] == "R2"

    def test_04_attendance(self, teacher, student, manager):
        cid, sid = self.state["cls_id"], self.state["student_id"]
        r = teacher.post(f"{BASE_URL}/api/attendance", json={
            "class_id": cid, "date": "2026-07-01",
            "entries": [{"student_id": sid, "status": "present"}]})
        assert r.status_code == 201, r.text
        assert r.json()["count"] == 1

        # teacher not assigned -> 403
        r = teacher.post(f"{BASE_URL}/api/attendance", json={
            "class_id": self.state["other_cls_id"], "date": "2026-07-01",
            "entries": [{"student_id": sid, "status": "present"}]})
        assert r.status_code == 403, r.text

        # idempotent re-mark (delete_many then insert)
        r = teacher.post(f"{BASE_URL}/api/attendance", json={
            "class_id": cid, "date": "2026-07-01",
            "entries": [{"student_id": sid, "status": "absent"}]})
        assert r.status_code == 201

        recs = teacher.get(f"{BASE_URL}/api/attendance", params={"class_id": cid})
        assert recs.status_code == 200
        day = [x for x in recs.json() if x["date"] == "2026-07-01"]
        assert len(day) == 1 and day[0]["status"] == "absent"

        srec = student.get(f"{BASE_URL}/api/attendance")
        assert srec.status_code == 200
        assert all(x["student_id"] == sid for x in srec.json()), "student sees other students' attendance"
        assert any(x["class_id"] == cid for x in srec.json())

        # teacher querying other class attendance -> 403
        assert teacher.get(f"{BASE_URL}/api/attendance",
                           params={"class_id": self.state["other_cls_id"]}).status_code == 403

    def test_05_lessons(self, teacher, student):
        cid = self.state["cls_id"]
        r = teacher.post(f"{BASE_URL}/api/lessons", json={
            "class_id": cid, "title": "TEST Lesson 1", "description": "Unit 1",
            "date": "2026-07-01"})
        assert r.status_code == 201, r.text
        assert r.json()["title"] == "TEST Lesson 1"

        assert teacher.post(f"{BASE_URL}/api/lessons", json={
            "class_id": self.state["other_cls_id"], "title": "nope"}).status_code == 403

        sl = student.get(f"{BASE_URL}/api/lessons")
        assert sl.status_code == 200
        assert "TEST Lesson 1" in [x["title"] for x in sl.json()]

    def test_06_homework(self, teacher, student, manager):
        cid = self.state["cls_id"]
        r = teacher.post(f"{BASE_URL}/api/homework", json={
            "class_id": cid, "title": "TEST HW", "description": "pg 10",
            "due_date": "2026-07-10"})
        assert r.status_code == 201, r.text
        hw = r.json()
        assert hw["status"] == "open" and hw["assigned_date"]
        hid = hw["id"]

        assert teacher.post(f"{BASE_URL}/api/homework", json={
            "class_id": self.state["other_cls_id"], "title": "nope"}).status_code == 403

        r = teacher.patch(f"{BASE_URL}/api/homework/{hid}", json={"title": "TEST HW v2"})
        assert r.status_code == 200 and r.json()["title"] == "TEST HW v2"

        sh = student.get(f"{BASE_URL}/api/homework")
        assert sh.status_code == 200
        titles = [x["title"] for x in sh.json()]
        assert "TEST HW v2" in titles
        allowed = {c["id"] for c in student.get(f"{BASE_URL}/api/classes").json()}
        assert all(x["class_id"] in allowed for x in sh.json())

        assert student.post(f"{BASE_URL}/api/homework", json={
            "class_id": cid, "title": "x"}).status_code == 403
        assert teacher.patch(f"{BASE_URL}/api/homework/{uuid.uuid4()}",
                             json={"title": "x"}).status_code == 404

    def test_07_exams(self, teacher, student):
        cid = self.state["cls_id"]
        r = teacher.post(f"{BASE_URL}/api/exams", json={
            "class_id": cid, "title": "TEST Exam", "date": "2026-07-20", "time": "09:00"})
        assert r.status_code == 201, r.text
        eid = r.json()["id"]

        assert teacher.post(f"{BASE_URL}/api/exams", json={
            "class_id": self.state["other_cls_id"], "title": "nope",
            "date": "2026-07-20"}).status_code == 403

        se = student.get(f"{BASE_URL}/api/exams")
        assert se.status_code == 200
        assert "TEST Exam" in [x["title"] for x in se.json()]

        assert student.delete(f"{BASE_URL}/api/exams/{eid}").status_code == 403
        assert teacher.delete(f"{BASE_URL}/api/exams/{eid}").status_code == 200
        assert "TEST Exam" not in [x["title"] for x in student.get(f"{BASE_URL}/api/exams").json()]

    def test_08_teacher_message_needs_approval(self, teacher, manager, student):
        sid = self.state["student_id"]
        subj = f"TEST TMsg {uuid.uuid4().hex[:6]}"
        r = teacher.post(f"{BASE_URL}/api/messages", json={
            "class_id": self.state["cls_id"], "recipient_ids": [sid],
            "subject": subj, "body": "hello"})
        assert r.status_code == 201, r.text
        msg = r.json()
        assert msg["status"] == "pending", f"teacher msg status {msg['status']}"
        mid = msg["id"]

        pend = manager.get(f"{BASE_URL}/api/messages", params={"box": "pending"})
        assert pend.status_code == 200
        assert mid in [m["id"] for m in pend.json()]

        # student should NOT see pending
        assert subj not in [m["subject"] for m in student.get(f"{BASE_URL}/api/messages").json()]

        assert manager.post(f"{BASE_URL}/api/messages/{mid}/approve").status_code == 200
        # now visible to student
        smsgs = student.get(f"{BASE_URL}/api/messages")
        assert smsgs.status_code == 200
        assert subj in [m["subject"] for m in smsgs.json()]
        assert all(m["status"] in ("approved", "sent") for m in smsgs.json())

        # re-approve -> 404
        assert manager.post(f"{BASE_URL}/api/messages/{mid}/approve").status_code == 404

    def test_09_teacher_message_reject_and_foreign_class(self, teacher, manager, student):
        sid = self.state["student_id"]
        subj = f"TEST RMsg {uuid.uuid4().hex[:6]}"
        mid = teacher.post(f"{BASE_URL}/api/messages", json={
            "recipient_ids": [sid], "subject": subj, "body": "x"}).json()["id"]
        assert manager.post(f"{BASE_URL}/api/messages/{mid}/reject").status_code == 200
        assert subj not in [m["subject"] for m in student.get(f"{BASE_URL}/api/messages").json()]

        assert teacher.post(f"{BASE_URL}/api/messages", json={
            "class_id": self.state["other_cls_id"], "recipient_ids": [sid],
            "subject": "x", "body": "y"}).status_code == 403

    def test_10_manager_message_sent_directly(self, manager, student):
        subj = f"TEST MMsg {uuid.uuid4().hex[:6]}"
        r = manager.post(f"{BASE_URL}/api/messages", json={
            "recipient_ids": [self.state["student_id"]], "subject": subj, "body": "hi"})
        assert r.status_code == 201, r.text
        assert r.json()["status"] == "sent"
        assert subj in [m["subject"] for m in student.get(f"{BASE_URL}/api/messages").json()]

    def test_11_message_guards(self, anon, student):
        assert anon.post(f"{BASE_URL}/api/messages", json={"subject": "a", "body": "b"}).status_code == 401
        assert student.post(f"{BASE_URL}/api/messages", json={"subject": "a", "body": "b"}).status_code == 403
        assert anon.get(f"{BASE_URL}/api/messages").status_code == 401
        assert student.post(f"{BASE_URL}/api/messages/{uuid.uuid4()}/approve").status_code == 403

    def test_12_student_msg_isolation(self, manager, student, creds):
        """Message addressed to someone else must not reach this student."""
        subj = f"TEST Other {uuid.uuid4().hex[:6]}"
        manager.post(f"{BASE_URL}/api/messages", json={
            "recipient_ids": ["000000000000000000000000"], "subject": subj, "body": "x"})
        assert subj not in [m["subject"] for m in student.get(f"{BASE_URL}/api/messages").json()]

    def test_99_cleanup(self, manager):
        for cid in (self.state.get("cls_id"), self.state.get("other_cls_id")):
            if cid:
                assert manager.delete(f"{BASE_URL}/api/classes/{cid}").status_code == 200


# ---------------- AUTH / SECURITY ----------------
class TestAuthSecurity:
    def test_bcrypt_and_cookies(self, creds):
        s = requests.Session()
        r = s.post(f"{BASE_URL}/api/auth/login", json=creds["manager"])
        assert r.status_code == 200, r.text
        cookies = {c.name: c for c in s.cookies}
        assert "access_token" in cookies and "refresh_token" in cookies
        raw = r.headers.get("set-cookie", "")
        assert "HttpOnly" in raw, f"cookie not httpOnly: {raw[:200]}"

    def test_cors_credentials(self, creds):
        # The Cloudflare/ingress edge rewrites CORS headers (ACAO: *, drops
        # allow-credentials), so app-level CORS config is asserted against the
        # FastAPI app directly. Public-URL behaviour verified elsewhere.
        origin = BASE_URL
        r = requests.options("http://localhost:8001/api/auth/login", headers={
            "Origin": origin, "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type"}, timeout=10)
        assert r.status_code in (200, 204), r.status_code
        assert r.headers.get("access-control-allow-credentials") == "true", dict(r.headers)
        assert r.headers.get("access-control-allow-origin") == origin, dict(r.headers)

    def test_role_hint_mismatch(self, creds):
        r = requests.post(f"{BASE_URL}/api/auth/login", json={
            **creds["student"], "role": "manager"})
        assert r.status_code == 403, r.text

    def test_brute_force_lockout(self):
        email = f"test_lock_{uuid.uuid4().hex[:8]}@example.com"
        codes = []
        for _ in range(6):
            codes.append(requests.post(f"{BASE_URL}/api/auth/login",
                                       json={"email": email, "password": "bad"}).status_code)
        assert codes[:5] == [401] * 5, codes
        assert codes[5] == 429, f"no lockout after 5 fails: {codes}"

    def test_me_and_invalid_token(self, manager):
        r = manager.get(f"{BASE_URL}/api/auth/me")
        assert r.status_code == 200 and r.json()["role"] == "manager"
        r = requests.get(f"{BASE_URL}/api/auth/me", headers={"Authorization": "Bearer garbage"})
        assert r.status_code == 401
