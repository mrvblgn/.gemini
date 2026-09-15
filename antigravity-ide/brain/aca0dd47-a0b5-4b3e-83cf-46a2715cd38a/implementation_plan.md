# Java / Spring Boot Implementation Plan for BCSMS Backend

This plan outlines the architecture, package design, entity mapping, security, persistence, testing, and Spring/JPA nuances for an alternative **Java 21 / Spring Boot 3** backend implementation for the Bursa City Service Management System (BCSMS), located at `backend/java/bcsms-api/`.

> [!IMPORTANT]
> - **Existing Code Preservation**: No modifications will be made to `backend/dotnet/` or `frontend/`.
> - **Primary Implementation**: The ASP.NET Core backend remains the primary implementation. This Java backend serves as a clean alternative MVP demonstrating Spring Boot adaptability.
> - **No Code Written Yet**: This artifact is strictly an architectural design document for review.

---

## 1. Java Package & Directory Structure

The project will follow a single-module clean layout under `backend/java/bcsms-api/` using Maven.

```
backend/java/bcsms-api/
├── pom.xml
└── src/
    ├── main/
    │   ├── java/
    │   │   └── com/bursa/bcsms/
    │   │       ├── BcsmsApplication.java
    │   │       ├── common/
    │   │       │   ├── exception/
    │   │       │   │   ├── DomainException.java
    │   │       │   │   ├── EntityNotFoundException.java
    │   │       │   │   ├── UnauthorizedAccessException.java
    │   │       │   │   └── GlobalExceptionHandler.java
    │   │       │   └── model/
    │   │       │       └── PagedResult.java
    │   │       ├── config/
    │   │       │   ├── OpenApiConfig.java
    │   │       │   └── SecurityConfig.java
    │   │       ├── domain/
    │   │       │   ├── entity/
    │   │       │   │   ├── User.java
    │   │       │   │   ├── Department.java
    │   │       │   │   ├── Category.java
    │   │       │   │   ├── ServiceRequest.java
    │   │       │   │   ├── StatusHistoryEntry.java
    │   │       │   │   ├── Comment.java
    │   │       │   │   └── Attachment.java
    │   │       │   ├── enums/
    │   │       │   │   ├── UserRole.java
    │   │       │   │   ├── RequestStatus.java
    │   │       │   │   └── Priority.java
    │   │       │   └── valueobject/
    │   │       │       └── Location.java
    │   │       ├── dto/
    │   │       │   ├── request/
    │   │       │   │   ├── RegisterRequest.java
    │   │       │   │   ├── LoginRequest.java
    │   │       │   │   ├── CreateServiceRequestApiRequest.java
    │   │       │   │   ├── AssignRequestApiRequest.java
    │   │       │   │   └── ResolveRequestApiRequest.java
    │   │       │   └── response/
    │   │       │       ├── AuthResponse.java
    │   │       │       ├── ServiceRequestSummaryDto.java
    │   │       │       ├── ServiceRequestDetailDto.java
    │   │       │       ├── StatusHistoryDto.java
    │   │       │       ├── CommentDto.java
    │   │       │       └── AttachmentDto.java
    │   │       ├── repository/
    │   │       │   ├── UserRepository.java
    │   │       │   ├── DepartmentRepository.java
    │   │       │   ├── CategoryRepository.java
    │   │       │   └── ServiceRequestRepository.java
    │   │       ├── security/
    │   │       │   ├── JwtTokenProvider.java
    │   │       │   ├── JwtAuthenticationFilter.java
    │   │       │   ├── UserPrincipal.java
    │   │       │   └── CustomUserDetailsService.java
    │   │       ├── controller/
    │   │       │   ├── AuthController.java
    │   │       │   ├── ServiceRequestController.java
    │   │       │   ├── ManagerServiceRequestController.java
    │   │       │   └── EmployeeServiceRequestController.java
    │   │       └── service/
    │   │           ├── AuthService.java
    │   │           ├── ServiceRequestService.java
    │   │           ├── ManagerServiceRequestService.java
    │   │           └── EmployeeServiceRequestService.java
    │   └── resources/
    │       ├── application.yml
    │       └── application-dev.yml
    └── test/
        └── java/
            └── com/bursa/bcsms/
                ├── domain/
                │   ├── ServiceRequestTest.java
                │   └── UserTest.java
                ├── service/
                │   ├── AuthServiceTest.java
                │   └── ServiceRequestServiceTest.java
                └── controller/
                    ├── AuthControllerTest.java
                    └── ServiceRequestControllerTest.java
```

---

## 2. Entity & Relationship Mapping

Entities mirror the existing .NET Domain Aggregate Roots and Entities.

### Domain Enums
- **`UserRole`**: `CITIZEN`, `EMPLOYEE`, `MANAGER`, `ADMIN`
- **`RequestStatus`**: `NEW`, `REVIEWING`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `REJECTED`, `CANCELLED`
- **`Priority`**: `LOW`, `MEDIUM`, `HIGH`, `URGENT`

### Entities & JPA Mappings
1. **`User`** (`@Entity`, table: `users`)
   - `id`: `UUID` (`@Id`, `@GeneratedValue(strategy = GenerationType.UUID)`)
   - `firstName`: `String`
   - `lastName`: `String`
   - `email`: `String` (Unique constraint)
   - `phone`: `String`
   - `passwordHash`: `String`
   - `role`: `UserRole` (`@Enumerated(EnumType.STRING)`)
   - `departmentId`: `UUID` (Nullable, required if Employee/Manager)
   - `isActive`: `boolean`
   - `createdAt`: `Instant`
   - `updatedAt`: `Instant`
2. **`Department`** (`@Entity`, table: `departments`)
   - `id`: `UUID`
   - `name`: `String` (Unique)
   - `code`: `String` (Unique)
   - `description`: `String`
   - `createdAt`: `Instant`
3. **`Category`** (`@Entity`, table: `categories`)
   - `id`: `UUID`
   - `name`: `String` (Unique)
   - `description`: `String`
   - `isActive`: `boolean`
   - `createdAt`: `Instant`
4. **`Location`** (`@Embeddable`)
   - `latitude`: `Double`
   - `longitude`: `Double`
   - `addressText`: `String`
5. **`ServiceRequest`** (`@Entity`, table: `service_requests`) - Aggregate Root
   - `id`: `UUID`
   - `title`: `String`
   - `description`: `String`
   - `categoryId`: `UUID`
   - `citizenId`: `UUID` (Immutable, set on creation)
   - `status`: `RequestStatus` (`@Enumerated(EnumType.STRING)`)
   - `priority`: `Priority` (`@Enumerated(EnumType.STRING)`, Nullable)
   - `assignedDepartmentId`: `UUID` (Nullable)
   - `assignedEmployeeId`: `UUID` (Nullable)
   - `location`: `@Embedded Location`
   - `createdAt`: `Instant`
   - `updatedAt`: `Instant`
   - `statusHistory`: `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` `List<StatusHistoryEntry>`
   - `comments`: `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` `List<Comment>`
   - `attachments`: `@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)` `List<Attachment>`

### Domain State Transitions (Encapsulated In ServiceRequest)
Domain methods enforce invariant checks and valid lifecycle transitions:
- `startReview(changedByUserId, now)`: `NEW -> REVIEWING`
- `assign(departmentId, employeeId, priority, changedByUserId, now)`: `REVIEWING -> ASSIGNED`
- `startProgress(changedByUserId, now)`: `ASSIGNED -> IN_PROGRESS`
- `resolve(changedByUserId, now, note)`: `IN_PROGRESS -> RESOLVED`
- `close(changedByUserId, now, note)`: `RESOLVED -> CLOSED`
- `reopen(changedByUserId, now, note)`: `RESOLVED -> IN_PROGRESS`
- `reject(changedByUserId, now, note)`: `NEW/REVIEWING -> REJECTED`
- `cancel(changedByUserId, now)`: `NEW/REVIEWING/ASSIGNED -> CANCELLED`

---

## 3. Endpoint List

All endpoints match the contract established by the .NET backend API.

| HTTP Method | Path | Required Role | Summary & Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | `PermitAll` | Public citizen registration (forces `UserRole.CITIZEN`). Returns token + user DTO. |
| **POST** | `/api/auth/login` | `PermitAll` | Authenticates email & password. Returns signed JWT token. |
| **POST** | `/api/service-requests` | `CITIZEN` | Creates a new request. `citizenId` extracted from JWT principal. |
| **GET** | `/api/service-requests/my` | `CITIZEN` | Returns paginated list of requests created by the authenticated citizen. |
| **GET** | `/api/service-requests/{id}` | `CITIZEN / MANAGER / EMPLOYEE` | Gets detailed view of request by ID. Validates ownership or staff access. |
| **POST** | `/api/manager/service-requests/{id}/review` | `MANAGER` | Transitions request state `NEW -> REVIEWING`. `managerId` from JWT. |
| **POST** | `/api/manager/service-requests/{id}/assign` | `MANAGER` | Assigns department, employee, and priority (`REVIEWING -> ASSIGNED`). |
| **GET** | `/api/employee/service-requests` | `EMPLOYEE` | Returns paginated requests assigned to authenticated employee. |
| **POST** | `/api/employee/service-requests/{id}/start` | `EMPLOYEE` | Begins work on assigned request (`ASSIGNED -> IN_PROGRESS`). |
| **POST** | `/api/employee/service-requests/{id}/resolve` | `EMPLOYEE` | Resolves in-progress request with optional note (`IN_PROGRESS -> RESOLVED`). |

---

## 4. JWT & Spring Security Design

### Architecture
- **Stateless Session**: Configured via `SecurityFilterChain` with `SessionCreationPolicy.STATELESS`.
- **Password Hashing**: `BCryptPasswordEncoder` bean for hashing and verification.
- **Token Utility (`JwtTokenProvider`)**: Uses `io.jsonwebtoken` (JJWT 0.12.x) to generate and parse HMAC-SHA256 signed tokens containing:
  - `sub`: User ID (`UUID.toString()`)
  - `email`: User email
  - `role`: User role name (`CITIZEN`, `EMPLOYEE`, `MANAGER`, `ADMIN`)
  - `iat` / `exp`: Issued-at and expiration timestamps.
- **Filter (`JwtAuthenticationFilter`)**: Intercepts requests, reads `Authorization: Bearer <token>`, validates token, loads `UserPrincipal`, and populates `SecurityContextHolder.getContext().setAuthentication(...)`.
- **Identity Extraction**: Controllers inject `@AuthenticationPrincipal UserPrincipal principal` to access `principal.getId()` safely without client body parameter manipulation.

### Spring Security Authorization Rules
```java
http
    .csrf(AbstractHttpConfigurer::disable)
    .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
        .requestMatchers("/api/service-requests/**").hasRole("CITIZEN")
        .requestMatchers("/api/manager/**").hasRole("MANAGER")
        .requestMatchers("/api/employee/**").hasRole("EMPLOYEE")
        .anyRequest().authenticated()
    )
    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
```

---

## 5. Persistence Design

- **Database Engine**: PostgreSQL.
- **Driver & Framework**: `org.postgresql:postgresql` with Spring Data JPA & Hibernate ORM.
- **Configuration (`application.yml`)**:
  ```yaml
  spring:
    datasource:
      url: ${DB_URL:jdbc:postgresql://localhost:5432/bcsms}
      username: ${DB_USER:bcsms_user}
      password: ${DB_PASSWORD:bcsms_pass}
    jpa:
      hibernate:
        ddl-auto: validate # or update in dev
      properties:
        hibernate:
          dialect: org.hibernate.dialect.PostgreSQLDialect
  ```
- **Spring Data Repositories**:
  - `UserRepository extends JpaRepository<User, UUID>` (with `findByEmail(String email)`, `existsByEmail(String email)`)
  - `DepartmentRepository extends JpaRepository<Department, UUID>`
  - `CategoryRepository extends JpaRepository<Category, UUID>`
  - `ServiceRequestRepository extends JpaRepository<ServiceRequest, UUID>` (with custom query methods for pagination by citizen/employee/department/status).
- **Transaction Management**: Method-level `@Transactional` on Spring `@Service` classes ensuring atomic aggregate updates.

---

## 6. Tests to Implement

### Unit Tests (JUnit 5 + Mockito + AssertJ)
1. **`ServiceRequestTest`**:
   - Verify `NEW -> REVIEWING -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED` state flow.
   - Verify invalid state transitions throw `DomainException` (e.g. attempting to resolve a `NEW` request).
   - Verify `REJECTED` state can only be set from `NEW` or `REVIEWING`.
   - Verify `CANCELLED` state can only be set from `NEW`, `REVIEWING`, or `ASSIGNED`.
   - Verify terminal states prevent further updates.
2. **`UserTest`**:
   - Verify department requirement logic for `EMPLOYEE`/`MANAGER` vs `CITIZEN`/`ADMIN`.
3. **`AuthServiceTest`**:
   - Test registration succeeds for new email, throws conflict exception for existing email.
   - Test login returns valid JWT token for valid credentials, throws unauthorized exception for invalid password.
4. **`ServiceRequestServiceTest`**:
   - Test citizen request creation.
   - Test manager assignment logic.
   - Test employee work start and resolution logic.

### Integration / Web Layer Tests (JUnit 5 + MockMvc / SpringBootTest)
1. **`AuthControllerTest`**: End-to-end endpoint tests for `/api/auth/register` and `/api/auth/login`.
2. **`ServiceRequestControllerTest`**: Endpoint tests for `/api/service-requests` with mock security contexts (testing 201 Created, 401 Unauthorized, 403 Forbidden).

---

## 7. Features Intentionally Omitted from Java Version

To keep the Java implementation strictly focused as an alternative MVP clean architecture proof-of-concept:
1. **Comment & Attachment Endpoints**: Omitted from controller/service layer (entities remain mapped in model for domain completeness).
2. **Admin User Management**: Admin CRUD endpoints for user lifecycle management.
3. **Reference Data CRUD**: Admin endpoints to create/modify departments and categories.
4. **CQRS / MediatR Pipelines**: Avoided in favor of direct, clean Spring Service layer calls.
5. **Caching / Messaging**: Redis and Kafka omitted per project constraints.

---

## 8. Key Spring/JPA vs. .NET Differences

| Domain Aspect | ASP.NET Core / EF Core (.NET) | Spring Boot 3 / JPA (Java 21) |
| :--- | :--- | :--- |
| **ORM Backing Fields** | Uses C# backing fields (`_statusHistory.AsReadOnly()`) directly with EF Core | JPA requires standard getters & zero-argument default constructors (`protected` visibility for JPA). List encapsulated via domain behavior. |
| **Value Objects** | EF Core `Owned Navigation Types` (`builder.OwnsOne(x => x.Location)`) | JPA `@Embeddable` and `@Embedded` annotations. |
| **Repositories** | Direct `DbContext` or custom repository patterns | Spring Data JPA interfaces (`JpaRepository<ServiceRequest, UUID>`) with derived query methods. |
| **Security Context** | `HttpContext.User` (`ClaimsPrincipal`) | `SecurityContextHolder.getContext().getAuthentication().getPrincipal()` (`UserPrincipal`). |
| **Validation** | FluentValidation library | Jakarta Bean Validation (`@NotBlank`, `@NotNull`, `@Valid`) on DTOs. |
| **Exception Handling** | Custom `ProblemDetails` Middleware | Spring `@RestControllerAdvice` handling `DomainException` (400/422), `EntityNotFoundException` (404), and `AccessDeniedException` (403). |

---

## User Review Required

> [!NOTE]
> The target structure for the future implementation will be in `backend/java/bcsms-api/`.
> Please review this technical design and confirm if you approve proceeding with the code implementation phase in a future step.
