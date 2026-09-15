# Phase 2: Revised Domain Implementation Plan

## Revision Summary

Changes from the original plan based on architectural feedback:

| # | Change | Rationale |
|---|--------|-----------|
| 1 | **RequestCategory enum → Category entity** | Municipalities must add/modify categories without recompilation |
| 2 | **BaseEntity is minimal** — Id only | No global timestamps, soft-delete, or audit fields baked into a base class |
| 3 | **User uses role-based composition** | No inheritance — single User entity with UserRole enum |
| 4 | **Child entities (StatusHistoryEntry, Comment, Attachment) stay inside ServiceRequest aggregate** | No separate repositories or services for them |
| 5 | **Attachment is metadata-only** | No IFormFile, Stream, or storage-provider types in Domain |
| 6 | **No WorkOrder or Assignment entities in MVP** | AssignedDepartmentId and AssignedEmployeeId on ServiceRequest are sufficient |
| 7 | **ServiceRequest is not anemic** | Rich behavior methods with state machine guards |
| 8 | **Status changes auto-create StatusHistoryEntry** | Enforced atomically inside transition methods |

---

## Proposed Directory Structure

```
BCSMS.Domain/
├── Common/
│   ├── BaseEntity.cs                ← Id only
│   └── DomainException.cs           ← domain-specific exception
│
├── Enums/
│   ├── RequestStatus.cs
│   ├── Priority.cs
│   └── UserRole.cs
│
├── ValueObjects/
│   ├── Location.cs
│   ├── FullName.cs
│   └── ContactInfo.cs
│
└── Entities/
    ├── Category.cs                  ← NEW: data-driven, aggregate root
    ├── ServiceRequest.cs            ← aggregate root (rich behavior)
    ├── StatusHistoryEntry.cs        ← child of ServiceRequest
    ├── Comment.cs                   ← child of ServiceRequest
    ├── Attachment.cs                ← child of ServiceRequest
    ├── User.cs                      ← aggregate root
    └── Department.cs                ← aggregate root
```

**15 files** total (was 16 — removed RequestCategory enum, added Category entity).

---

## Proposed Types: Properties & Methods

---

### `Common/BaseEntity.cs`

Minimal abstract base — identity only.

```
abstract class BaseEntity
  Properties:
    Guid Id                          { get; private set; }

  Constructors:
    protected BaseEntity()           — for EF Core
    protected BaseEntity(Guid id)    — validates non-empty
```

> [!IMPORTANT]
> No `CreatedAt`, `UpdatedAt`, or `IsActive` in the base class. Each entity defines only the timestamps and flags it actually needs. This avoids forcing audit concerns onto entities that don't need them.

---

### `Common/DomainException.cs`

```
class DomainException : Exception
  Constructors:
    DomainException(string message)
    DomainException(string message, Exception innerException)
```

---

### `Enums/RequestStatus.cs`

```
enum RequestStatus
  New = 0
  Reviewing = 1
  Assigned = 2
  InProgress = 3
  Resolved = 4
  Closed = 5
  Rejected = 6
  Cancelled = 7
```

---

### `Enums/Priority.cs`

```
enum Priority
  Low = 0
  Medium = 1
  High = 2
  Critical = 3
```

---

### `Enums/UserRole.cs`

```
enum UserRole
  Citizen = 0
  Employee = 1
  Manager = 2
  Admin = 3
```

---

### `ValueObjects/Location.cs`

```
record Location
  Properties:
    double Latitude                  { get; }
    double Longitude                 { get; }
    string? AddressText              { get; }

  Constructor:
    Location(double latitude, double longitude, string? addressText)
    — validates: latitude ∈ [-90, 90], longitude ∈ [-180, 180]
```

---

### `ValueObjects/FullName.cs`

```
record FullName
  Properties:
    string FirstName                 { get; }
    string LastName                  { get; }

  Constructor:
    FullName(string firstName, string lastName)
    — validates: both non-empty, trims whitespace

  Methods:
    override string ToString()       → "FirstName LastName"
```

---

### `ValueObjects/ContactInfo.cs`

```
record ContactInfo
  Properties:
    string Email                     { get; }
    string PhoneNumber               { get; }

  Constructor:
    ContactInfo(string email, string phoneNumber)
    — validates: email non-empty, normalizes to lowercase
    — phoneNumber optional (defaults to empty)
```

---

### `Entities/Category.cs` — Aggregate Root (NEW)

Data-driven service request category. Replaces the former RequestCategory enum.

```
class Category : BaseEntity
  Properties:
    string Name                      { get; private set; }     — e.g. "Road Damage"
    string? Description              { get; private set; }
    bool IsActive                    { get; private set; }
    DateTime CreatedAt               { get; private set; }
    DateTime? UpdatedAt              { get; private set; }

  Constructors:
    private Category()               — for EF Core
    Category(Guid id, string name, string? description)

  Methods:
    void Update(string name, string? description)
    void Activate()
    void Deactivate()

  Invariants:
    — Name is required and non-empty
```

> [!NOTE]
> Category is its own aggregate root because it has an independent lifecycle (created/deactivated by admins), and ServiceRequest references it by ID. Category uniqueness (no duplicate names) is enforced at the Application/Infrastructure layer since it requires a database query.

---

### `Entities/Department.cs` — Aggregate Root

```
class Department : BaseEntity
  Properties:
    string Name                      { get; private set; }
    string? Description              { get; private set; }
    bool IsActive                    { get; private set; }
    DateTime CreatedAt               { get; private set; }
    DateTime? UpdatedAt              { get; private set; }

  Constructors:
    private Department()             — for EF Core
    Department(Guid id, string name, string? description)

  Methods:
    void Update(string name, string? description)
    void Activate()
    void Deactivate()

  Invariants:
    — Name is required and non-empty
```

---

### `Entities/User.cs` — Aggregate Root

Single entity with role-based composition — no subclasses.

```
class User : BaseEntity
  Properties:
    FullName Name                    { get; private set; }
    ContactInfo Contact              { get; private set; }
    UserRole Role                    { get; private set; }
    Guid? DepartmentId               { get; private set; }     — required for Employee/Manager
    bool IsActive                    { get; private set; }
    DateTime CreatedAt               { get; private set; }
    DateTime? UpdatedAt              { get; private set; }

  Constructors:
    private User()                   — for EF Core
    User(Guid id, FullName name, ContactInfo contact, UserRole role, Guid? departmentId)

  Methods:
    void UpdateProfile(FullName name, ContactInfo contact)
    void ChangeRole(UserRole newRole, Guid? departmentId)
    void Activate()
    void Deactivate()

  Invariants:
    — Name and Contact are required
    — Employee/Manager → DepartmentId required
    — Citizen/Admin → DepartmentId must be null
```

---

### `Entities/ServiceRequest.cs` — Aggregate Root (Rich Behavior)

The central entity with encapsulated state machine and child management.

```
class ServiceRequest : BaseEntity
  Properties:
    string Title                     { get; private set; }
    string? Description              { get; private set; }
    Guid CategoryId                  { get; private set; }     — references Category entity by ID
    RequestStatus Status             { get; private set; }
    Priority? Priority               { get; private set; }
    Location? Location               { get; private set; }
    Guid CitizenId                   { get; private set; }     — immutable after creation
    Guid? AssignedDepartmentId       { get; private set; }
    Guid? AssignedEmployeeId         { get; private set; }
    DateTime CreatedAt               { get; private set; }
    DateTime? UpdatedAt              { get; private set; }

  Encapsulated Collections:
    private List<StatusHistoryEntry> _statusHistory
    private List<Comment>            _comments
    private List<Attachment>         _attachments

  Read-Only Accessors:
    IReadOnlyList<StatusHistoryEntry> StatusHistory
    IReadOnlyList<Comment>            Comments
    IReadOnlyList<Attachment>         Attachments

  Constructors:
    private ServiceRequest()         — for EF Core
    ServiceRequest(Guid id, string title, Guid categoryId, Guid citizenId,
                   string? description, Location? location)
    — Status starts as New
    — Validates title non-empty, citizenId non-empty, categoryId non-empty

  State Machine Methods:
    void StartReview(Guid changedByUserId)
        New → Reviewing

    void Assign(Guid departmentId, Guid? employeeId, Priority priority, Guid changedByUserId)
        Reviewing → Assigned
        — departmentId required, priority required

    void StartProgress(Guid changedByUserId)
        Assigned → InProgress

    void Resolve(Guid changedByUserId, string? note)
        InProgress → Resolved

    void Close(Guid changedByUserId, string? note)
        Resolved → Closed

    void Reopen(Guid changedByUserId, string? note)
        Resolved → InProgress

    void Reject(Guid changedByUserId, string? note)
        New | Reviewing → Rejected

    void Cancel(Guid changedByUserId)
        New | Reviewing | Assigned → Cancelled

  Child Management Methods:
    Comment AddComment(string content, Guid createdByUserId)
        — guards against terminal states

    Attachment AddAttachment(string fileName, string contentType,
                             long fileSizeInBytes, string storagePath, Guid uploadedByUserId)
        — guards against terminal states

  Detail Update Methods:
    void UpdateDetails(string? title, string? description, Guid? categoryId, Location? location)
        — guards against terminal states

    void SetPriority(Priority priority)
        — guards against terminal states

  Private Helpers:
    void TransitionTo(RequestStatus newStatus, Guid changedByUserId, string? note)
        — atomically: creates StatusHistoryEntry + updates Status + sets UpdatedAt
    void EnsureValidTransition(RequestStatus expected, RequestStatus target)
    void EnsureNotInTerminalState(string action)
```

---

### `Entities/StatusHistoryEntry.cs` — Child of ServiceRequest

```
class StatusHistoryEntry : BaseEntity
  Properties:
    Guid ServiceRequestId            { get; private set; }
    RequestStatus OldStatus          { get; private set; }
    RequestStatus NewStatus          { get; private set; }
    string? Note                     { get; private set; }
    Guid ChangedByUserId             { get; private set; }
    DateTime ChangedAt               { get; private set; }

  Constructors:
    private StatusHistoryEntry()     — for EF Core
    internal StatusHistoryEntry(Guid id, Guid serviceRequestId,
        RequestStatus oldStatus, RequestStatus newStatus,
        Guid changedByUserId, string? note)
```

---

### `Entities/Comment.cs` — Child of ServiceRequest

```
class Comment : BaseEntity
  Properties:
    Guid ServiceRequestId            { get; private set; }
    string Content                   { get; private set; }
    Guid CreatedByUserId             { get; private set; }
    DateTime CreatedAt               { get; private set; }

  Constructors:
    private Comment()                — for EF Core
    internal Comment(Guid id, Guid serviceRequestId, string content, Guid createdByUserId)
    — validates: content non-empty

  Note: Comment has its own CreatedAt because it needs a timestamp,
        but this is defined on Comment itself, not inherited from BaseEntity.
```

---

### `Entities/Attachment.cs` — Child of ServiceRequest

```
class Attachment : BaseEntity
  Properties:
    Guid ServiceRequestId            { get; private set; }
    string FileName                  { get; private set; }
    string ContentType               { get; private set; }
    long FileSizeInBytes             { get; private set; }
    string StoragePath               { get; private set; }     — opaque key, only Infrastructure resolves
    Guid UploadedByUserId            { get; private set; }
    DateTime UploadedAt              { get; private set; }

  Constructors:
    private Attachment()             — for EF Core
    internal Attachment(Guid id, Guid serviceRequestId, string fileName,
        string contentType, long fileSizeInBytes, string storagePath,
        Guid uploadedByUserId)
    — validates: fileName, contentType, storagePath non-empty; fileSizeInBytes > 0
```

---

## Key Design Decisions (Revised)

| Decision | Approach | Rationale |
|----------|----------|-----------|
| **Category** | Data-driven entity (not enum) | Municipalities can add categories at runtime without recompilation |
| **BaseEntity** | Id only — no timestamps | Each entity declares only the fields it actually needs |
| **User roles** | Single entity + UserRole enum | No inheritance; role-based composition is sufficient |
| **Child constructors** | `internal` | Only the aggregate root (ServiceRequest) can create children |
| **Collections** | Private `List<T>`, public `IReadOnlyList<T>` | Encapsulation — no external mutation |
| **State machine** | Explicit methods per transition | Each method guards, transitions, and records history atomically |
| **Timestamps** | Per-entity (`CreatedAt`, `UpdatedAt` where needed) | Not forced through base class |
| **Value objects** | C# `record` types | Free value equality + immutability |
| **Cross-aggregate refs** | ID only (Guid) | No navigation properties between aggregates |

---

## What Is NOT Included

- ❌ No RequestCategory enum (replaced by Category entity)
- ❌ No WorkOrder entity
- ❌ No Assignment entity
- ❌ No global audit timestamps in BaseEntity
- ❌ No repository interfaces (Application layer — future phase)
- ❌ No EF Core attributes or usings
- ❌ No NuGet packages in Domain

---

## Verification Plan

```bash
cd backend/dotnet
dotnet restore BCSMS.sln
dotnet build BCSMS.sln
```
Must pass with **0 errors, 0 warnings**.

Post-build checks:
- Domain csproj has zero `<PackageReference>` entries
- No `using Microsoft.EntityFrameworkCore` or `using Microsoft.AspNetCore` in any Domain file
- All state transitions are guarded
- All collections are encapsulated
