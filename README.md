# Secure Placement & VTU Quiz Platform

Enterprise-grade assessment platform for Placement Training and VTU 1 Credit Courses.

## Structure
- `backend/` Express + MongoDB REST API
- `frontend/` React + Tailwind dashboard

## Quick Start
### Backend
1. `cd backend`
2. `npm install`
3. Create `.env` from `.env.example`
4. `npm run dev`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Security Baseline
- JWT access + refresh token flow
- Bcrypt password hashing
- Helmet, CORS allowlist, rate limiting
- Input validation and Mongo sanitization
- Role-based access control (Admin, Principal, Professor, StudentProctor, Student)

## Exam System API (Initial)
- `POST /api/exams` (Admin, Professor): create timed exam with schedule/attempt limit.
- `GET /api/exams`: list exams by role scope.
- `GET /api/exams/:examId`: exam details with role/batch checks.
- `POST /api/exams/:examId/start` (Student): starts or resumes active attempt, returns `attemptId`, `sessionToken`, shuffled question set, and `deadlineAt`.
- `POST /api/exams/:examId/submit` (Student): validates session token + device IP, applies server-side timer check, computes score with negative marking.
- `POST /api/exams/:examId/timeout` (Student): forced timeout submit path.
