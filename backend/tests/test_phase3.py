"""Phase 3: Branches, Rooms, extended Classes + conflict detection."""
import uuid

import pytest

from conftest import BASE_URL

TAG = "TEST_P3"


# ---------------- shared fixtures ----------------
@pytest.fixture(scope="module")
def created(manager):
    reg = {"classes": [], "branches": [], "rooms": []}
    yield reg
    for cid in reg["classes"]:
        manager.delete(f"{BASE_URL}/api/classes/{cid}")
    for rid in reg["rooms"]:
        manager.delete(f"{BASE_URL}/api/rooms/{rid}")
    for bid in reg["branches"]:
        manager.delete(f"{BASE_URL}/api/branches/{bid}")


@pytest.fixture(scope="module")
def main_branch(manager):
    r = manager.get(f"{BASE_URL}/api/branches")
    assert r.status_code == 200, r.text
    branches = r.json()
    assert len(branches) >= 1
    m = [b for b in branches if b["name"] == "Kabul Star Main"]
    assert m, f"seeded 'Kabul Star Main' branch missing: {[b['name'] for b in branches]}"
    return m[0]


@pytest.fixture(scope="module")
def seeded_rooms(manager, main_branch):
    r = manager.get(f"{BASE_URL}/api/rooms")
    assert r.status_code == 200, r.text
    rooms = [x for x in r.json() if x["branch_id"] == main_branch["id"]]
    assert len(rooms) >= 4, f"expected 4+ seeded rooms, got {len(rooms)}"
    return rooms


@pytest.fixture(scope="module")
def course_id(manager):
    r = manager.get(f"{BASE_URL}/api/courses")
    assert r.status_code == 200
    return r.json()[0]["id"]


@pytest.fixture(scope="module")
def teacher_id(manager):
    r = manager.get(f"{BASE_URL}/api/users?role=teacher")
    assert r.status_code == 200
    assert r.json(), "no teachers found"
    return r.json()[0]["id"]


def _cls(course_id, **kw):
    body = {
        "name": f"{TAG}_{uuid.uuid4().hex[:6]}",
        "course_id": course_id,
        "class_type": "physical",
        "days": ["Sat"],
        "start_time": "08:00",
        "end_time": "09:00",
        "status": "active",
    }
    body.update(kw)
    return body


def _create(manager, created, body, force=False, expect=201):
    url = f"{BASE_URL}/api/classes" + ("?force=true" if force else "")
    r = manager.post(url, json=body)
    assert r.status_code == expect, f"{r.status_code}: {r.text[:400]}"
    if r.status_code == 201:
        created["classes"].append(r.json()["id"])
    return r


# ---------------- BRANCHES CRUD ----------------
class TestBranches:
    def test_seeded_branch_present(self, main_branch):
        assert main_branch["archived"] is False
        assert "id" in main_branch

    def test_no_mongo_id_leak(self, manager):
        for b in manager.get(f"{BASE_URL}/api/branches").json():
            assert "_id" not in b

    def test_branch_crud(self, manager, created):
        name = f"{TAG}_Branch_{uuid.uuid4().hex[:5]}"
        r = manager.post(f"{BASE_URL}/api/branches",
                         json={"name": name, "address": "Herat", "phone": "+93 1", "email": "b@x.com"})
        assert r.status_code == 201, r.text
        b = r.json()
        created["branches"].append(b["id"])
        assert b["name"] == name and b["address"] == "Herat"

        # persisted
        assert any(x["id"] == b["id"] and x["name"] == name
                   for x in manager.get(f"{BASE_URL}/api/branches").json())

        # patch
        r = manager.patch(f"{BASE_URL}/api/branches/{b['id']}", json={"name": name + "_ed"})
        assert r.status_code == 200 and r.json()["name"] == name + "_ed"
        assert any(x["id"] == b["id"] and x["name"] == name + "_ed"
                   for x in manager.get(f"{BASE_URL}/api/branches").json())

        # delete -> soft archive, gone from list
        assert manager.delete(f"{BASE_URL}/api/branches/{b['id']}").status_code == 200
        assert not any(x["id"] == b["id"] for x in manager.get(f"{BASE_URL}/api/branches").json())
        created["branches"].remove(b["id"])

    def test_patch_unknown_branch_404(self, manager):
        assert manager.patch(f"{BASE_URL}/api/branches/nope", json={"name": "x"}).status_code == 404

    def test_delete_unknown_branch_404(self, manager):
        assert manager.delete(f"{BASE_URL}/api/branches/nope").status_code == 404

    def test_teacher_cannot_create_branch(self, teacher):
        assert teacher.post(f"{BASE_URL}/api/branches", json={"name": "x"}).status_code == 403

    def test_student_cannot_create_branch(self, student):
        assert student.post(f"{BASE_URL}/api/branches", json={"name": "x"}).status_code == 403

    def test_anon_cannot_read_branches(self, anon):
        assert anon.get(f"{BASE_URL}/api/branches").status_code in (401, 403)


# ---------------- ROOMS CRUD ----------------
class TestRooms:
    def test_seeded_rooms(self, seeded_rooms):
        assert len(seeded_rooms) >= 4
        for room in seeded_rooms:
            assert "_id" not in room
            assert room["archived"] is False

    def test_filter_by_branch(self, manager, main_branch):
        r = manager.get(f"{BASE_URL}/api/rooms", params={"branch_id": main_branch["id"]})
        assert r.status_code == 200
        assert r.json() and all(x["branch_id"] == main_branch["id"] for x in r.json())
        r2 = manager.get(f"{BASE_URL}/api/rooms", params={"branch_id": "does-not-exist"})
        assert r2.status_code == 200 and r2.json() == []

    def test_student_can_read_rooms(self, student):
        assert student.get(f"{BASE_URL}/api/rooms").status_code == 200

    def test_invalid_branch_400(self, manager):
        r = manager.post(f"{BASE_URL}/api/rooms",
                         json={"name": f"{TAG}_bad", "branch_id": "invalid-branch"})
        assert r.status_code == 400, r.text

    def test_room_crud(self, manager, created, main_branch):
        name = f"{TAG}_Room_{uuid.uuid4().hex[:5]}"
        r = manager.post(f"{BASE_URL}/api/rooms",
                         json={"name": name, "branch_id": main_branch["id"], "capacity": 12})
        assert r.status_code == 201, r.text
        room = r.json()
        created["rooms"].append(room["id"])
        assert room["capacity"] == 12 and room["branch_id"] == main_branch["id"]

        r = manager.patch(f"{BASE_URL}/api/rooms/{room['id']}", json={"capacity": 30})
        assert r.status_code == 200 and r.json()["capacity"] == 30
        got = [x for x in manager.get(f"{BASE_URL}/api/rooms").json() if x["id"] == room["id"]]
        assert got and got[0]["capacity"] == 30

        assert manager.delete(f"{BASE_URL}/api/rooms/{room['id']}").status_code == 200
        assert not any(x["id"] == room["id"] for x in manager.get(f"{BASE_URL}/api/rooms").json())
        created["rooms"].remove(room["id"])

    def test_unknown_room_404(self, manager):
        assert manager.patch(f"{BASE_URL}/api/rooms/nope", json={"capacity": 1}).status_code == 404
        assert manager.delete(f"{BASE_URL}/api/rooms/nope").status_code == 404

    def test_student_cannot_create_room(self, student, main_branch):
        r = student.post(f"{BASE_URL}/api/rooms", json={"name": "x", "branch_id": main_branch["id"]})
        assert r.status_code == 403


# ---------------- EXTENDED CLASS FIELDS ----------------
class TestClassFields:
    def test_new_fields_roundtrip(self, manager, created, course_id, main_branch, seeded_rooms):
        body = _cls(course_id, class_type="online", days=["Sun", "Tue"],
                    start_time="14:00", end_time="15:30",
                    start_date="2026-09-01", end_date="2026-12-01",
                    status="paused", meeting_platform="Zoom",
                    meeting_url="https://zoom.us/j/123", meeting_instructions="Use headphones",
                    branch_id=main_branch["id"], room_id=seeded_rooms[0]["id"])
        r = _create(manager, created, body)
        doc = r.json()
        for k, v in body.items():
            assert doc.get(k) == v, f"field {k} mismatch: {doc.get(k)} != {v}"

        listed = [c for c in manager.get(f"{BASE_URL}/api/classes").json() if c["id"] == doc["id"]]
        assert listed, "created class missing from list"
        for k, v in body.items():
            assert listed[0].get(k) == v, f"list field {k} mismatch"

        r = manager.patch(f"{BASE_URL}/api/classes/{doc['id']}",
                          json={"status": "completed", "meeting_url": "https://meet.google.com/x"})
        assert r.status_code == 200, r.text
        assert r.json()["status"] == "completed"
        assert r.json()["meeting_url"] == "https://meet.google.com/x"

    def test_patch_unknown_class_404(self, manager):
        assert manager.patch(f"{BASE_URL}/api/classes/nope", json={"name": "x"}).status_code == 404

    def test_student_cannot_create_class(self, student, course_id):
        assert student.post(f"{BASE_URL}/api/classes", json=_cls(course_id)).status_code == 403

    def test_teacher_cannot_create_class(self, teacher, course_id):
        assert teacher.post(f"{BASE_URL}/api/classes", json=_cls(course_id)).status_code == 403


# ---------------- CONFLICT DETECTION ----------------
class TestConflicts:
    def test_room_conflict(self, manager, created, course_id, seeded_rooms, main_branch):
        room = seeded_rooms[0]["id"]
        # force=true so pre-existing seeded/QA classes in this slot don't block setup
        base = _create(manager, created, _cls(course_id, days=["Sat", "Mon"], room_id=room,
                                              branch_id=main_branch["id"],
                                              start_time="08:00", end_time="09:00"),
                       force=True).json()
        r = manager.post(f"{BASE_URL}/api/classes",
                         json=_cls(course_id, days=["Sat", "Wed"], room_id=room,
                                   branch_id=main_branch["id"],
                                   start_time="08:30", end_time="09:30"))
        assert r.status_code == 409, f"expected 409, got {r.status_code}: {r.text[:300]}"
        detail = r.json()["detail"]
        conf = detail["conflicts"]
        assert any(c["class_id"] == base["id"] for c in conf), conf
        hit = [c for c in conf if c["class_id"] == base["id"]][0]
        assert hit["conflicts"] == ["room"], hit
        assert "Sat" in hit["days"]

    def test_teacher_conflict(self, manager, created, course_id, teacher_id):
        base = _create(manager, created, _cls(course_id, days=["Tue"], teacher_id=teacher_id,
                                              start_time="10:00", end_time="11:00")).json()
        r = manager.post(f"{BASE_URL}/api/classes",
                         json=_cls(course_id, days=["Tue"], teacher_id=teacher_id,
                                   start_time="10:30", end_time="11:30"))
        assert r.status_code == 409, r.text
        hit = [c for c in r.json()["detail"]["conflicts"] if c["class_id"] == base["id"]]
        assert hit and hit[0]["conflicts"] == ["teacher"], r.text

    def test_force_bypasses(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[1]["id"]
        _create(manager, created, _cls(course_id, days=["Mon"], room_id=room,
                                       start_time="08:00", end_time="09:00"))
        r = _create(manager, created, _cls(course_id, days=["Mon"], room_id=room,
                                           start_time="08:30", end_time="09:30"), force=True)
        assert r.json()["room_id"] == room

    def test_no_conflict_different_day(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[2]["id"]
        _create(manager, created, _cls(course_id, days=["Sat"], room_id=room,
                                       start_time="08:00", end_time="09:00"))
        _create(manager, created, _cls(course_id, days=["Sun"], room_id=room,
                                       start_time="08:00", end_time="09:00"))

    def test_no_conflict_different_time(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[3]["id"]
        _create(manager, created, _cls(course_id, days=["Wed"], room_id=room,
                                       start_time="08:00", end_time="09:00"))
        _create(manager, created, _cls(course_id, days=["Wed"], room_id=room,
                                       start_time="10:00", end_time="11:00"))

    def test_no_conflict_non_overlapping_dates(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[0]["id"]
        _create(manager, created, _cls(course_id, days=["Thu"], room_id=room,
                                       start_time="16:00", end_time="17:00",
                                       start_date="2026-01-01", end_date="2026-05-01"))
        _create(manager, created, _cls(course_id, days=["Thu"], room_id=room,
                                       start_time="16:00", end_time="17:00",
                                       start_date="2026-06-01", end_date="2026-09-01"))

    def test_archived_class_excluded(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[1]["id"]
        first = _create(manager, created, _cls(course_id, days=["Thu"], room_id=room,
                                               start_time="18:00", end_time="19:00")).json()
        assert manager.delete(f"{BASE_URL}/api/classes/{first['id']}").status_code == 200
        _create(manager, created, _cls(course_id, days=["Thu"], room_id=room,
                                       start_time="18:00", end_time="19:00"))

    def test_check_conflicts_endpoint(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[2]["id"]
        base = _create(manager, created, _cls(course_id, days=["Mon"], room_id=room,
                                              start_time="13:00", end_time="14:00")).json()
        before = len(manager.get(f"{BASE_URL}/api/classes").json())
        r = manager.post(f"{BASE_URL}/api/classes/check-conflicts",
                         json=_cls(course_id, days=["Mon"], room_id=room,
                                   start_time="13:30", end_time="14:30"))
        assert r.status_code == 200, r.text
        conf = r.json()["conflicts"]
        assert any(c["class_id"] == base["id"] for c in conf), conf
        assert len(manager.get(f"{BASE_URL}/api/classes").json()) == before, \
            "check-conflicts must not create a class"

    def test_check_conflicts_no_conflict(self, manager, course_id, seeded_rooms):
        r = manager.post(f"{BASE_URL}/api/classes/check-conflicts",
                         json=_cls(course_id, days=["Sat"], room_id=seeded_rooms[3]["id"],
                                   start_time="22:00", end_time="23:00"))
        assert r.status_code == 200 and r.json()["conflicts"] == []

    def test_check_conflicts_manager_only(self, teacher, course_id):
        assert teacher.post(f"{BASE_URL}/api/classes/check-conflicts",
                            json=_cls(course_id)).status_code == 403

    def test_patch_creating_conflict_409_and_force(self, manager, created, course_id, seeded_rooms):
        room = seeded_rooms[3]["id"]
        a = _create(manager, created, _cls(course_id, days=["Sun"], room_id=room,
                                           start_time="06:00", end_time="07:00")).json()
        b = _create(manager, created, _cls(course_id, days=["Sun"], room_id=room,
                                           start_time="19:00", end_time="20:00")).json()
        r = manager.patch(f"{BASE_URL}/api/classes/{b['id']}",
                          json={"start_time": "06:30", "end_time": "07:30"})
        assert r.status_code == 409, f"expected 409, got {r.status_code}: {r.text[:300]}"
        assert any(c["class_id"] == a["id"] for c in r.json()["detail"]["conflicts"])

        r = manager.patch(f"{BASE_URL}/api/classes/{b['id']}?force=true",
                          json={"start_time": "06:30", "end_time": "07:30"})
        assert r.status_code == 200, r.text
        assert r.json()["start_time"] == "06:30"

    def test_patch_self_not_conflicting(self, manager, created, course_id, seeded_rooms):
        c = _create(manager, created, _cls(course_id, days=["Mon"], room_id=seeded_rooms[0]["id"],
                                           start_time="20:00", end_time="21:00")).json()
        r = manager.patch(f"{BASE_URL}/api/classes/{c['id']}", json={"name": f"{TAG}_renamed"})
        assert r.status_code == 200, f"self-conflict false positive: {r.text[:300]}"
