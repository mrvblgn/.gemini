# Phase 7: Frontend Web Application — Walkthrough

## Summary of Completed Work

Phase 7 implements the complete responsive web application for the **Bursa City Service Management System (BCSMS)** in `frontend/web/` using **React 18, TypeScript, Vite, Material UI (MUI v5), React Router v6, Axios, and TanStack Query v5**.

The application provides distinct, role-adapted workflows for **Citizen**, **Manager**, and **Employee** roles with responsive navigation, municipal branding, and centralized status tracking.

---

## 1. Backend Reference Data Endpoints Added

To avoid hardcoding GUIDs on the client and support dynamic selection in forms and filter bars, 3 minimal read-only reference endpoints were added:

1. **`GET /api/categories`** (`[Authorize]`): returns active category lookups (`Id`, `Name`, `Description`).
2. **`GET /api/departments`** (`[Authorize(Roles = "Manager,Admin")]`): returns active department lookups (`Id`, `Name`).
3. **`GET /api/departments/{departmentId}/employees`** (`[Authorize(Roles = "Manager,Admin")]`): returns active employees belonging to the specified department (`Id`, `FullName`, `Email`).

Integration tests added in [`ReferenceDataEndpointsTests.cs`](file:///Users/mervebilgin/BursaCityServiceManagement/backend/dotnet/tests/BCSMS.IntegrationTests/Reference/ReferenceDataEndpointsTests.cs) (4 tests).

---

## 2. Frontend Folder Tree (`frontend/web/`)

```
frontend/web/
├── public/
├── src/
│   ├── api/
│   │   ├── axios.ts                   # Axios instance, Bearer token interceptor, 401 handler
│   │   ├── authApi.ts                 # /api/auth/login, /api/auth/register
│   │   ├── citizenApi.ts              # /api/service-requests (create, my requests, detail)
│   │   ├── managerApi.ts              # /api/manager/service-requests (list, detail, review, assign, reject, close, reopen)
│   │   ├── employeeApi.ts             # /api/employee/service-requests (list, detail, start, resolve)
│   │   └── referenceApi.ts            # /api/categories, /api/departments, /api/departments/{id}/employees
│   │
│   ├── auth/
│   │   ├── AuthContext.tsx            # Session in sessionStorage, state management
│   │   ├── ProtectedRoute.tsx         # Route guard enforcing authentication & allowed roles
│   │   └── useAuth.ts                 # Custom hook for auth context
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── StatusChip.tsx         # Centralized Turkish status chip mapping
│   │   │   ├── PriorityChip.tsx       # Centralized Turkish priority chip mapping
│   │   │   ├── LoadingSkeleton.tsx    # Table, card, and detail skeleton loaders
│   │   │   ├── EmptyState.tsx         # User-friendly empty state with icon & action
│   │   │   ├── ErrorAlert.tsx         # ProblemDetails error display
│   │   │   ├── PageHeader.tsx         # Page title, subtitle, and action button container
│   │   │   └── ConfirmationDialog.tsx # Accessible modal for confirmations
│   │   └── layout/
│   │       ├── AppHeader.tsx          # Municipal branding, user badge, role tag, logout
│   │       ├── AppSidebar.tsx         # Role-specific navigation drawer with mobile support
│   │       └── MainLayout.tsx         # Responsive application shell
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx          # /login
│   │   │   └── RegisterPage.tsx       # /register
│   │   ├── citizen/
│   │   │   ├── CitizenDashboardPage.tsx # /citizen
│   │   │   ├── CitizenRequestsPage.tsx  # /citizen/requests
│   │   │   ├── CreateRequestPage.tsx    # /citizen/requests/new
│   │   │   └── CitizenDetailPage.tsx    # /citizen/requests/:id
│   │   ├── manager/
│   │   │   ├── ManagerDashboardPage.tsx # /manager
│   │   │   ├── ManagerRequestsPage.tsx  # /manager/requests
│   │   │   ├── ManagerDetailPage.tsx    # /manager/requests/:id
│   │   │   └── components/
│   │   │       ├── AssignModal.tsx      # Department + Employee + Priority assignment dialog
│   │   │       └── NoteActionModal.tsx  # Reject / Close / Reopen dialog with note
│   │   ├── employee/
│   │   │   ├── EmployeeDashboardPage.tsx # /employee
│   │   │   ├── EmployeeRequestsPage.tsx  # /employee/requests
│   │   │   ├── EmployeeDetailPage.tsx    # /employee/requests/:id
│   │   │   └── components/
│   │   │       └── ResolveModal.tsx     # Resolution note dialog
│   │   └── NotFoundPage.tsx           # 404 handler
│   │
│   ├── routes/
│   │   └── AppRoutes.tsx              # React Router v6 routing definition
│   │
│   ├── theme/
│   │   └── municipalTheme.ts          # MUI theme with Bursa municipal palette (#0D47A1)
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── serviceRequest.types.ts
│   │   └── reference.types.ts
│   │
│   ├── utils/
│   │   ├── errorUtils.ts              # ProblemDetails to Turkish error message parser
│   │   └── formatters.ts              # DateTime and coordinate formatters
│   │
│   ├── test/                          # Unit & Component test suite (27 tests)
│   │   ├── setup.ts
│   │   ├── errorUtils.test.ts
│   │   ├── StatusChip.test.tsx
│   │   ├── PriorityChip.test.tsx
│   │   ├── ProtectedRoute.test.tsx
│   │   ├── LoginPage.test.tsx
│   │   ├── RegisterPage.test.tsx
│   │   └── AssignModal.test.tsx
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 3. Workflow & Role Implementation Details

### Citizen Workflow
- **Dashboard (`/citizen`)**: Welcome greeting, summary metrics, quick actions, recent requests list.
- **Create Request (`/citizen/requests/new`)**: Category selection loaded dynamically via `/api/categories`, address/coordinates input, description. On submission, invalidates `['citizen', 'requests']` and redirects to the created request detail.
- **My Requests (`/citizen/requests`)**: Status filtering, pagination, table with `StatusChip` and `PriorityChip`.
- **Request Detail (`/citizen/requests/:id`)**: Full information, description, category, location, and status history stepper.

### Manager Workflow
- **Dashboard (`/manager`)**: Municipal overview cards, quick link to unreviewed requests.
- **Requests Management (`/manager/requests`)**: Multi-filtering (Status, Category, Department, Priority) using backend filters, table with pagination.
- **Request Detail & Action Toolbar (`/manager/requests/:id`)**:
  - `New`: **İncelemeye Al** (Start Review), **Reddet** (Reject).
  - `Reviewing`: **Görevi Ata** (opens `AssignModal`), **Reddet** (Reject).
  - `Resolved`: **Başvuruyu Kapat** (Close with Note), **Yeniden Aç** (Reopen with Note).
  - `AssignModal`: Fetches `/api/departments`, cascades to `/api/departments/{id}/employees`, submits assignment with selected Priority.

### Employee Workflow
- **Dashboard (`/employee`)**: Assigned tasks overview, quick access to pending work.
- **My Assigned Requests (`/employee/requests`)**: Filterable paginated list of tasks assigned specifically to the authenticated employee.
- **Task Detail & Execution (`/employee/requests/:id`)**:
  - `Assigned`: **Çalışmayı Başlat** (Start Work -> `InProgress`).
  - `InProgress`: **Çözümlendi Olarak İşaretle** (opens `ResolveModal` -> `Resolved`).
  - `ResolveModal`: Text area for resolution work summary.

---

## 4. Centralized Status & Priority Presentation

Centralized in [`StatusChip.tsx`](file:///Users/mervebilgin/BursaCityServiceManagement/frontend/web/src/components/common/StatusChip.tsx) and [`PriorityChip.tsx`](file:///Users/mervebilgin/BursaCityServiceManagement/frontend/web/src/components/common/PriorityChip.tsx):

| Status | Turkish Label | MUI Variant / Color |
|---|---|---|
| `New` | Yeni | Outlined / `info` |
| `Reviewing` | İnceleniyor | Filled / `warning` |
| `Assigned` | Atandı | Filled / `primary` |
| `InProgress` | İşlemde | Filled / `secondary` |
| `Resolved` | Çözüldü | Filled / `success` |
| `Closed` | Kapatıldı | Filled / `default` (Gray) |
| `Rejected` | Reddedildi | Filled / `error` |
| `Cancelled` | İptal Edildi | Outlined / `default` |

---

## 5. Verification & Test Results

### Backend Verification
```bash
dotnet restore BCSMS.sln
dotnet build BCSMS.sln
dotnet test BCSMS.sln
```
- **0 Errors, 0 Warnings**
- **76 Tests Passed (100%)**:
  - `BCSMS.UnitTests`: 48 tests
  - `BCSMS.IntegrationTests`: 28 tests

### Frontend Verification
```bash
npm run typecheck
npm run test -- --run
npm run build
```
- **TypeScript Typecheck**: Passed (0 errors)
- **Vitest Unit & Component Tests**: **27 / 27 Passed (100%)**
  - `errorUtils.test.ts`: 4 tests
  - `ProtectedRoute.test.tsx`: 3 tests
  - `PriorityChip.test.tsx`: 5 tests
  - `StatusChip.test.tsx`: 8 tests
  - `AssignModal.test.tsx`: 1 test
  - `LoginPage.test.tsx`: 3 tests
  - `RegisterPage.test.tsx`: 3 tests
- **Vite Production Build**: Succeeded (`dist/` bundle created cleanly)
