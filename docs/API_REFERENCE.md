# MedAI Hub - API Reference

## Base URL
- **Development**: `http://localhost:8000`
- **API Docs**: `http://localhost:8000/api/docs` (Swagger UI)

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

The token is obtained from Supabase Auth after login.

---

## Health Check

### `GET /`
### `GET /health`

Check if the API is running.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

---

## Projects

### `POST /api/v1/projects`

Create a new project.

**Request Body:**
```json
{
  "name": "My Research Project",
  "description": "Optional description",
  "framework_type": "PICO"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "My Research Project",
  "description": "Optional description",
  "framework_type": "PICO",
  "framework_data": null,
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### `GET /api/v1/projects`

List all projects for the authenticated user.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "My Research Project",
    "framework_type": "PICO",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### `GET /api/v1/projects/{id}`

Get a specific project by ID.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "My Research Project",
  "description": "Optional description",
  "framework_type": "PICO",
  "framework_data": {
    "population": "Adults with diabetes",
    "intervention": "Metformin",
    "comparison": "Placebo",
    "outcome": "HbA1c reduction"
  },
  "created_at": "2024-01-01T00:00:00.000Z",
  "updated_at": "2024-01-01T00:00:00.000Z"
}
```

### `PATCH /api/v1/projects/{id}`

Update a project.

**Request Body:**
```json
{
  "name": "Updated Name",
  "framework_data": {
    "population": "Updated population"
  }
}
```

**Response:** `200 OK`

### `DELETE /api/v1/projects/{id}`

Delete a project and all associated data.

**Response:** `204 No Content`

---

## Define Tool

### `GET /api/v1/define/frameworks`

Get all available framework schemas.

**Response:** `200 OK`
```json
{
  "PICO": {
    "name": "PICO",
    "description": "For intervention studies",
    "fields": [
      {
        "key": "population",
        "label": "Population",
        "description": "Who are you studying?"
      }
    ]
  }
}
```

### `POST /api/v1/define/chat`

Send a chat message and receive AI response with framework extraction.

**Request Body:**
```json
{
  "project_id": "uuid",
  "message": "I want to study the effect of exercise on depression in elderly patients",
  "framework_type": "PICO"
}
```

**Response:** `200 OK`
```json
{
  "response": "I understand you want to study exercise interventions for depression in elderly patients...",
  "framework_data": {
    "population": "Elderly patients with depression",
    "intervention": "Exercise",
    "comparison": null,
    "outcome": "Depression symptoms"
  }
}
```

### `GET /api/v1/define/conversation/{project_id}`

Get chat history for a project.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "role": "user",
    "content": "I want to study...",
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "role": "assistant",
    "content": "I understand...",
    "created_at": "2024-01-01T00:00:01.000Z"
  }
]
```

---

## Query Tool

### `POST /api/v1/query/generate`

Generate a PubMed boolean search query from framework data.

**Request Body:**
```json
{
  "project_id": "uuid"
}
```

**Response:** `200 OK`
```json
{
  "query": "(\"elderly\"[MeSH] OR \"aged\"[Title/Abstract]) AND (\"exercise\"[MeSH] OR \"physical activity\"[Title/Abstract]) AND (\"depression\"[MeSH] OR \"depressive disorder\"[Title/Abstract])",
  "explanation": "This query searches for studies on exercise interventions for depression in elderly populations..."
}
```

### `GET /api/v1/query/history/{project_id}`

Get query generation history for a project.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "query_text": "(\"elderly\"[MeSH]...",
    "query_type": "boolean",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

## Review Tool

### `POST /api/v1/review/upload`

Upload a MEDLINE file for parsing.

**Request:** `multipart/form-data`
- `file`: MEDLINE text file
- `project_id`: Project UUID

**Response:** `202 Accepted`
```json
{
  "file_id": "uuid",
  "status": "processing",
  "message": "File uploaded and parsing started"
}
```

### `GET /api/v1/review/files/{project_id}`

Get uploaded files for a project.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "filename": "pubmed_results.txt",
    "file_type": "MEDLINE",
    "status": "completed",
    "uploaded_at": "2024-01-01T00:00:00.000Z"
  }
]
```

### `GET /api/v1/review/abstracts/{project_id}`

Get parsed abstracts for a project.

**Query Parameters:**
- `status` (optional): Filter by status (`pending`, `included`, `excluded`, `maybe`)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "pmid": "12345678",
    "title": "Effect of exercise on depression...",
    "abstract": "Background: Depression is common...",
    "authors": "Smith J; Doe A",
    "journal": "J Med Research",
    "publication_date": "2023-01-15",
    "keywords": ["exercise", "depression", "elderly"],
    "status": "pending",
    "decision": null,
    "ai_reasoning": null,
    "human_decision": null
  }
]
```

### `POST /api/v1/review/analyze`

Start batch AI analysis of abstracts.

**Request Body:**
```json
{
  "project_id": "uuid",
  "batch_size": 10,
  "inclusion_criteria": "Studies on exercise interventions",
  "exclusion_criteria": "Animal studies, reviews"
}
```

**Response:** `202 Accepted`
```json
{
  "status": "started",
  "abstracts_to_process": 50,
  "batch_size": 10
}
```

### `PATCH /api/v1/review/abstracts/{abstract_id}`

Update abstract decision (human override).

**Request Body:**
```json
{
  "human_decision": "include"
}
```

**Response:** `200 OK`

---

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message here"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing or invalid token |
| 403 | Forbidden - Access denied |
| 404 | Not Found - Resource doesn't exist |
| 422 | Unprocessable Entity - Validation error |
| 500 | Internal Server Error |

---

## Rate Limiting

Currently no rate limiting is implemented. Consider adding for production.

## CORS

Allowed origins configured in backend settings. Default allows `localhost:3000` for development.
