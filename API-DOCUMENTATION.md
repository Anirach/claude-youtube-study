# YouTube Study App - API Documentation

**Version:** 1.0.0
**Base URL:** `http://localhost:4000/api`

---

## Table of Contents

1. [Videos API](#videos-api)
2. [Categories API](#categories-api)
3. [Knowledge Graph API](#knowledge-graph-api)
4. [Chat API](#chat-api)
5. [Monitoring API](#monitoring-api)
6. [Error Handling](#error-handling)

---

## Videos API

### Add Video

```http
POST /api/videos
```

Add a new YouTube video to the collection.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "categoryId": "uuid-string",  // Optional
  "tags": ["tutorial", "javascript"]  // Optional
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "youtubeId": "dQw4w9WgXcQ",
  "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  "title": "Video Title",
  "author": "Channel Name",
  "duration": 240,
  "uploadDate": "2024-01-01T00:00:00.000Z",
  "categoryId": "uuid",
  "tags": ["tutorial", "javascript"],
  "watchStatus": "unwatched",
  "transcription": null,
  "summaryJson": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### List Videos

```http
GET /api/videos?categoryId=&watchStatus=&search=&limit=50&offset=0
```

Retrieve all videos with optional filtering.

**Query Parameters:**
- `categoryId` (string, optional): Filter by category
- `watchStatus` (string, optional): Filter by status (unwatched, watching, watched)
- `search` (string, optional): Search in title and author
- `limit` (number, optional): Number of results (default: 50)
- `offset` (number, optional): Pagination offset (default: 0)

**Response:** `200 OK`
```json
{
  "videos": [...],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

### Get Video Details

```http
GET /api/videos/:id
```

Get detailed information about a specific video.

**Response:** `200 OK`

---

### Update Video

```http
PUT /api/videos/:id
```

Update video metadata.

**Request Body:**
```json
{
  "categoryId": "uuid",  // Optional
  "tags": ["new", "tags"],  // Optional
  "watchStatus": "watched"  // Optional
}
```

**Response:** `200 OK`

---

### Delete Video

```http
DELETE /api/videos/:id
```

Delete a video and its associated data.

**Response:** `200 OK`

---

### Process Video

```http
POST /api/videos/:id/process
```

Trigger transcription retrieval and summarization for a video.

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "transcription": "Full video transcript...",
  "summaryJson": {
    "quickSummary": "Brief 50-word summary",
    "detailedSummary": "Detailed 500-word summary",
    "keyPoints": ["Point 1", "Point 2", "..."]
  }
}
```

---

### Auto-Categorize Video

```http
POST /api/videos/:id/auto-categorize
```

Get AI-powered category and tag suggestions for a video.

**Response:** `200 OK`
```json
{
  "suggestedCategory": "Programming",
  "isNewCategory": false,
  "tags": ["javascript", "tutorial", "coding"],
  "confidence": 0.85,
  "reason": "Based on title and content analysis"
}
```

---

### Bulk Operations

#### Bulk Categorize

```http
POST /api/videos/bulk/categorize
```

**Request Body:**
```json
{
  "videoIds": ["uuid1", "uuid2", "..."]
}
```

**Response:** `200 OK`
```json
{
  "suggestions": [
    {
      "videoId": "uuid1",
      "suggestedCategory": "Programming",
      "tags": ["..."]
    }
  ]
}
```

#### Bulk Update

```http
PUT /api/videos/bulk/update
```

**Request Body:**
```json
{
  "videoIds": ["uuid1", "uuid2"],
  "updates": {
    "categoryId": "uuid",
    "watchStatus": "watched",
    "tags": ["tag1", "tag2"]
  }
}
```

**Response:** `200 OK`

#### Bulk Delete

```http
DELETE /api/videos/bulk/delete
```

**Request Body:**
```json
{
  "videoIds": ["uuid1", "uuid2", "..."]
}
```

**Response:** `200 OK`

---

## Categories API

### Create Category

```http
POST /api/categories
```

**Request Body:**
```json
{
  "name": "Programming",
  "parentId": "uuid",  // Optional - for hierarchical categories
  "color": "#3b82f6",  // Optional
  "icon": "💻"  // Optional
}
```

**Response:** `201 Created`

---

### List Categories

```http
GET /api/categories
```

Get all categories with video counts.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Programming",
    "parentId": null,
    "color": "#3b82f6",
    "icon": "💻",
    "videoCount": 25,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### Get Category Tree

```http
GET /api/categories/tree/structure
```

Get hierarchical category structure.

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Programming",
    "children": [
      {
        "id": "uuid2",
        "name": "JavaScript",
        "children": []
      }
    ]
  }
]
```

---

### Get Subcategories

```http
GET /api/categories/:id/subcategories
```

Get all child categories of a specific category.

**Response:** `200 OK`

---

### Update Category

```http
PUT /api/categories/:id
```

**Request Body:**
```json
{
  "name": "New Name",
  "parentId": "uuid",
  "color": "#10b981",
  "icon": "🎓"
}
```

**Response:** `200 OK`

---

### Delete Category

```http
DELETE /api/categories/:id
```

Delete a category (videos will be unassigned).

**Response:** `200 OK`

---

## Knowledge Graph API

### Get Knowledge Graph

```http
GET /api/graph
```

Get the complete knowledge graph with nodes and edges.

**Response:** `200 OK`
```json
{
  "nodes": [
    {
      "id": "uuid",
      "label": "Video Title",
      "category": "Programming",
      "watchStatus": "watched"
    }
  ],
  "edges": [
    {
      "from": "uuid1",
      "to": "uuid2",
      "type": "same_category"
    }
  ],
  "stats": {
    "videoCount": 50,
    "edgeCount": 75,
    "categories": 5
  }
}
```

---

### Get Video Relationships

```http
GET /api/graph/relationships?videoId=uuid
```

Get related videos for a specific video.

**Response:** `200 OK`
```json
{
  "videoId": "uuid",
  "relationships": [
    {
      "id": "uuid2",
      "title": "Related Video",
      "similarity": 0.75,
      "reason": "Same category"
    }
  ]
}
```

---

## Chat API

### Create Chat Session

```http
POST /api/chat
```

**Request Body:**
```json
{
  "videoIds": ["uuid1", "uuid2"]
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "videoIds": ["uuid1", "uuid2"],
  "messages": [],
  "contextSummary": null,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

---

### Send Message

```http
POST /api/chat/:id/message
```

**Request Body:**
```json
{
  "message": "What are the main topics covered?"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "messages": [
    {
      "role": "user",
      "content": "What are the main topics covered?",
      "timestamp": "2024-01-01T00:00:00.000Z"
    },
    {
      "role": "assistant",
      "content": "The videos cover...",
      "sources": [
        {
          "id": "uuid",
          "title": "Source Video",
          "url": "https://..."
        }
      ],
      "timestamp": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

---

### Get Chat History

```http
GET /api/chat/:id
```

Retrieve all messages from a chat session.

**Response:** `200 OK`

---

### List Chat Sessions

```http
GET /api/chat
```

Get all chat sessions (most recent first, limit 20).

**Response:** `200 OK`

---

## Monitoring API

### Health Check

```http
GET /api/monitoring/health
```

Comprehensive health status.

**Response:** `200 OK`
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "uptimeFormatted": "1h 0m 0s",
  "database": {
    "status": "healthy",
    "responseTime": 5,
    "videoCount": 100,
    "categoryCount": 10
  },
  "memory": {
    "used": 256,
    "total": 512,
    "unit": "MB",
    "withinLimit": true
  },
  "performance": {
    "averageResponseTime": 150,
    "totalRequests": 1000,
    "performanceScore": 97.5,
    "meetsRequirement": true
  }
}
```

---

### Performance Metrics

```http
GET /api/monitoring/performance
```

Detailed performance statistics.

**Response:** `200 OK`
```json
{
  "totalRequests": 1000,
  "averageResponseTime": 150,
  "slowRequestCount": 5,
  "recentSlowRequests": [...],
  "errorCount": 2,
  "performanceScore": 97.5,
  "meetsRequirement": true,
  "byEndpoint": [
    {
      "endpoint": "GET /api/videos",
      "count": 250,
      "totalTime": 37500,
      "avgTime": 150,
      "maxTime": 500,
      "minTime": 50
    }
  ]
}
```

---

### Error Statistics

```http
GET /api/monitoring/errors
```

Error tracking and statistics.

**Response:** `200 OK`

---

### System Information

```http
GET /api/monitoring/system
```

System resource usage and database statistics.

**Response:** `200 OK`

---

### Monitoring Dashboard

```http
GET /api/monitoring/dashboard
```

Combined dashboard data for monitoring UI.

**Response:** `200 OK`

---

## Error Handling

All API endpoints return errors in a consistent format:

```json
{
  "error": {
    "message": "Error description",
    "statusCode": 400,
    "timestamp": "2024-01-01T00:00:00.000Z",
    "path": "/api/videos",
    "details": {}  // Optional additional information
  }
}
```

### Common Status Codes

- `200` - Success
- `201` - Resource created
- `400` - Bad request (invalid input)
- `404` - Resource not found
- `409` - Conflict (e.g., duplicate video)
- `500` - Internal server error
- `503` - Service unavailable

---

## Rate Limiting

Currently no rate limiting is implemented. All endpoints are available without restrictions for local use.

---

## Authentication

Currently no authentication is required. This is designed for personal, local use.

---

## Performance Requirements (PRD)

- **Target:** 95% of operations complete in < 2 seconds
- **Memory:** < 2GB RAM for standard operation
- **Monitoring:** Use `/api/monitoring/performance` to track compliance

---

## Best Practices

1. **Batch Operations:** Use bulk endpoints for multiple videos
2. **Pagination:** Use `limit` and `offset` for large result sets
3. **Error Handling:** Always check response status codes
4. **Processing:** Use `/process` endpoint after adding videos for full functionality
5. **Monitoring:** Regularly check `/api/monitoring/health` for system status

---

**Last Updated:** November 2025
**API Version:** 1.0.0
