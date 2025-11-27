# PRD: Projects API

## General Information

| Field | Value |
|-------|-------|
| **Module Name** | Projects API |
| **Path** | `/api/v1/projects/*` |
| **File** | `backend/app/api/routes/projects.py` |
| **Priority** | P0 - Critical |
| **Status** | Implemented (v1.0), Update Required for v2.0 |
| **Version** | 2.0 |

---

## 1. Overview

### 1.1 Module Purpose

The Projects API provides CRUD operations for research projects. Each project serves as a container for all research data including chat history, queries, uploaded files, and screening results.

### 1.2 Business Value

- Central organization for systematic reviews
- User-specific project isolation
- Data integrity through cascade operations
- Foundation for all other tools (Define, Query, Review)

---

## 2. API Endpoints

### EP-PRJ-001: Create Project

| Field | Value |
|-------|-------|
| **Method** | POST |
| **Path** | `/api/v1/projects/` |
| **Auth** | Required |
| **Request** | `ProjectCreate` |
| **Response** | `ProjectResponse` (201) |

#### Request Schema

```python
class ProjectCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    framework_type: Optional[str] = Field(
        None,
        description="PICO, CoCoPop, PEO, SPIDER, SPICE, ECLIPSE, FINER"
    )
    framework_data: Optional[Dict[str, Any]] = None
```

#### Response Schema

```python
class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    framework_type: Optional[str]
    framework_data: Optional[Dict[str, Any]]
    created_at: datetime
    updated_at: datetime
```

#### Example

```bash
POST /api/v1/projects/
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Diabetes Metformin Review",
  "description": "Systematic review of metformin efficacy",
  "framework_type": "PICO"
}
```

---

### EP-PRJ-002: List Projects

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/projects/` |
| **Auth** | Required |
| **Query Params** | `limit` (default: 100) |
| **Response** | `List[ProjectResponse]` |

#### Business Rules

- Returns only projects belonging to authenticated user
- Ordered by `created_at` DESC (newest first)
- Maximum 100 projects per request

---

### EP-PRJ-003: Get Project

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/projects/{project_id}` |
| **Auth** | Required |
| **Response** | `ProjectResponse` |

#### Error Codes

| Code | Condition |
|------|-----------|
| 404 | Project not found |
| 403 | User doesn't own project |

---

### EP-PRJ-004: Update Project

| Field | Value |
|-------|-------|
| **Method** | PATCH |
| **Path** | `/api/v1/projects/{project_id}` |
| **Auth** | Required |
| **Request** | `ProjectUpdate` |
| **Response** | `ProjectResponse` |

#### Request Schema

```python
class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    framework_type: Optional[str] = None
    framework_data: Optional[Dict[str, Any]] = None
```

#### Partial Update Logic

- Only provided fields are updated
- `framework_data` is replaced entirely (not merged)
- `updated_at` is automatically updated via database trigger

---

### EP-PRJ-005: Delete Project (v2.0 - New)

| Field | Value |
|-------|-------|
| **Method** | DELETE |
| **Path** | `/api/v1/projects/{project_id}` |
| **Auth** | Required |
| **Response** | `DeleteProjectResponse` |
| **Status** | To Be Implemented |

#### Response Schema (v2.0)

```python
class DeleteProjectResponse(BaseModel):
    success: bool
    deleted_counts: Dict[str, int]  # Count of deleted entities
```

#### Example Response

```json
{
  "success": true,
  "deleted_counts": {
    "chat_messages": 15,
    "files": 2,
    "abstracts": 124,
    "query_strings": 3,
    "analysis_runs": 1
  }
}
```

#### Cascade Delete Rules

| Table | Delete Behavior | Foreign Key |
|-------|-----------------|-------------|
| `chat_messages` | CASCADE | `project_id` |
| `files` | CASCADE | `project_id` |
| `abstracts` | CASCADE | `project_id` |
| `query_strings` | CASCADE | `project_id` |
| `analysis_runs` | CASCADE | `project_id` |

#### Pre-Delete Validation

| Check | Condition | Action |
|-------|-----------|--------|
| Active Analysis | `analysis_runs.status = 'running'` | Block delete, return 409 |
| Processing File | `files.status = 'processing'` | Block delete, return 409 |

---

## 3. Data Models

### 3.1 Project Entity

```python
# Database table: projects
{
    "id": "UUID",                    # Primary key
    "name": "VARCHAR(255) NOT NULL",
    "description": "TEXT",
    "framework_type": "VARCHAR(50)", # PICO, CoCoPop, etc.
    "framework_data": "JSONB",       # Dynamic schema per framework
    "user_id": "UUID",               # Owner (FK to auth.users)
    "created_at": "TIMESTAMPTZ",
    "updated_at": "TIMESTAMPTZ"      # Auto-updated by trigger
}
```

### 3.2 Framework Types

| Framework | Description | Use Case |
|-----------|-------------|----------|
| PICO | Population, Intervention, Comparison, Outcome | Intervention studies |
| PICOT | PICO + Timeframe | Time-sensitive interventions |
| PICOS | PICO + Study design | Systematic reviews |
| CoCoPop | Condition, Context, Population | Prevalence studies |
| PEO | Population, Exposure, Outcome | Etiology/risk factor |
| SPIDER | Sample, Phenomenon, Design, Evaluation, Research | Qualitative |
| SPICE | Setting, Perspective, Intervention, Comparison, Evaluation | Service evaluation |
| ECLIPSE | Expectation, Client, Location, Impact, Professionals, Service | Health policy |
| FINER | Feasible, Interesting, Novel, Ethical, Relevant | Research planning |

---

## 4. Business Rules

### BR-PRJ-001: User Ownership

- Each project is associated with `user_id` from authentication
- Users can only access their own projects
- Row Level Security (RLS) enforced at database level (when enabled)

### BR-PRJ-002: Default Framework

- If `framework_type` not provided, defaults to `PICO`
- Framework can be changed later via UPDATE

### BR-PRJ-003: Framework Data Validation

- `framework_data` is JSONB - flexible schema
- AI service populates based on framework type
- Manual edits allowed via frontend

### BR-PRJ-004: Cascade Delete (v2.0)

- Deleting project removes ALL related data
- Database handles via `ON DELETE CASCADE`
- API returns count of deleted entities for confirmation

### BR-PRJ-005: Pre-Delete Validation (v2.0)

- Cannot delete if active background task running
- Must wait for `analysis_runs` to complete or fail
- Must wait for `files` to finish processing

---

## 5. Service Integration

### 5.1 Database Service Methods

```python
# backend/app/services/database.py

async def create_project(project_data: Dict) -> Dict
async def get_project(project_id: UUID) -> Optional[Dict]
async def update_project(project_id: UUID, update_data: Dict) -> Dict
async def list_projects(user_id: str, limit: int = 100) -> List[Dict]
async def delete_project(project_id: UUID) -> Dict  # v2.0
async def get_project_entity_counts(project_id: UUID) -> Dict  # v2.0
```

### 5.2 Authentication Integration

```python
from app.core.auth import get_current_user, UserPayload

@router.post("/")
async def create_project(
    project: ProjectCreate,
    current_user: UserPayload = Depends(get_current_user)
):
    project_data["user_id"] = current_user.id
    # ...
```

---

## 6. Error Handling

### 6.1 HTTP Status Codes

| Code | Description | When |
|------|-------------|------|
| 200 | Success | GET, PATCH successful |
| 201 | Created | POST successful |
| 204 | No Content | DELETE successful |
| 400 | Bad Request | Invalid input |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Project doesn't exist |
| 409 | Conflict | Cannot delete (active task) |
| 500 | Server Error | Unexpected error |

### 6.2 Error Response Format

```json
{
  "detail": "Project not found"
}
```

---

## 7. Development Tasks

### 7.1 Implemented (v1.0)

- [x] Create project endpoint
- [x] List projects endpoint
- [x] Get project by ID endpoint
- [x] Update project endpoint
- [x] User ownership validation
- [x] Pydantic schema validation

### 7.2 Tasks v2.0 (High Priority)

- [ ] **PRJ-API-T001**: Implement DELETE endpoint with cascade
- [ ] **PRJ-API-T002**: Add pre-delete validation (active tasks check)
- [ ] **PRJ-API-T003**: Return deleted entity counts in response
- [ ] **PRJ-API-T004**: Add soft-delete option (archive instead of delete)
- [ ] **PRJ-API-T005**: Add project duplication endpoint

### 7.3 Tasks for Later

- [ ] **PRJ-API-T010**: Add pagination to list endpoint
- [ ] **PRJ-API-T011**: Add search/filter capabilities
- [ ] **PRJ-API-T012**: Add project sharing (multi-user access)
- [ ] **PRJ-API-T013**: Add project export (full data dump)
- [ ] **PRJ-API-T014**: Add project templates

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Test | Description |
|------|-------------|
| `test_create_project` | Valid project creation |
| `test_create_project_invalid` | Missing required fields |
| `test_list_projects_user_isolation` | User sees only own projects |
| `test_update_project_partial` | Partial update works |
| `test_delete_project_cascade` | All related data deleted |
| `test_delete_project_blocked` | Cannot delete with active task |

### 8.2 Integration Tests

| Test | Description |
|------|-------------|
| `test_full_project_lifecycle` | Create → Update → Delete |
| `test_project_with_all_tools` | Project used in Define, Query, Review |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation |
| 2.0 | 2024-12 | Added DELETE endpoint, cascade validation |
