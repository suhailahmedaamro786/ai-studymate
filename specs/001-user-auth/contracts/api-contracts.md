# API Contracts: AI StudyMate MVP

## Base Configuration

- **Base URL**: `http://localhost:8000`
- **Content-Type**: `application/json` (except file uploads: `multipart/form-data`)
- **Auth**: `Authorization: Bearer <supabase-jwt>` on all `/api/*` endpoints

## Response Envelope

All responses use a standard envelope:

```json
// Success
{ "data": <T>, "error": null }

// Error
{ "data": null, "error": { "code": "ERROR_CODE", "message": "...", "details": {} } }
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| AUTH_REQUIRED | 401 | No or invalid JWT |
| FORBIDDEN | 403 | Authenticated but not authorized |
| NOT_FOUND | 404 | Resource not found or not owned |
| VALIDATION_ERROR | 422 | Request body/params invalid |
| AI_PROVIDER_ERROR | 502 | LLM/embedding provider failed |
| INTERNAL_ERROR | 500 | Unexpected server error |

---

## Endpoints

### Health

#### GET /health
No auth required.

**Response 200:**
```json
{ "data": { "status": "ok", "timestamp": "2026-09-10T12:00:00Z" }, "error": null }
```

---

### Profiles

#### GET /api/profiles/me
**Response 200:**
```json
{
  "data": {
    "id": "uuid",
    "user_id": "uuid",
    "display_name": "Suhail",
    "education_level": "undergraduate",
    "subjects": ["biology", "chemistry"],
    "goals": "Pass final exams"
  }
}
```

#### PUT /api/profiles/me
**Request:**
```json
{
  "display_name": "Suhail",
  "education_level": "undergraduate",
  "subjects": ["biology", "chemistry"],
  "goals": "Pass final exams"
}
```
**Response 200:** Same shape as GET.

---

### Documents

#### POST /api/documents/upload
**Request:** multipart/form-data, field `file` (PDF, max 10MB)

**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "filename": "study-guide.pdf",
    "status": "queued",
    "page_count": null,
    "created_at": "2026-09-10T12:00:00Z"
  }
}
```
**Error 400:** `VALIDATION_ERROR` — non-PDF or oversized file.

#### GET /api/documents
**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "filename": "study-guide.pdf",
      "status": "ready",
      "page_count": 5,
      "created_at": "2026-09-10T12:00:00Z"
    }
  ]
}
```

#### GET /api/documents/{id}
**Response 200:** Single document object.
**Error 404:** `NOT_FOUND`

#### DELETE /api/documents/{id}
**Response 200:**
```json
{ "data": { "deleted": true }, "error": null }
```
**Error 404:** `NOT_FOUND`

---

### Tutor

#### POST /api/tutor/chats
**Request:**
```json
{ "title": "Biology Study" }
```
**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "title": "Biology Study",
    "created_at": "2026-09-10T12:00:00Z"
  }
}
```

#### GET /api/tutor/chats
**Response 200:** Array of chat objects (id, title, created_at, updated_at).

#### GET /api/tutor/chats/{id}/messages
**Response 200:** Array of message objects ordered by created_at.

#### POST /api/tutor/chats/{id}/messages
**Request:**
```json
{ "content": "What is photosynthesis based on my notes?" }
```
**Response 200 (grounded):**
```json
{
  "data": {
    "id": "uuid",
    "role": "assistant",
    "content": "Based on your materials, photosynthesis is...",
    "is_grounded": true,
    "citations": [
      {
        "document_id": "uuid",
        "document_name": "biology-notes.pdf",
        "chunk_index": 3,
        "page_number": 7,
        "excerpt": "Photosynthesis is the process..."
      }
    ]
  }
}
```
**Response 200 (fallback):**
```json
{
  "data": {
    "id": "uuid",
    "role": "assistant",
    "content": "I don't have enough information in your uploaded materials to answer this accurately.",
    "is_grounded": false,
    "citations": []
  }
}
```

---

### Quiz

#### POST /api/quiz/generate
**Request:**
```json
{
  "topic": "Photosynthesis",
  "difficulty": "medium",
  "question_count": 5
}
```
**Response 201:**
```json
{
  "data": {
    "id": "uuid",
    "topic": "Photosynthesis",
    "difficulty": "medium",
    "status": "ready",
    "questions": [
      {
        "id": "uuid",
        "question_text": "What is the primary pigment?",
        "options": [
          { "label": "A", "text": "Chlorophyll" },
          { "label": "B", "text": "Hemoglobin" },
          { "label": "C", "text": "Melanin" },
          { "label": "D", "text": "Keratin" }
        ],
        "order_index": 0
      }
    ]
  }
}
```
**Error 422:** `VALIDATION_ERROR` — empty topic, invalid difficulty, count out of range.

#### GET /api/quiz/{id}
**Response 200:** Quiz object with questions (correct_option excluded until attempt submitted).

#### POST /api/quiz/{id}/attempt
**Request:**
```json
{
  "answers": {
    "question-uuid-1": "A",
    "question-uuid-2": "C"
  }
}
```
**Response 201:**
```json
{
  "data": {
    "attempt_id": "uuid",
    "score": 80.0,
    "total_correct": 4,
    "total_questions": 5,
    "evaluation": {
      "weak_topics": ["cellular respiration"],
      "strong_topics": ["light reactions", "pigments"],
      "recommendations": [
        "Review Chapter 4 on cellular respiration"
      ]
    },
    "details": [
      {
        "question_id": "uuid",
        "selected": "B",
        "correct": "A",
        "is_correct": false,
        "explanation": "Chlorophyll is the primary pigment..."
      }
    ]
  }
}
```

#### GET /api/quiz/{id}/attempts
**Response 200:** Array of attempt summaries (id, score, created_at).

---

### Admin

#### GET /api/admin/health
**Response 200:**
```json
{
  "data": {
    "total_users": 12,
    "total_documents": 34,
    "total_chats": 56,
    "total_quizzes": 78,
    "system_status": "ok"
  }
}
```
