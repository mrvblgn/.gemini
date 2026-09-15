# Phase 8 Implementation Plan — Docker and Local Reproducibility

## Overview
Phase 8 enables complete, reproducible containerization of the **Bursa City Service Management System (BCSMS)** using Docker Compose.

The containerized stack consists of three services:
1. **`db`**: Microsoft SQL Server 2022 with a persistent named volume and healthcheck.
2. **`api`**: ASP.NET Core 8 Web API running on .NET 8 runtime, connecting to SQL Server, applying EF Core migrations, and seeding deterministic development demo data.
3. **`web`**: React + TypeScript frontend built with Vite and served via Nginx (SPA fallback for React Router and reverse proxy for `/api/` calls to the backend).

```
Browser
  │ (http://localhost:3000)
  ▼
[ web ] (Nginx Alpine)
  ├── Static SPA assets (React Router fallback)
  └── /api/* Reverse Proxy ───────────┐
                                      ▼
                               [ api ] (.NET 8 Web API:8080)
                                      │ (EF Core Migrations)
                                      ▼
                               [ db ] (SQL Server 2022:1433)
                                      │
                                      ▼
                             [ bcsms_sql_data (Volume) ]
```

---

## User Review Required

> [!IMPORTANT]
> - **Zero Real Secrets**: All passwords and JWT keys in `.env.example` and `docker-compose.yml` are clearly marked local development placeholders (`BcsmsLocalDevPassword2026!`).
> - **EF Core Migrations**: SQL Server schema is initialized using `await db.Database.MigrateAsync()` (applying the existing migration `20260819131409_InitialCreate`), ensuring schema parity and migration history tracking.
> - **Reverse Proxy Architecture**: Nginx serves the production SPA bundle and proxies `/api/` to `http://api:8080/api/`. Browser clients make same-origin requests to `http://localhost:3000/api/`, eliminating CORS and dynamic container IP resolution issues.

---

## Proposed Changes

### 1. Docker & Containerization Structure

#### [NEW] [Dockerfile (Backend)](file:///Users/mervebilgin/BursaCityServiceManagement/docker/dotnet/Dockerfile)
- Multi-stage .NET 8 build:
  - **Stage 1 (Build)**: `mcr.microsoft.com/dotnet/sdk:8.0 AS build`. Restores project dependencies using layer caching (`BCSMS.Domain`, `BCSMS.Application`, `BCSMS.Infrastructure`, `BCSMS.API`), copies source, publishes Release output to `/app/publish`.
  - **Stage 2 (Runtime)**: `mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime`. Minimal runtime image containing only the published binaries. Exposes port `8080`.

#### [NEW] [Dockerfile (Frontend)](file:///Users/mervebilgin/BursaCityServiceManagement/docker/frontend/Dockerfile)
- Multi-stage Node + Nginx build:
  - **Stage 1 (Build)**: `node:20-alpine AS build`. Installs dependencies via `npm ci`, runs `npm run build` producing optimized static assets in `dist/`.
  - **Stage 2 (Serve)**: `nginx:1.27-alpine AS runtime`. Copies `dist/` into `/usr/share/nginx/html` and installs custom `nginx.conf`. Exposes port `80`.

#### [NEW] [nginx.conf](file:///Users/mervebilgin/BursaCityServiceManagement/docker/frontend/nginx.conf)
- Nginx configuration for the frontend container:
  - `try_files $uri $uri/ /index.html;` for React Router SPA route resolution on page refresh.
  - `location /api/ { proxy_pass http://api:8080/api/; ... }` for transparent API proxying.

#### [MODIFY] [docker-compose.yml](file:///Users/mervebilgin/BursaCityServiceManagement/docker-compose.yml)
- Complete Compose orchestration:
  - Service `db`: `mcr.microsoft.com/mssql/server:2022-latest`, port `1433:1433`, volume `bcsms_sql_data`, healthcheck using `sqlcmd`.
  - Service `api`: builds `docker/dotnet/Dockerfile`, depends on `db` (`condition: service_healthy`), environment variables for connection string and JWT, port `5123:8080`.
  - Service `web`: builds `docker/frontend/Dockerfile`, depends on `api` (`condition: service_started`), port `3000:80`.
  - Named volume `bcsms_sql_data` for database persistence across container restarts.

#### [NEW] [.env.example](file:///Users/mervebilgin/BursaCityServiceManagement/.env.example)
- Root environment file documenting safe local development defaults (`SA_PASSWORD`, `JWT_SECRET`, `ASPNETCORE_ENVIRONMENT`).

---

### 2. Backend Startup & Migration Initialization

#### [MODIFY] [Program.cs](file:///Users/mervebilgin/BursaCityServiceManagement/backend/dotnet/src/BCSMS.API/Program.cs)
- Update database initialization in `Program.cs` when in `Development` environment:
  - If `db.Database.IsSqlServer()`, apply migrations with `await db.Database.MigrateAsync()`.
  - If SQLite/InMemory, fallback to `db.Database.EnsureCreated()`.
  - Execute `IDbSeeder.SeedDevelopmentDataAsync()` safely inside try/catch block.

---

## Verification Plan

### 1. Automated Tests Outside Containers
```bash
# Backend solution tests
dotnet build backend/dotnet/BCSMS.sln
dotnet test backend/dotnet/BCSMS.sln

# Frontend tests & build
cd frontend/web
npm run typecheck
npm test -- --run
npm run build
```

### 2. Docker Stack Validation
```bash
# Validate compose syntax
docker compose config

# Build all container images
docker compose build

# Start services
docker compose up -d

# Verify health status
docker compose ps
```

### 3. Containerized Smoke Test & Data Flow
- Verify database health check passes.
- Verify `api` container connects to SQL Server, runs migrations, seeds demo accounts.
- Verify `web` container serves React SPA on `http://localhost:3000`.
- Verify `/api/` proxy route connects to backend without CORS errors.
- Test SPA direct URL refresh (e.g. `http://localhost:3000/manager/requests`).
- Execute end-to-end smoke test through the containerized web UI / API:
  - Citizen registers and submits request
  - Manager logs in, reviews, and assigns to employee
  - Employee starts work and resolves
  - Manager closes request

### 4. Database Persistence Verification
- Stop containers with `docker compose stop` (preserving named volume).
- Restart containers with `docker compose start`.
- Query API / Web to verify previously created records persist seamlessly in SQL Server.
