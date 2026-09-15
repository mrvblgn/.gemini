# PostgreSQL Persistence Migration Report

## 1. Executive Summary

The **Bursa City Service Management System (BCSMS)** persistence layer has been migrated from SQL Server to **PostgreSQL 16** using `Npgsql.EntityFrameworkCore.PostgreSQL`. This enables a 100% free-tier cloud deployment on **Neon PostgreSQL** and **Render**, while optimizing local Docker Compose development with a lightweight `postgres:16-alpine` service.

---

## 2. Migration Overview

### Package Changes
- **Removed**: `Microsoft.EntityFrameworkCore.SqlServer` (8.0.8) from `BCSMS.Infrastructure.csproj`
- **Added**: `Npgsql.EntityFrameworkCore.PostgreSQL` (8.0.8) to `BCSMS.Infrastructure.csproj`

### Provider Configuration
- In `DependencyInjection.cs`: Registered `options.UseNpgsql(connectionString)`
- In `appsettings.json` / `appsettings.Development.json`: Updated default connection string to PostgreSQL format (`Host=localhost;Port=5432;Database=bcsms;...`)

### Migrations
- Removed SQL Server migration files.
- Generated fresh PostgreSQL initial migration: `20260819195143_InitialCreate.cs`.
- Validated PostgreSQL DDL mappings:
  - `Guid` $\rightarrow$ `uuid`
  - `string` $\rightarrow$ `character varying(length)`
  - `DateTime` $\rightarrow$ `timestamp with time zone` (UTC)
  - `bool` $\rightarrow$ `boolean`
  - `double` $\rightarrow$ `double precision`
  - Delete behaviors: `Cascade` for child collections (`StatusHistory`, `Comments`, `Attachments`), `Restrict` for cross-aggregate foreign keys.

---

## 3. Docker Compose & Local Storage
- Replaced `mssql/server:2022-latest` with `postgres:16-alpine` (healthcheck via `pg_isready`).
- Mapped host port `5433:5432` to avoid host port collisions.
- Created dedicated named volume: `bcsms_postgres_data` (preserving previous `bcsms_sql_data` for rollback safety).

---

## 4. Verification & Testing

### Automated Test Suites
- **Backend Tests**: **76 / 76 Passed (100%)**
  - `BCSMS.UnitTests`: 48 / 48 Passed (32 ms)
  - `BCSMS.IntegrationTests` (SQLite in-memory): 28 / 28 Passed (1.00 s)
- **Frontend Tests**: **28 / 28 Passed (100%)**
  - TypeScript Typecheck: 0 Errors
  - Vitest Unit & Component Tests: 28 / 28 Passed (1.54 s)
  - Production Build: Succeeded in 1.60 s

### Docker Container & E2E Smoke Test
- Docker containers (`bcsms-db`, `bcsms-api`, `bcsms-web`) started and healthy.
- Automatic migrations applied and demo seed completed.
- Full municipal lifecycle verified against PostgreSQL database:
  `Citizen (Register & Submit)` $\rightarrow$ `Manager (Review & Assign)` $\rightarrow$ `Employee (Start & Resolve)` $\rightarrow$ `Manager (Close)` $\rightarrow$ `Status: Closed (5 StatusHistory entries)`.

### Persistence Test
- Containers stopped (`docker compose stop`) and restarted (`docker compose start`).
- Re-queried previously closed request: State and full timeline remained 100% intact.
