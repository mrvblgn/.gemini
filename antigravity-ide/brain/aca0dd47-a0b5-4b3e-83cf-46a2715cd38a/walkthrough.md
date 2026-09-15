# Java / Spring Boot Backend Implementation Walkthrough

The alternative **Java 21 / Spring Boot 3** backend implementation for the Bursa City Service Management System (BCSMS) is complete. It is located at `backend/java/bcsms-api/` and operates independently without modifying the existing .NET backend or React frontend.

---

## 1. Files Created

```
backend/java/bcsms-api/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/com/bursa/bcsms/
    │   │   ├── BcsmsApplication.java
    │   │   ├── common/
    │   │   │   ├── exception/
    │   │   │   │   ├── DomainException.java
    │   │   │   │   ├── EntityNotFoundException.java
    │   │   │   │   ├── UnauthorizedAccessException.java
    │   │   │   │   └── GlobalExceptionHandler.java
    │   │   │   └── model/
    │   │   │       └── PagedResult.java
    │   │   ├── config/
    │   │   │   ├── OpenApiConfig.java
    │   │   │   └── SecurityConfig.java
    │   │   ├── controller/
    │   │   │   ├── AuthController.java
    │   │   │   ├── ServiceRequestController.java
    │   │   │   ├── ManagerServiceRequestController.java
    │   │   │   └── EmployeeServiceRequestController.java
    │   │   ├── domain/
    │   │   │   ├── entity/
    │   │   │   │   ├── User.java
    │   │   │   │   ├── Department.java
    │   │   │   │   ├── Category.java
    │   │   │   │   ├── ServiceRequest.java
    │   │   │   │   ├── StatusHistoryEntry.java
    │   │   │   │   ├── Comment.java
    │   │   │   │   └── Attachment.java
    │   │   │   ├── enums/
    │   │   │   │   ├── UserRole.java
    │   │   │   │   ├── RequestStatus.java
    │   │   │   │   └── Priority.java
    │   │   │   └── valueobject/
    │   │   │       └── Location.java
    │   │   ├── dto/
    │   │   │   ├── request/
    │   │   │   │   ├── RegisterRequest.java
    │   │   │   │   ├── LoginRequest.java
    │   │   │   │   ├── CreateServiceRequestApiRequest.java
    │   │   │   │   ├── AssignRequestApiRequest.java
    │   │   │   │   ├── ResolveRequestApiRequest.java
    │   │   │   │   └── WorkflowNoteApiRequest.java
    │   │   │   └── response/
    │   │   │       ├── AuthResponse.java
    │   │   │       ├── UserSummaryDto.java
    │   │   │       ├── ServiceRequestSummaryDto.java
    │   │   │       ├── ServiceRequestDetailDto.java
    │   │   │       ├── StatusHistoryDto.java
    │   │   │       ├── CommentDto.java
    │   │   │       └── AttachmentDto.java
    │   │   ├── repository/
    │   │   │   ├── UserRepository.java
    │   │   │   ├── DepartmentRepository.java
    │   │   │   ├── CategoryRepository.java
    │   │   │   └── ServiceRequestRepository.java
    │   │   ├── security/
    │   │   │   ├── UserPrincipal.java
    │   │   │   ├── CustomUserDetailsService.java
    │   │   │   ├── JwtTokenProvider.java
    │   │   │   └── JwtAuthenticationFilter.java
    │   │   └── service/
    │   │       ├── AuthService.java
    │   │       ├── ServiceRequestService.java
    │   │       ├── ManagerServiceRequestService.java
    │   │       └── EmployeeServiceRequestService.java
    │   └── resources/
    │       ├── application.yml
    │       └── db/migration/
    │           └── V1__initial_schema.sql
    └── test/
        ├── java/com/bursa/bcsms/
        │   ├── domain/
        │   │   ├── ServiceRequestTest.java
        │   │   └── UserTest.java
        │   ├── service/
        │   │   ├── AuthServiceTest.java
        │   │   ├── ServiceRequestServiceTest.java
        │   │   ├── ManagerServiceRequestServiceTest.java
        │   │   └── EmployeeServiceRequestServiceTest.java
        │   └── controller/
        │       └── AuthControllerTest.java
        └── resources/
            └── application-test.yml
```

---

## 2. Architecture & Domain Model

- **Layered Monolith**: Thin Spring Controllers -> Business & Security Services -> Rich Aggregate Roots (`ServiceRequest`) -> Spring Data JPA Repositories.
- **Domain State Machine**: Encapsulated behavior methods inside `ServiceRequest`:
  - `startReview(managerId, utcNow)`: `NEW -> REVIEWING`
  - `assign(departmentId, employeeId, priority, managerId, utcNow)`: `REVIEWING -> ASSIGNED`
  - `startProgress(employeeId, utcNow)`: `ASSIGNED -> IN_PROGRESS`
  - `resolve(employeeId, utcNow, note)`: `IN_PROGRESS -> RESOLVED`
  - `close(managerId, utcNow, note)`: `RESOLVED -> CLOSED`
  - `reopen(managerId, utcNow, note)`: `RESOLVED -> IN_PROGRESS`
  - `reject(managerId, utcNow, note)`: `NEW / REVIEWING -> REJECTED`
  - `cancel(userId, utcNow)`: `NEW / REVIEWING / ASSIGNED -> CANCELLED`
- **Centralized Exception Handling**: `GlobalExceptionHandler` converts domain/security/validation exceptions into RFC 7807 `ProblemDetail` JSON outputs.

---

## 3. Implemented Endpoints

### Auth
- `POST /api/auth/register`: Public registration (always creates `UserRole.CITIZEN`).
- `POST /api/auth/login`: Authenticates credentials and returns a signed JWT token.

### Citizen
- `POST /api/service-requests`: Submits a new municipal request (`citizenId` derived from JWT principal).
- `GET /api/service-requests/my`: Paginated list of requests submitted by the authenticated citizen.
- `GET /api/service-requests/{id}`: Request details. Accessible by owning Citizen, assigned Employee/Department staff, and Managers.

### Manager
- `GET /api/manager/service-requests`: Paginated list of municipal requests with status, category, department, and priority filters.
- `POST /api/manager/service-requests/{id}/review`: Starts review (`NEW -> REVIEWING`). `managerId` derived from JWT principal.
- `POST /api/manager/service-requests/{id}/assign`: Assigns department, employee, and priority (`REVIEWING -> ASSIGNED`). `managerId` derived from JWT principal.

### Employee
- `GET /api/employee/service-requests`: Paginated list of requests assigned to the authenticated employee.
- `POST /api/employee/service-requests/{id}/start`: Begins work on assigned request (`ASSIGNED -> IN_PROGRESS`). `employeeId` derived from JWT principal.
- `POST /api/employee/service-requests/{id}/resolve`: Resolves in-progress request (`IN_PROGRESS -> RESOLVED`). `employeeId` derived from JWT principal.

---

## 4. Security & JWT Design

- **Stateless Authentication**: `SessionCreationPolicy.STATELESS`.
- **JWT Provider**: JJWT 0.12.6 generating HMAC-SHA256 tokens containing user ID, email, role, and department.
- **Filter**: `JwtAuthenticationFilter` validates token on incoming requests and sets `SecurityContextHolder`.
- **Identity Security Rule**: `CitizenId`, `ManagerId`, and `EmployeeId` are NEVER accepted from client request bodies. Controllers obtain identity via `@AuthenticationPrincipal UserPrincipal currentUser`.
- **Role & Authorization Checks**:
  - `/api/manager/**` requires `ROLE_MANAGER`.
  - `/api/employee/**` requires `ROLE_EMPLOYEE`.
  - Service methods perform explicit ownership & department assignment checks.

---

## 5. Database & Flyway Migration Design

- **Database Engine**: PostgreSQL.
- **Migration Tool**: Flyway versioned migration (`V1__initial_schema.sql`).
- **Hibernate Configuration**:
  ```yaml
  jpa:
    hibernate:
      ddl-auto: validate
  ```
- **Enum Persistence**: All enums (`UserRole`, `RequestStatus`, `Priority`) are stored as `VARCHAR` strings (`EnumType.STRING`), not ordinals.

---

## 6. Test Execution & Results

22 automated unit and integration tests were executed covering domain state machine rules, user role validation, service logic, security checks, and Spring MockMvc controller endpoints.

```bash
[INFO] Running com.bursa.bcsms.controller.AuthControllerTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.bursa.bcsms.service.EmployeeServiceRequestServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.bursa.bcsms.service.ManagerServiceRequestServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.bursa.bcsms.service.AuthServiceTest
[INFO] Tests run: 2, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.bursa.bcsms.service.ServiceRequestServiceTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.bursa.bcsms.domain.ServiceRequestTest
[INFO] Tests run: 8, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running com.bursa.bcsms.domain.UserTest
[INFO] Tests run: 3, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] Results:
[INFO] Tests run: 22, Failures: 0, Errors: 0, Skipped: 0
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
```

---

## 7. Features Intentionally Omitted from Java Version

- Comment & Attachment CRUD endpoints (entities mapped, but endpoints omitted from MVP).
- Admin user management and reference data CRUD endpoints.
- CQRS, Redis caching, Kafka messaging.

---

## 8. Commands to Run Java Backend Locally

### Run Tests:
```bash
cd backend/java/bcsms-api
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
export PATH="$JAVA_HOME/bin:$PATH"
mvn test
```

### Build Executable Package JAR:
```bash
mvn package
```

### Run Spring Boot Application:
Ensure PostgreSQL is running locally on port 5432 with database `bcsms`, user `bcsms_user`, and password `bcsms_pass` (or supply environment variables):

```bash
export DB_URL=jdbc:postgresql://localhost:5432/bcsms
export DB_USER=bcsms_user
export DB_PASSWORD=bcsms_pass
java -jar target/bcsms-api-1.0.0-SNAPSHOT.jar
```

Swagger UI documentation will be available at `http://localhost:8080/swagger-ui.html`.
