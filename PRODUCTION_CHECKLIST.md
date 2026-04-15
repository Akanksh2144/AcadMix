# AcadMix — Production Deployment Checklist

> **Purpose:** Step-by-step checklist to activate all production-grade fixes
> before going live. Generated from the April 2026 architecture audit.

---

## 1. PgBouncer (Connection Pooling)

Without PgBouncer, scaling pods will exhaust PostgreSQL's `max_connections` limit.

```bash
# Deploy PgBouncer to your K8s cluster
kubectl apply -f k8s/pgbouncer.yaml
```

- [ ] Update `userlist.txt` in `k8s/pgbouncer.yaml` with your actual PostgreSQL credentials
- [ ] Set `POSTGRES_HOST` secret to point to your Supabase/RDS PostgreSQL instance
- [ ] Verify PgBouncer pods are healthy: `kubectl get pods -l app=pgbouncer -n acadmix`

---

## 2. Environment Variables (FastAPI Pods)

Update your FastAPI deployment to route through PgBouncer:

```bash
# Point DATABASE_URL at PgBouncer service, NOT directly at PostgreSQL
DATABASE_URL=postgresql+asyncpg://postgres:<password>@pgbouncer-service:5432/acadmix

# Enable PgBouncer-aware pool sizing (small pools, PgBouncer multiplexes)
PGBOUNCER_ENABLED=true

# Optional: override pool sizes (defaults: 5 pool_size, 10 max_overflow with PgBouncer)
# DB_POOL_SIZE=5
# DB_MAX_OVERFLOW=10
```

- [ ] Set `PGBOUNCER_ENABLED=true` in FastAPI pod env
- [ ] Point `DATABASE_URL` to `pgbouncer-service:5432`
- [ ] Verify connection: hit `GET /api/health/db` and confirm `pgbouncer_enabled: true`

---

## 3. Redis + ARQ Workers

Code reviews are now queued via ARQ (Redis). Without Redis, they fall back to synchronous execution (still works, but blocks the event loop).

- [ ] Ensure `REDIS_URL` is set in FastAPI pod env (e.g., `redis://redis-service:6379`)
- [ ] Deploy the ARQ worker: `python -m app.workers.arq_worker`
- [ ] Verify queue is processing: check ARQ worker logs for `process_ai_review_task` jobs

---

## 4. Monitoring & Alerts

The new `/api/health/db` endpoint exposes critical metrics:

```bash
# Test it
curl https://api.acadmix.org/api/health/db
```

**Response includes:**
- `connection_pool.checked_out` — active DB connections (alert if > 80% of pool_size)
- `connection_pool.overflow` — overflow connections (alert if > 0 sustained)
- `rls_shadow_mode.circuit_open` — **CRITICAL**: true means cross-tenant data leak detected

- [ ] Add `/api/health/db` to Prometheus/Datadog/Grafana scraper
- [ ] Set alert: `connection_pool.checked_out > pool_size * 0.8` → Pool Saturation Warning
- [ ] Set alert: `rls_shadow_mode.circuit_open == true` → **P0 CRITICAL** (data isolation breach)
- [ ] Set alert: `rls_shadow_mode.violations_logged > 0` → Investigate immediately

---

## 5. Security — Final Checks

- [ ] Ensure `SEED_DEMO_USERS=false` (or unset) in production
- [ ] Set `DEBUG_MODE=false`
- [ ] Rotate `JWT_SECRET` to a cryptographically random 256-bit key
- [ ] Verify `ADMIN_PASSWORD` is set to a strong password (not `admin123`)
- [ ] Confirm Sentry DSN is set and PII scrubbing is active

---

## 6. Documentation Integrity

All documentation has been updated to reflect the actual PostgreSQL stack.
No MongoDB references remain. If you add new docs, use these correct references:

```
Database:     PostgreSQL (with Row-Level Security)
ORM:          SQLAlchemy 2.x (async)
Driver:       asyncpg
Migrations:   Alembic
Task Queue:   ARQ (Redis-backed)
Pool Proxy:   PgBouncer (transaction mode)
```

---

## Quick Verification Script

Run this after deployment to verify all systems:

```bash
# 1. Health check
curl -s https://api.acadmix.org/api/health | jq .

# 2. Pool metrics
curl -s https://api.acadmix.org/api/health/db | jq .

# 3. Verify PgBouncer is active
curl -s https://api.acadmix.org/api/health/db | jq '.connection_pool.pgbouncer_enabled'
# Expected: true

# 4. Verify RLS is enforced
curl -s https://api.acadmix.org/api/health/db | jq '.rls_shadow_mode.circuit_open'
# Expected: false

# 5. Test code review queue (should return "queued" not "sync-fallback")
curl -s -X POST https://api.acadmix.org/api/code/review \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"code":"print(1)","language":"python"}' | jq '.status'
# Expected: "queued"
```

---

*Generated: April 15, 2026 — from Production Architecture Audit*
*Last updated: April 15, 2026*
