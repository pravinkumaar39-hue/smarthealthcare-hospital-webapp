# SmartHealthcare — Module 3: React Frontend (Login & Authentication UI)

## What's included

```
frontend/
├── index.html
├── package.json
├── vite.config.js          # dev proxy: /api -> http://127.0.0.1:8000
├── tailwind.config.js       # blue/white healthcare theme
├── postcss.config.js
├── .env.example
└── src/
    ├── main.jsx
    ├── App.jsx               # routes + role-based redirects
    ├── index.css             # Tailwind + glassmorphism styles
    ├── api/
    │   └── client.js          # axios instance, auth endpoints, 401 auto-logout
    ├── context/
    │   └── AuthContext.jsx    # global auth state, login/logout, role->route map
    ├── components/
    │   ├── Logo.jsx
    │   ├── FormInput.jsx
    │   ├── Button.jsx
    │   └── ProtectedRoute.jsx # auth + RBAC route guard
    └── pages/
        ├── LoginPage.jsx        # Mobile+OTP / Patient ID / Admin tabs
        ├── RegisterPage.jsx     # new patient registration (TN cities)
        ├── ChangePasswordPage.jsx
        └── Dashboards.jsx       # placeholder dashboards per role (Modules 4-10)
```

## Pages built

1. **Login Page** (`/login`)
   - Glassmorphism card, blue/white theme, animated background
   - 3 tabs: **Mobile + OTP** (mocked OTP — ready to wire to a real endpoint),
     **Patient ID + Password**, **Admin Login**
   - Calls `POST /auth/login/patient` and `POST /auth/login/admin`
   - On success, stores JWT + user info, redirects by role:
     - `PATIENT` → `/patient/dashboard` (or `/change-password` if `must_change_password`)
     - `CITY_ADMIN` → `/admin/city/dashboard`
     - `STATE_ADMIN` → `/admin/state/dashboard`
     - `SUPER_ADMIN` → `/admin/super/dashboard`

2. **Register Page** (`/register`)
   - Full registration form (Name, Age, Gender, Mobile, Email, Address,
     Blood Group, State, City)
   - State dropdown defaults to Tamil Nadu; City dropdown shows the 10
     supported branch cities when state = Tamil Nadu
   - Calls `POST /auth/register`, shows the auto-generated Patient ID
     (e.g. `PTN0042`) with a copy button on success

3. **Change Password Page** (`/change-password`)
   - Shown automatically after first login if `must_change_password` is true
   - Calls `PUT /auth/change-password`

4. **Role Dashboards** (placeholders for Modules 4–10)
   - `/patient/dashboard`, `/admin/city/dashboard`,
     `/admin/state/dashboard`, `/admin/super/dashboard`
   - Each has a header with logo, user name/role, and logout

## Auth & RBAC

- JWT stored in `localStorage` (`sh_token`), attached via axios interceptor
- `AuthContext` validates the token on app load via `GET /auth/me`
- `ProtectedRoute` enforces both authentication and role membership;
  unauthorized roles get redirected to their own dashboard, not a 403 page
- 401 responses globally trigger logout + redirect to `/login`

## Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`. The Vite dev server proxies any
`/api/*` request to your FastAPI backend at `http://127.0.0.1:8000`
(make sure `uvicorn main:app --reload` is running from Module 2).

## Test credentials (from Module 1 seed data)

| Role        | Username   | Password     |
|-------------|-----------|---------------|
| Patient     | PTN0001   | PTN0001 (forces password change) |
| Super Admin | admin     | admin123 |
| State Admin | SATN1     | SATN1@123 |
| City Admin  | ADTNC1    | ADTNC1@123 |

## Build for production

```bash
npm run build
```

Output goes to `frontend/dist/` — serve with any static host, or behind
the same domain as the FastAPI backend with a reverse proxy.

## Next module

**Module 4: Patient Portal** — Dashboard widgets, Book Appointment flow
(Branch → Department → Doctor → Date/Time → Confirm), My Appointments,
AI Health Assistant.
