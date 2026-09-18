# CertiCertify — Frontend

React + TypeScript + Vite, styled with Tailwind CSS in a pine-green / sage / paper-white palette.

## Setup

```
npm install
npm run dev
```

The app expects the FastAPI backend at the URL in `.env` (`VITE_API_BASE_URL`, currently `http://127.0.0.1:5959` — update it if your backend runs elsewhere, e.g. `http://127.0.0.1:8000`).

The backend needs CORS enabled for the frontend's origin (`http://localhost:5173` in dev) — add `CORSMiddleware` in `main.py` if it isn't there yet, per the backend notes.

## Pages

- `/login`, `/register`, `/verify-otp`, `/forgot-password` — public auth flows
- `/dashboard` — institution overview
- `/dashboard/students` — upload a student roster (.xlsx) with optional certificate files
- `/dashboard/institutions` — registry of all institutions
- `/dashboard/profile` — view/edit/delete the signed-in institution

Auth token is stored in `localStorage` and attached to every request; a 401 response signs the session out automatically.
