# Phase 7 Implementation Plan — Frontend Web Application

## Overview
Phase 7 builds a responsive municipal web application for the **Bursa City Service Management System (BCSMS)** in `frontend/web/` using **React 18 + TypeScript + Vite + Material UI (MUI v5) + React Router v6 + Axios + TanStack Query v5**.

The application provides role-adapted municipal workflows:
- **Citizen**: Submit service requests, list own requests with filters, inspect detailed timelines.
- **Manager**: Municipal overview, comprehensive table filtering (Status, Category, Department, Priority), start review, assign to Department + Employee + Priority, reject, close, and reopen requests.
- **Employee**: View specifically assigned requests, start work (`Assigned` -> `InProgress`), resolve with resolution note (`InProgress` -> `Resolved`).

---

## 1. Backend API Gap Analysis & Minimal Read Endpoints

### Gap Analysis
To avoid hardcoding GUIDs and allow dynamic dropdown selection in forms and filter bars, the UI requires read-only reference lookups:

1. **Active Categories** (`GET /api/categories`):
   - Needed by: Citizen (Create Request form dropdown), Manager (List filter dropdown).
2. **Active Departments** (`GET /api/departments`):
   - Needed by: Manager (Assign dialog Department dropdown, List filter dropdown).
3. **Active Employees by Department** (`GET /api/departments/{departmentId}/employees`):
   - Needed by: Manager (Assign dialog Employee dropdown filtered by selected Department).

### Proposed Minimal Backend Additions
These are lightweight read projections without CRUD operations:
- **`BCSMS.Application`**:
  - `Reference/CategoryLookupDto.cs` (`Guid Id, string Name, string? Description`)
  - `Reference/DepartmentLookupDto.cs` (`Guid Id, string Name`)
  - `Reference/EmployeeLookupDto.cs` (`Guid Id, string FullName, string Email`)
  - `Abstractions/Persistence/ICategoryRepository.cs` -> `Task<IReadOnlyList<CategoryLookupDto>> GetActiveLookupAsync(...)`
  - `Abstractions/Persistence/IDepartmentRepository.cs` -> `Task<IReadOnlyList<DepartmentLookupDto>> GetActiveLookupAsync(...)`
  - `Abstractions/Persistence/IUserRepository.cs` -> `Task<IReadOnlyList<EmployeeLookupDto>> GetActiveEmployeesByDepartmentLookupAsync(Guid departmentId, ...)`
- **`BCSMS.API/Controllers`**:
  - `ReferenceDataController.cs`:
    - `GET /api/categories` (`[Authorize]` or anonymous)
    - `GET /api/departments` (`[Authorize(Roles = "Manager,Admin")]`)
    - `GET /api/departments/{departmentId:guid}/employees` (`[Authorize(Roles = "Manager,Admin")]`)

---

## 2. Proposed Frontend Folder Tree (`frontend/web/`)

```
frontend/web/
├── public/
│   └── favicon.ico
├── src/
│   ├── api/
│   │   ├── axios.ts                   # Axios instance with auth interceptor & 401 handler
│   │   ├── authApi.ts                 # /api/auth/login, /api/auth/register
│   │   ├── citizenApi.ts              # /api/service-requests (create, my list, detail)
│   │   ├── managerApi.ts              # /api/manager/service-requests (list, detail, review, assign, reject, close, reopen)
│   │   ├── employeeApi.ts             # /api/employee/service-requests (list, detail, start, resolve)
│   │   └── referenceApi.ts            # /api/categories, /api/departments, /api/departments/{id}/employees
│   │
│   ├── auth/
│   │   ├── AuthContext.tsx            # Minimal React Context for token, user profile, and login/logout
│   │   ├── ProtectedRoute.tsx         # Route guard enforcing authenticated session & allowed roles
│   │   └── useAuth.ts                 # Custom hook to access AuthContext
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── StatusChip.tsx         # Centralized RequestStatus chip with municipal color scheme
│   │   │   ├── PriorityChip.tsx       # Centralized Priority chip
│   │   │   ├── LoadingSkeleton.tsx    # Table & card skeleton loading state
│   │   │   ├── EmptyState.tsx         # User-friendly empty state with icon & guidance
│   │   │   ├── ErrorAlert.tsx         # ProblemDetails error display
│   │   │   ├── PageHeader.tsx         # Standardized page title, subtitle, and breadcrumb header
│   │   │   └── ConfirmationDialog.tsx # Accessible confirmation modal
│   │   └── layout/
│   │       ├── AppHeader.tsx          # Municipal top navigation, user badge, role tag, and logout
│   │       ├── AppSidebar.tsx         # Role-specific navigation drawer
│   │       └── MainLayout.tsx         # Main responsive layout container
│   │
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx          # /login
│   │   │   └── RegisterPage.tsx       # /register
│   │   │
│   │   ├── citizen/
│   │   │   ├── CitizenDashboardPage.tsx  # /citizen (stats, recent requests, quick create)
│   │   │   ├── CreateRequestPage.tsx     # /citizen/requests/new
│   │   │   ├── CitizenRequestsPage.tsx   # /citizen/requests (my requests list + status filter)
│   │   │   └── CitizenDetailPage.tsx     # /citizen/requests/:id (details, timeline, location)
│   │   │
│   │   ├── manager/
│   │   │   ├── ManagerDashboardPage.tsx  # /manager (metrics overview)
│   │   │   ├── ManagerRequestsPage.tsx   # /manager/requests (filtered data table + search)
│   │   │   ├── ManagerDetailPage.tsx     # /manager/requests/:id (workflow action toolbar & timeline)
│   │   │   └── components/
│   │   │       ├── AssignModal.tsx       # Department + Employee + Priority assignment dialog
│   │   │       └── NoteActionModal.tsx   # Reject / Close / Reopen dialog with note input
│   │   │
│   │   ├── employee/
│   │   │   ├── EmployeeDashboardPage.tsx # /employee (assigned tasks overview)
│   │   │   ├── EmployeeRequestsPage.tsx  # /employee/requests (assigned requests list + filter)
│   │   │   ├── EmployeeDetailPage.tsx    # /employee/requests/:id (detail & action buttons)
│   │   │   └── components/
│   │   │       └── ResolveModal.tsx      # Resolution note dialog
│   │   │
│   │   └── NotFoundPage.tsx           # 404 handler
│   │
│   ├── routes/
│   │   └── AppRoutes.tsx              # React Router configuration with role-based routing
│   │
│   ├── theme/
│   │   └── municipalTheme.ts          # Clean, accessible MUI theme with Bursa municipal palette
│   │
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── serviceRequest.types.ts
│   │   └── reference.types.ts
│   │
│   ├── utils/
│   │   ├── errorUtils.ts              # Converts RFC 7807 ProblemDetails to user-facing messages
│   │   └── formatters.ts              # DateTime and coordinate formatters
│   │
│   ├── App.tsx                        # Providers: QueryClientProvider, ThemeProvider, AuthProvider, Router
│   ├── main.tsx                       # React DOM root entry
│   └── index.css                      # Base resets and typography
│
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.node.json
└── vite.config.ts
```

---

## 3. Routing Structure & Role-Based Redirection

```
/ (Root)
  └── Redirect based on authentication & role:
      - Unauthenticated -> /login
      - Citizen         -> /citizen
      - Manager         -> /manager
      - Employee        -> /employee

/login                (Public, redirects to role dashboard if authenticated)
/register             (Public citizen registration)

/citizen              [ProtectedRoute: Citizen]
  ├── /citizen                         (Citizen Dashboard)
  ├── /citizen/requests                (My Requests List)
  ├── /citizen/requests/new            (Submit New Request)
  └── /citizen/requests/:id            (Request Details & Timeline)

/manager              [ProtectedRoute: Manager]
  ├── /manager                         (Manager Dashboard)
  ├── /manager/requests                (Municipal Service Requests Table)
  └── /manager/requests/:id            (Request Detail & Workflow Actions)

/employee             [ProtectedRoute: Employee]
  ├── /employee                        (Employee Dashboard)
  ├── /employee/requests               (My Assigned Tasks)
  └── /employee/requests/:id           (Assigned Task Detail & Actions)

*                     (404 Page)
```

---

## 4. Authentication & Session Architecture

- **State Container**: Minimal `AuthContext` backed by `localStorage` for `token` and `user` object (`id`, `firstName`, `lastName`, `email`, `role`).
- **Authorization Authority**: Backend response is the strict source of truth for user roles.
- **Session Lifecycle**:
  - `login(credentials)`: Calls `/api/auth/login`, persists JWT and user info, updates state, and navigates to the role-specific landing page.
  - `logout()`: Clears state, removes stored items, invalidates TanStack Query cache, and redirects to `/login`.
  - `Axios Interceptor`: Automatically adds `Authorization: Bearer <token>` to all outgoing requests. On receiving a `401 Unauthorized` response, it automatically calls `logout()`.

---

## 5. UI & Component Design Strategy

### Municipal Design System (MUI v5)
- **Palette**: Professional, institutional municipal palette (Deep Navy Blue primary `#0D47A1`, Warm Amber/Green accents, neutral cool-gray backgrounds `#F8F9FA`).
- **Typography**: Clean, readable sans-serif (Inter / Roboto), clear hierarchy, accessible line heights.
- **Accessibility**: High-contrast ratios, keyboard focus indicators, explicit ARIA labels on modals and icon buttons.

### Centralized Presentation Mappings

#### RequestStatus Chips (`StatusChip.tsx`)
| Status | Label | Color Variant | Icon / Style |
|---|---|---|---|
| `New` | Yeni | `info` / Light Blue | Outlined / Soft Blue |
| `Reviewing` | İnceleniyor | `warning` / Orange | Amber |
| `Assigned` | Atandı | `primary` / Blue | Deep Blue |
| `InProgress` | İşlemde | `secondary` / Purple | Violet |
| `Resolved` | Çözüldü | `success` / Green | Emerald Green |
| `Closed` | Kapatıldı | `default` / Gray | Slate Gray |
| `Rejected` | Reddedildi | `error` / Red | Crimson Red |
| `Cancelled` | İptal Edildi | `default` / Dark Gray | Dark Gray |

#### Priority Chips (`PriorityChip.tsx`)
| Priority | Label | Color |
|---|---|---|
| `Low` | Düşük | `success` (Muted Green) |
| `Medium` | Orta | `warning` (Orange) |
| `High` | Yüksek | `error` (Bright Red) |
| `Critical` | Kritik | `error` (Dark Crimson with bold icon) |

---

## 6. Page-by-Page Specifications

### Citizen Workflow
1. **Dashboard (`/citizen`)**:
   - Welcome banner with citizen's full name.
   - Quick stats card (Total Requests, In Progress, Resolved).
   - "Yeni Başvuru Yap" (New Service Request) primary call to action.
   - Recent requests table/list with status chips.
2. **Create Request (`/citizen/requests/new`)**:
   - Form fields: Title (required), Category (dropdown from `/api/categories`), Description (multiline), Address/Location (Address text, Latitude, Longitude).
   - Instant client validation + submission error handling.
   - On success: navigates to request details with a success snackbar.
3. **My Requests (`/citizen/requests`)**:
   - Filter by status dropdown.
   - Paginated list of service requests with date, category, status, and detail view button.
4. **Request Detail (`/citizen/requests/:id`)**:
   - Status header, description, category, and location card.
   - Status history chronological timeline stepper.

### Manager Workflow
1. **Dashboard (`/manager`)**:
   - High-level municipal request metrics (Total New, In Review, Assigned, Resolved).
   - Quick access to unreviewed New requests.
2. **Requests Table (`/manager/requests`)**:
   - Filter bar: Status, Category, Department, Priority.
   - Material UI responsive Table with pagination (rows per page, page navigation).
   - Columns: Title, Citizen, Category, Status, Priority, Department, Employee, Created At, Action.
3. **Request Detail & Action Toolbar (`/manager/requests/:id`)**:
   - Comprehensive detail card with citizen info and location.
   - Dynamic action toolbar based on state:
     - `New`: **İncelemeye Al** (Start Review), **Reddet** (Reject).
     - `Reviewing`: **Ata** (Open Assign Dialog), **Reddet** (Reject).
     - `Resolved`: **Kapat** (Close with Note), **Yeniden Aç** (Reopen with Note).
     - `Assigned`, `InProgress`, `Closed`, `Rejected`: Read-only.
   - **Assign Dialog (`AssignModal.tsx`)**:
     - Department dropdown (fetches `/api/departments`).
     - Employee dropdown (fetches `/api/departments/{id}/employees` based on selected department).
     - Priority select (`Low`, `Medium`, `High`, `Critical`).
   - Complete `StatusHistory` timeline.

### Employee Workflow
1. **Dashboard (`/employee`)**:
   - Assigned tasks summary (Assigned vs In Progress).
   - Urgent tasks list.
2. **Assigned Requests (`/employee/requests`)**:
   - Filter by status (`Assigned`, `InProgress`, `Resolved`).
   - Table/Card view with location and creation timestamp.
3. **Assigned Request Detail (`/employee/requests/:id`)**:
   - Detail information and citizen description.
   - Workflow buttons:
     - If `Assigned`: **Çalışmayı Başlat** (Start Work -> `InProgress`).
     - If `InProgress`: **Çözüldü Olarak İşaretle** (Open Resolve Dialog -> `Resolved`).
   - **Resolve Dialog (`ResolveModal.tsx`)**:
     - Resolution note text area (explaining the completed maintenance/repair).

---

## 7. TanStack Query Server-State Strategy

- **Queries**:
  - `['citizenRequests', page, status]`
  - `['serviceRequestDetail', id]`
  - `['managerRequests', page, status, categoryId, departmentId, priority]`
  - `['employeeRequests', page, status]`
  - `['categories']` (cached long-term, `staleTime: 5 min`)
  - `['departments']` (cached long-term, `staleTime: 5 min`)
  - `['departmentEmployees', departmentId]` (cached while modal open)
- **Mutations & Invalidation**:
  - `useCreateServiceRequest`: invalidates `['citizenRequests']`.
  - `useStartReview`, `useAssignRequest`, `useRejectRequest`, `useCloseRequest`, `useReopenRequest`: invalidates `['managerRequests']` and `['serviceRequestDetail', id]`.
  - `useStartWork`, `useResolveRequest`: invalidates `['employeeRequests']` and `['serviceRequestDetail', id]`.

---

## 8. Error Handling & RFC 7807 Translation

The utility `src/utils/errorUtils.ts` extracts `detail` or `title` from Axios errors returning RFC 7807 `ProblemDetails`:
```typescript
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const problem = error.response.data;
    if (problem.detail) return problem.detail;
    if (problem.title) return problem.title;
  }
  return "Beklenmeyen bir hata oluştu. Lütfen tekrar deneyiniz.";
}
```
Errors are rendered in MUI `<Alert severity="error">` and temporary snackbars.

---

## 9. Frontend Testing Strategy

- **Build Validation**: Typecheck with `tsc --noEmit` and build bundle with `vite build`.
- **Unit / Component Tests**: Vitest + React Testing Library for:
  - `StatusChip` and `PriorityChip` rendering and colors.
  - `ProtectedRoute` role guard redirection.
  - `errorUtils` ProblemDetails translation.
  - Login/Register form validation.

---

## 10. Implementation Order

1. **Backend Minimal Reference Endpoints**:
   - Add `ReferenceDataController` (`GET /api/categories`, `GET /api/departments`, `GET /api/departments/{id}/employees`).
   - Run backend tests to verify 0 regressions.
2. **Frontend Project Setup**:
   - Scaffold Vite React + TS app in `frontend/web/`.
   - Install dependencies: `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`, `react-router-dom`, `axios`, `@tanstack/react-query`.
3. **Core Infrastructure**:
   - Theme (`municipalTheme.ts`), Axios instance, AuthContext, ProtectedRoute, Types, Utilities.
4. **Shared Components & Layouts**:
   - `AppHeader`, `AppSidebar`, `MainLayout`, `StatusChip`, `PriorityChip`, `LoadingSkeleton`, `EmptyState`, `ErrorAlert`.
5. **Auth Pages**:
   - `LoginPage`, `RegisterPage`.
6. **Citizen Feature Slice**:
   - `CitizenDashboardPage`, `CreateRequestPage`, `CitizenRequestsPage`, `CitizenDetailPage`.
7. **Manager Feature Slice**:
   - `ManagerDashboardPage`, `ManagerRequestsPage`, `ManagerDetailPage`, `AssignModal`, `NoteActionModal`.
8. **Employee Feature Slice**:
   - `EmployeeDashboardPage`, `EmployeeRequestsPage`, `EmployeeDetailPage`, `ResolveModal`.
9. **Verification & Smoke Testing**:
   - Build frontend bundle (`npm run build`).
   - Run end-to-end user flows in browser using live backend and demo accounts.
