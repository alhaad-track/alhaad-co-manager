# alhaad-go-api ↔ alhaad-co-manager

## Current state

There's **no link between them yet.** alhaad-co-manager never calls alhaad-go-api. It has no reference to `/api/v1`, `/ws/live` or a Go API URL. All of its traffic goes to **Traccar** through the Next.js proxy (`src/app/api/proxy/[...path]/route.ts`), which forwards to `NEXT_PUBLIC_TRACCAR_API_URL`, and it logs in with a Traccar session plus Basic auth.

The Go API reads the same Traccar PostgreSQL database directly and adds Redis caching. So it can replace some of the co-manager's calls, but only the read-only ones.

## What the Go API provides (`alhaad-go-api/main.go`)

| Endpoint | Auth | Input → Output |
|---|---|---|
| `GET /health` | public | – |
| `POST /api/v1/auth/login` | public | `{email, password}` → `{token, expiresAt, user}` (checks Traccar's own password hashes) |
| `GET /api/v1/auth/me` | JWT | – → user |
| `GET /api/v1/devices` | JWT | `?userId=&groupId=` → `{count, devices}` (cached in Redis) |
| `GET /api/v1/positions/latest` | JWT | `?deviceId=` → position |
| `POST /api/v1/positions/latest` | JWT | `{deviceIds:[...]}` → `{count, positions}` |
| `GET /api/v1/positions/history` | JWT | `?deviceId=&from=&to=&limit=&offset=` → `{count, positions}` |
| `POST /api/v1/positions/history` | JWT | `{deviceIds, from, to, limit, offset}` → `{count, positions}` |
| `GET /api/v1/reports/events` | JWT | `?deviceId=&from=&to=&limit=&offset=` → `{count, events}` |
| `POST /api/v1/reports/events` | JWT | `{deviceIds, types, from, to, limit, offset}` → `{count, events}` |
| `GET /api/v1/reports/summary` | JWT | `?deviceId=&from=&to=` → `{from, to, summaries}` |
| `POST /api/v1/reports/summary` | JWT | `{deviceIds}` + `?from=&to=` → `{from, to, summaries}` |
| `GET /api/v1/users` | JWT | `?userId=&deviceId=` → `{count, users}` (admins: all; managers: self + managed; others: self) |
| `GET /api/v1/users/:id` | JWT | → user |
| `POST /api/v1/users` | JWT (admin/manager) | Traccar user + `password` → user (201); managers' new users are linked to them |
| `PUT /api/v1/users/:id` | JWT | fields to change (+ optional `password`) → user |
| `DELETE /api/v1/users/:id` | JWT | → 204 (not yourself) |
| `GET/POST/PUT/DELETE /api/v1/devices[/:id]` | JWT | device CRUD; `?driverId=` filter on the list |
| `GET/POST/PUT/DELETE /api/v1/drivers[/:id]`, `/geofences[/:id]` | JWT | driver and geofence CRUD |
| `POST/DELETE /api/v1/permissions` | JWT | `{userId, deviceId}` etc. → 204 |
| `GET /api/v1/positions/:id` | JWT | → position |
| `GET/POST /api/v1/reports/trips`, `/reports/stops` | JWT | `{deviceIds, from, to}` → `{from, to, count, trips/stops}` |
| `GET /api/v1/geocode` | JWT | `?latitude=&longitude=` → address as text |
| `POST /api/v1/telemetry/forward` | `FORWARD_SECRET` | Traccar forwards positions here; they're cached in Redis and published |
| `WS /ws/live` | **none** | streams every position update from Redis |

Authenticated requests send `Authorization: Bearer <token>`.

## What the co-manager uses today (all Traccar, mostly in `src/lib/api.ts`)

| Co-manager call | Where it's used | Go API equivalent? |
|---|---|---|
| `POST /api/session` (login) | `src/lib/auth.tsx:44` | ✅ `/auth/login`, but it returns a JWT instead of a cookie |
| `GET /api/devices` | tracking, vehicles, `src/app/api/custom/vehicles/route.ts` | ✅ `/devices`, but the response is wrapped in `{count, devices}` and has fewer fields (no `positionId`, `phone`, `model`, `category`, `contact`) |
| `GET /api/positions` | `src/app/dashboard/tracking/page.tsx:43`, `getPosition` | ✅ `POST /positions/latest` |
| `GET /api/reports/route` | `getRoute` (trip history, maps) | ✅ `/positions/history` |
| `GET /api/reports/events` | alerts page, ReportGenerator | ✅ `/reports/events` |
| `GET /api/reports/summary` | ReportGenerator, TripStats | ✅ `/reports/summary` (output fields are Traccar-compatible) |
| `POST /api/session/token` + Traccar WebSocket | `src/context/SocketContext.tsx:45` | ⚠️ `/ws/live` exists, but it only sends raw positions. Traccar's socket sends `{devices, positions, events}`, so live alerts would break |
| `GET /api/reports/trips`, `/api/reports/stops` | trip history, reports | ✅ `POST /reports/trips`, `/reports/stops`, computed from positions with Traccar's default thresholds |
| `GET /api/positions?id=` | vehicle view, alerts | ✅ `/positions/:id` |
| `/api/devices` POST/PUT/DELETE | vehicle forms | ✅ `/devices` (GET one, POST, PUT, DELETE); `deviceLimit` and `deviceReadonly` apply |
| `/api/users` CRUD | users pages | ✅ `/users` (GET list/one, POST, PUT, DELETE), scoped like Traccar; list is wrapped in `{count, users}` |
| `/api/drivers` CRUD | drivers pages | ✅ `/drivers` (GET list/one, POST, PUT, DELETE) |
| `/api/geofences` CRUD | geofences | ✅ `/geofences` (GET list/one, POST, PUT, DELETE) |
| `/api/permissions` (link/unlink) | vehicle, driver and user assignment | ✅ `POST`/`DELETE /permissions` |
| `/api/commands`, `/api/commands/send` | saved commands, CommandDialog | ❌ still Traccar (sending needs Traccar anyway) |
| `/api/server/geocode` | alerts, `getAddress` | ✅ `/geocode`, via a Nominatim-compatible geocoder (`GEOCODER_URL`) with Redis caching |

Writes go straight to the database. Traccar caches the devices, geofences and links of connected trackers in memory, so its live processing (geofence events, notifications) only sees those changes after the tracker reconnects or Traccar restarts.

## Where the Go API would help

Use it for the heavy read paths: the tracking page's device and position load, route and history playback, the events and alerts list, and the summary reports. Batch calls like `POST /positions/latest` with many `deviceIds` are where it will beat Traccar.

Only commands still go to Traccar.

## Problems to fix in the Go API before the co-manager uses it

1. ~~**No per-user access control.**~~ *Fixed: device, position and report endpoints are now scoped to the devices the user can access in Traccar.* The positions, reports and history endpoints never check whether the logged-in user owns the `deviceId`. Any valid JWT can read any vehicle. `/devices` without a `userId` returns every device, and a non-admin can pass someone else's `userId`. The JWT already carries `userId` and `administrator`, so the fix is to filter through `tc_user_device` for non-admins.
2. **`/ws/live` has no authentication** and sends every device's positions to anyone who connects.
3. **Fallback JWT secret.** If `JWT_SECRET` isn't set, it silently uses the hardcoded `"default-traccar-fast-api-secret-key-change-me"`.
4. **Two logins.** To use both backends, the co-manager needs a Traccar session and a Go JWT at the same time, so `auth.tsx` would have to log in to both.

## Suggested order

1. Fix problems 1–3 in alhaad-go-api.
2. Add a Go API client to the co-manager (a base URL env var, JWT storage, and a second login in `auth.tsx`).
3. Switch the tracking page's initial load, plus ReportGenerator's events and summary calls, to the Go API.
4. Optionally, add trips/stops endpoints and a richer `/ws/live` payload (with events) to the Go API.
