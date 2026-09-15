# Phase 7: Frontend Web Application — Tasks

## 1. Backend Reference Endpoints
- [x] Create `CategoryLookupDto.cs`, `DepartmentLookupDto.cs`, `EmployeeLookupDto.cs` in `BCSMS.Application/Reference/`
- [x] Update `ICategoryRepository.cs`, `IDepartmentRepository.cs`, `IUserRepository.cs`
- [x] Implement lookup methods in `CategoryRepository.cs`, `DepartmentRepository.cs`, `UserRepository.cs`
- [x] Create `ReferenceDataController.cs` (`/api/categories`, `/api/departments`, `/api/departments/{id}/employees`)
- [x] Update test fakes (`FakeCategoryRepository.cs`, `FakeDepartmentRepository.cs`, `FakeUserRepository.cs`)
- [x] Add integration tests in `ReferenceDataEndpointsTests.cs` (4 tests)

## 2. Frontend Project Setup (`frontend/web/`)
- [x] Create `package.json` with React 18, TypeScript, Vite, MUI v5, React Router v6, Axios, TanStack Query v5, Vitest
- [x] Create `tsconfig.json`, `vite.config.ts`, `index.html`, `.env.example`, `.env`
- [x] Run `npm install`

## 3. Core Infrastructure
- [x] Types (`auth.types.ts`, `serviceRequest.types.ts`, `reference.types.ts`)
- [x] Theme (`municipalTheme.ts` with Bursa `#0D47A1` palette)
- [x] Utilities (`errorUtils.ts` for ProblemDetails, `formatters.ts` for dates and coordinates)
- [x] API client (`axios.ts` with sessionStorage Bearer token interceptor and global 401 handler)
- [x] API services (`authApi.ts`, `citizenApi.ts`, `managerApi.ts`, `employeeApi.ts`, `referenceApi.ts`)
- [x] Auth context (`AuthContext.tsx`, `useAuth.ts`, `ProtectedRoute.tsx` with role authorization)

## 4. Shared Components & Layout
- [x] `StatusChip.tsx` (centralized Turkish labels & colors)
- [x] `PriorityChip.tsx` (centralized Turkish labels & colors)
- [x] `LoadingSkeleton.tsx`, `EmptyState.tsx`, `ErrorAlert.tsx`, `PageHeader.tsx`, `ConfirmationDialog.tsx`
- [x] `AppHeader.tsx`, `AppSidebar.tsx` (role-based links, responsive mobile drawer), `MainLayout.tsx`

## 5. Feature Pages
- [x] Auth: `LoginPage.tsx`, `RegisterPage.tsx`
- [x] Citizen: `CitizenDashboardPage.tsx`, `CitizenRequestsPage.tsx`, `CreateRequestPage.tsx`, `CitizenDetailPage.tsx`
- [x] Manager: `ManagerDashboardPage.tsx`, `ManagerRequestsPage.tsx`, `ManagerDetailPage.tsx`, `AssignModal.tsx`, `NoteActionModal.tsx`
- [x] Employee: `EmployeeDashboardPage.tsx`, `EmployeeRequestsPage.tsx`, `EmployeeDetailPage.tsx`, `ResolveModal.tsx`
- [x] Routing & 404: `AppRoutes.tsx`, `NotFoundPage.tsx`
- [x] App Entry: `App.tsx`, `main.tsx`, `index.css`

## 6. Testing & Verification
- [x] Unit/Component tests: `setup.ts`, `errorUtils.test.ts`, `ProtectedRoute.test.tsx`, `PriorityChip.test.tsx`, `StatusChip.test.tsx`, `AssignModal.test.tsx`, `LoginPage.test.tsx`, `RegisterPage.test.tsx` (27/27 passing)
- [x] Backend tests: `dotnet test BCSMS.sln` (76/76 passing)
- [x] Frontend typecheck: `npm run typecheck` (0 errors)
- [x] Frontend build: `npm run build` (successful production bundle)
