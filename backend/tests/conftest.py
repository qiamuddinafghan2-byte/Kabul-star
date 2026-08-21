import os
import re
from pathlib import Path

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
_base = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not _base:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
BASE_URL = _base.rstrip("/")


def _creds():
    p = Path("/app/memory/test_credentials.md")
    text = p.read_text(encoding="utf-8") if p.exists() else ""
    out = {}
    for role in ("manager", "teacher", "student"):
        pass
    # parse blocks
    blocks = re.split(r"\n##\s+", text)
    for b in blocks:
        em = re.search(r"Email:\s*`([^`]+)`", b)
        pw = re.search(r"Password:\s*`([^`]+)`", b)
        rl = re.search(r"Role:\s*`([^`]+)`", b)
        if em and pw:
            role = rl.group(1) if rl else ("manager" if "Admin" in b else None)
            if role:
                out[role] = {"email": em.group(1), "password": pw.group(1)}
    return out


CREDS = _creds()


@pytest.fixture(scope="session")
def creds():
    if not all(k in CREDS for k in ("manager", "teacher", "student")):
        pytest.skip("credentials missing in /app/memory/test_credentials.md")
    return CREDS


def make_client(email=None, password=None):
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    if email:
        r = s.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
        if r.status_code != 200:
            pytest.fail(f"login failed for {email}: {r.status_code} {r.text[:300]}")
        tok = r.json().get("access_token")
        if not tok:
            pytest.fail("no access_token in login response")
        s.headers.update({"Authorization": f"Bearer {tok}"})
        s.user = r.json()
    return s


@pytest.fixture(scope="session")
def anon():
    return make_client()


@pytest.fixture(scope="session")
def manager(creds):
    return make_client(creds["manager"]["email"], creds["manager"]["password"])


@pytest.fixture(scope="session")
def teacher(creds):
    return make_client(creds["teacher"]["email"], creds["teacher"]["password"])


@pytest.fixture(scope="session")
def student(creds):
    return make_client(creds["student"]["email"], creds["student"]["password"])
