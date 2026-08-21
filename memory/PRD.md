# Kabul Star English Language Academy — Product Requirements

## Original problem statement
Build a Complete Academy Management System for **Kabul Star English Language Academy**.
Concept: *Together for a Brighter Future*. Slogan: *Come to Learn, Leave to Serve*.
This is primarily an **academy management** application (not English-learning). Multi-branch-ready.
Roles: Student, Teacher, Manager/Admin.

## Phase-1 scope (this build)
- Public marketing homepage (Home, About, Programs, Announcements, Contact)
- Branding: navy blue + gold + white palette, custom SVG star logo
- JWT authentication with role-based access (student/teacher/manager)
- Role-based dashboard shells (empty structural stubs)
- Manager-authored announcements (backend CRUD) shown on public pages
- Manager-editable contact information (backend endpoints available)
- Seeded admin account for the owner
- Foundation database schema + indexes
- Deferred: student/teacher/manager management modules (Phase 2)

## Architecture
- Backend: FastAPI + MongoDB (motor). Cookies (httpOnly, samesite=none, secure) with JWT access + refresh.
- Auth: bcrypt hashing, brute-force lockout, admin seed on startup, indexes on users.email (unique).
- Frontend: React + Tailwind + Shadcn UI + Framer Motion + Sonner toasts. Merriweather + Outfit fonts.

## Personas
- **Manager (Owner)**: publishes announcements, manages contact info & academy settings, oversees teachers/students (later).
- **Teacher**: manages classes, attendance, homework, communication with students (later phases).
- **Student**: views classes, schedule, homework, attendance, progress, announcements (later phases).

## Implemented (2026-02)
- Public homepage with hero, about intro, programs pathway (Pre-Beginner → PELP), latest announcements grid, CTA.
- About / Programs / Announcements / Contact pages sourced from backend where relevant.
- Login flow with 3 role portals (`/login/:role`) + role tabs + role verification on login.
- Protected routes: `/dashboard/manager`, `/dashboard/teacher`, `/dashboard/student`.
- Backend endpoints: auth (login/logout/me/refresh), announcements CRUD (public + manager), settings/contact (public + manager), dashboard role-check stubs.
- Seeded manager `qiamuddinafghan80@gmail.com / Admin@123` + demo teacher & student accounts.
- 3 sample announcements auto-created on first startup.

## Backlog (P0 — next up)
- Manager UI: announcements manager (create/edit/publish/unpublish/delete) inside dashboard.
- Manager UI: contact/settings editor inside dashboard.
- Students CRUD (list, create, archive, filter by class).
- Teachers CRUD.
- Classes & schedule module.

## Backlog (P1)
- Attendance tracking
- Homework assignment & submission
- Fees & receipts
- Communication (announcements to specific classes / DMs)
- Certificates

## Backlog (P2 / future)
- Multi-branch support scaling
- QR-code attendance
- Push notifications, mobile app
- Online payments
- Parent accounts
- AI English tutor / online lessons (explicitly deferred)

## Test credentials
See `/app/memory/test_credentials.md`.
