# PRD: Define API (Chat & Framework Extraction)

## General Information

| Field | Value |
|-------|-------|
| **Module Name** | Define API |
| **Path** | `/api/v1/define/*` |
| **File** | `backend/app/api/routes/define.py` |
| **Priority** | P0 - Critical |
| **Status** | Implemented (v1.0), Update Required for v2.0 |
| **Version** | 2.0 |

---

## 1. Overview

### 1.1 Module Purpose

The Define API provides AI-powered chat for research question formulation. It uses Google Gemini to guide users through structured frameworks (PICO, CoCoPop, etc.) and automatically extracts framework data from conversations.

### 1.2 Business Value

- AI-assisted research question formulation
- Dynamic framework support (17+ frameworks)
- Automatic extraction of structured data
- Bilingual support (English/Hebrew)
- Foundation data for Query tool

---

## 2. API Endpoints

### EP-DEF-001: Get Frameworks

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/define/frameworks` |
| **Auth** | Not Required |
| **Response** | `FrameworkSchemaResponse` |

#### Response Schema

```python
class FrameworkSchemaResponse(BaseModel):
    frameworks: Dict[str, Any]
```

#### Response Example

```json
{
  "frameworks": {
    "PICO": {
      "name": "PICO",
      "description": "Population, Intervention, Comparison, Outcome",
      "fields": [
        {"key": "P", "label": "Population", "description": "What is the population?"},
        {"key": "I", "label": "Intervention", "description": "What is the intervention?"},
        {"key": "C", "label": "Comparison", "description": "What is the comparison?"},
        {"key": "O", "label": "Outcome", "description": "What is the outcome?"}
      ]
    },
    "CoCoPop": {...},
    "PEO": {...}
  }
}
```

#### Supported Frameworks (17+)

| Category | Frameworks |
|----------|------------|
| PICO Family | PICO, PICOT, PICOS, PICOC, PICOTS |
| JBI Standards | CoCoPop, PEO, PECO, PFO, PIRD, PCC, PICo |
| Qualitative | SPIDER, SPICE |
| Policy | ECLIPSE, CIMO |
| Specialized | BeHEMoTh, PerSPEcTiF, PICOT-D, PICOTS-ComTeC |

---

### EP-DEF-002: Chat

| Field | Value |
|-------|-------|
| **Method** | POST |
| **Path** | `/api/v1/define/chat` |
| **Auth** | Required |
| **Request** | `ChatRequest` |
| **Response** | `ChatResponse` |

#### Request Schema

```python
class ChatRequest(BaseModel):
    project_id: UUID
    message: str
    framework_type: Optional[str] = "PICO"
    language: Optional[str] = "en"  # "en" or "he"
```

#### Response Schema

```python
class ChatResponse(BaseModel):
    message: str                                # AI response text
    framework_data: Optional[Dict[str, Any]]    # Extracted framework fields
    extracted_fields: Optional[Dict[str, str]]  # Same as framework_data
```

#### Response Example

```json
{
  "message": "I understand you're interested in studying diabetes treatment in elderly patients. Let me help you structure this using the PICO framework...\n\n**Population**: Based on your description, this would be elderly adults (65+) with Type 2 diabetes...",
  "framework_data": {
    "P": "elderly adults (65+) with type 2 diabetes",
    "I": "metformin treatment",
    "C": "placebo or standard care",
    "O": "glycemic control (HbA1c levels)"
  },
  "extracted_fields": {
    "P": "elderly adults (65+) with type 2 diabetes",
    "I": "metformin treatment",
    "C": "placebo or standard care",
    "O": "glycemic control (HbA1c levels)"
  }
}
```

#### Processing Flow

```
┌─────────────────┐
│ User Message    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save to DB      │  chat_messages (role: user)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Get History     │  Load previous messages
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Prompt    │  System prompt + history + message
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ AI Service      │  Gemini Flash
│ chat_for_define │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse Response  │  Extract JSON: {chat_response, framework_data}
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Save Response   │  chat_messages (role: assistant)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Update Project  │  Save framework_data to project
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Return Response │
└─────────────────┘
```

---

### EP-DEF-003: Get Conversation

| Field | Value |
|-------|-------|
| **Method** | GET |
| **Path** | `/api/v1/define/conversation/{project_id}` |
| **Auth** | Required |
| **Response** | `{ messages: List[ChatMessage] }` |

#### Response Example

```json
{
  "messages": [
    {
      "id": "uuid",
      "project_id": "uuid",
      "role": "user",
      "content": "I want to study diabetes treatment",
      "created_at": "2024-12-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "project_id": "uuid",
      "role": "assistant",
      "content": "I'll help you formulate a research question...",
      "created_at": "2024-12-15T10:30:05Z"
    }
  ]
}
```

---

### EP-DEF-004: Clear Conversation

| Field | Value |
|-------|-------|
| **Method** | DELETE |
| **Path** | `/api/v1/define/conversation/{project_id}` |
| **Auth** | Required |
| **Response** | `{ status: "cleared", project_id: string }` |

#### Business Rules

- Deletes all `chat_messages` for project
- Does NOT delete `framework_data` from project
- User must explicitly clear framework data separately

---

## 3. AI Integration

### 3.1 System Prompt Structure

```python
# backend/app/core/prompts/define.py

def get_define_system_prompt(framework_type: str, language: str = "en") -> str:
    """
    Returns system prompt for Define chat.

    Includes:
    - Role definition (Medical Research Assistant)
    - Framework schema and components
    - Conversation guidelines
    - JSON output format
    - Language-specific instructions
    - Hebrew translation rules (v2.0)
    """
```

### 3.2 AI Response Format

The AI returns a hybrid JSON structure:

```json
{
  "chat_response": "Natural language response to user...",
  "framework_data": {
    "P": "extracted population",
    "I": "extracted intervention",
    "C": "extracted comparison",
    "O": "extracted outcome"
  }
}
```

### 3.3 Hebrew Translation (v2.0)

**Critical Rule**: All medical terms in `framework_data` must be in English for PubMed compatibility.

| Input Language | Chat Response | Framework Data |
|----------------|---------------|----------------|
| English | English | English |
| Hebrew | Hebrew | **English** (translated) |

#### Translation Examples

| User Input (Hebrew) | Saved in framework_data |
|--------------------|-------------------------|
| "חולי סוכרת מבוגרים" | "elderly patients with type 2 diabetes" |
| "מטפורמין" | "metformin" |
| "תמותה מכל סיבה" | "all-cause mortality" |

---

## 4. Business Rules

### BR-DEF-001: Project Ownership

- User must own the project to chat
- Verified via `user_id` comparison

### BR-DEF-002: Conversation Persistence

- All messages saved to `chat_messages` table
- History loaded for context in each request
- Maximum 50 messages per conversation

### BR-DEF-003: Framework Data Auto-Save

- Extracted data automatically saved to `projects.framework_data`
- Overwrites previous extraction (not merged)
- User can manually edit via project UPDATE

### BR-DEF-004: Language Selection

- Language set in first message
- Cannot change mid-conversation
- Must clear history to switch language

### BR-DEF-005: Hebrew Translation (v2.0)

- All medical terms must be stored in English
- AI translates during extraction
- PubMed only supports English searches

### BR-DEF-006: Improved Extraction (v2.0)

- AI extracts from unstructured text
- Recognizes medical terminology
- Suggests MeSH terms when possible

### BR-DEF-007: Term Validation (v2.0)

- AI validates extracted terms
- Warns about vague or generic terms
- Suggests more specific alternatives

---

## 5. Data Models

### 5.1 Chat Message Entity

```sql
-- Database table: chat_messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,  -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);
```

### 5.2 Framework Data Storage

```json
// Stored in projects.framework_data (JSONB)
{
  "P": "elderly adults over 65 with type 2 diabetes",
  "I": "metformin 500mg twice daily",
  "C": "placebo or no treatment",
  "O": "reduction in HbA1c levels"
}
```

---

## 6. Error Handling

### 6.1 Error Codes

| Code | Condition | Message |
|------|-----------|---------|
| 404 | Project not found | "Project not found" |
| 403 | User doesn't own project | "Access denied" |
| 500 | AI service error | "Error processing your message" |

### 6.2 AI Fallback

If AI response parsing fails:

```python
return {
    "chat_response": raw_response_text,
    "framework_data": {}
}
```

---

## 7. Development Tasks

### 7.1 Implemented (v1.0)

- [x] Framework schemas endpoint
- [x] Chat endpoint with AI integration
- [x] Conversation history retrieval
- [x] Clear conversation endpoint
- [x] Project ownership validation
- [x] Automatic framework extraction
- [x] Hebrew language support

### 7.2 Tasks v2.0 (High Priority)

- [ ] **DEF-API-T001**: Add Hebrew→English translation in system prompt
- [ ] **DEF-API-T002**: Add validation that framework_data is English
- [ ] **DEF-API-T003**: Improve extraction from unstructured text
- [ ] **DEF-API-T004**: Add MeSH term suggestions
- [ ] **DEF-API-T005**: Add "Translated" indicator for Hebrew input

### 7.3 Tasks for Later

- [ ] **DEF-API-T010**: Add streaming response support
- [ ] **DEF-API-T011**: Add conversation export
- [ ] **DEF-API-T012**: Add suggested prompts endpoint
- [ ] **DEF-API-T013**: Add framework recommendation based on text
- [ ] **DEF-API-T014**: Add citation suggestions

---

## 8. Testing Requirements

### 8.1 Unit Tests

| Test | Description |
|------|-------------|
| `test_get_frameworks` | Returns all framework schemas |
| `test_chat_english` | English conversation works |
| `test_chat_hebrew` | Hebrew conversation works |
| `test_chat_extracts_pico` | PICO fields extracted correctly |
| `test_chat_ownership` | User can only chat in own projects |
| `test_clear_conversation` | Messages deleted but framework kept |

### 8.2 AI Tests

| Test | Description |
|------|-------------|
| `test_hebrew_translation` | Hebrew terms translated to English |
| `test_extraction_unstructured` | Extracts from free-text |
| `test_fallback_on_parse_error` | Handles malformed AI response |

---

## 9. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-12 | Initial implementation |
| 2.0 | 2024-12 | Hebrew translation, improved extraction |
