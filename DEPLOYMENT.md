# AcadMix — Deployment Guide

## Architecture

```
acadmix.org          → Marketing Landing Site  (website/)
www.acadmix.org      → Redirects to acadmix.org
demo.acadmix.org     → App in demo tenant mode  (frontend/)
gnitc.acadmix.org    → App for GNITC college     (frontend/)
*.acadmix.org        → Any college tenant         (frontend/)
api.acadmix.org      → FastAPI Backend            (backend/)
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL (Supabase or self-hosted + PgBouncer)
- Redis (ARQ worker queue + caching)
- Vercel CLI (`npm i -g vercel`)
- Custom domain: `acadmix.org` with DNS access

---

## 1. Deploy Marketing Website → `acadmix.org`

```bash
cd website
npm run build
vercel --prod
```

**Vercel Project Settings:**
- Framework: Vite
- Build: `npm run build`
- Output: `dist`
- Domains: `acadmix.org`, `www.acadmix.org`

---

## 2. Deploy App Frontend → `*.acadmix.org`

```bash
cd frontend
npm run build
vercel --prod
```

**Vercel Project Settings:**
- Framework: Create React App (CRACO)
- Build: `npm run build`
- Output: `build`
- Domains: `*.acadmix.org` (wildcard)

> **Note:** Vercel requires Pro plan for wildcard subdomains.

**Environment Variables (Vercel):**
```
REACT_APP_BACKEND_URL=https://api.acadmix.org
REACT_APP_SENTRY_DSN=<your-sentry-dsn>
```

---

## 3. Deploy Backend → `api.acadmix.org`

### Option A: Fly.io (Recommended)

```bash
cd backend
fly launch
fly secrets set DATABASE_URL=<...> REDIS_URL=<...> JWT_SECRET=<...>
fly deploy
```

### Option B: Railway

1. Connect GitHub repo
2. Set root directory to `backend/`
3. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port 8080`
4. Add all environment variables from `.env`
5. Custom domain: `api.acadmix.org`

**Backend Environment Variables:**
```
DATABASE_URL=postgresql+asyncpg://<user>:<pass>@<host>:5432/acadmix
REDIS_URL=redis://<host>:6379
JWT_SECRET=<random-secret>
CORS_ORIGINS=https://acadmix.org,https://www.acadmix.org,https://*.acadmix.org
SENTRY_DSN=<backend-sentry-dsn>
GEMINI_API_KEY=<your-key>
CODE_RUNNER_URL=https://acadmix-code-runner.fly.dev
```

> **Production Requirement:** Deploy PgBouncer in transaction-pooling mode
> between FastAPI pods and PostgreSQL. See `k8s/pgbouncer.yaml` for config.

---

## 4. DNS Configuration

Add these DNS records at your domain registrar:

| Type  | Name    | Value                        | TTL  |
|-------|---------|------------------------------|------|
| A     | @       | 76.76.21.21 (Vercel)         | Auto |
| CNAME | www     | cname.vercel-dns.com         | Auto |
| CNAME | *       | cname.vercel-dns.com         | Auto |
| CNAME | api     | <your-fly-app>.fly.dev       | Auto |

> **Important:** The wildcard `*` CNAME enables all subdomains.

---

## 5. Adding a New College Tenant

1. **Backend:** Add entry to `TENANT_MAP` in `backend/app/core/tenant_middleware.py`:
   ```python
   "newcollege": {"college_id": "NEWCOLL", "name": "New College", "plan": "professional"},
   ```

2. **Database:** Seed college data with the matching `college_id`.

3. **DNS:** Wildcard already covers `newcollege.acadmix.org` — no DNS change needed.

4. **(Optional) Custom Domain:** If the college wants `exams.newcollege.edu`:
   - Add CNAME: `exams.newcollege.edu` → `cname.vercel-dns.com`
   - Add domain in Vercel project settings
   - Add hostname mapping in tenant middleware

---

## 6. Local Development

### Landing Site
```bash
cd website
npm run dev          # → http://localhost:5174
```

### App Frontend
```bash
cd frontend
npm start            # → http://localhost:3000
```

### Backend
```bash
cd backend
uvicorn app.main:app --reload --port 8001
```

### Testing Subdomains Locally

Edit your hosts file (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1  demo.localhost
127.0.0.1  gnitc.localhost
```

Then access `http://demo.localhost:3000` to test tenant detection.

---

## 7. SSL / HTTPS

- **Vercel:** Auto-provisions SSL for all domains (including wildcards on Pro plan)
- **Fly.io:** Auto-provisions SSL via Let's Encrypt
- **Custom domains:** SSL is auto-provisioned when the CNAME is verified

---

## Monitoring & Observability

- **Sentry:** Error tracking for both frontend and backend
- **Vercel Analytics:** Web vitals for landing and app
- **Backend Logs:** Structured logging via Python `logging` module
