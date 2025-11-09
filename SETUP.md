# YouTube Study App - Setup Guide

A comprehensive web application for managing and studying YouTube videos with AI-powered summaries, transcriptions, and knowledge graph features.

## Features

✅ **Video Management**
- Add YouTube videos by URL or ID
- Automatic metadata extraction (no API key required)
- Category organization
- Tag support
- Watch status tracking (unwatched, watching, watched)

✅ **AI-Powered Analysis**
- Automatic transcription retrieval
- Multi-level summaries (quick, detailed, key points)
- Support for multiple LLM providers (OpenAI, Gemini, Local)

✅ **Knowledge Management**
- RAG-based question answering
- Knowledge graph visualization
- Video relationships discovery
- Chat sessions with video context

✅ **User Interface**
- Modern, responsive design with TailwindCSS
- Dashboard with statistics
- Video grid and list views
- Search and filtering
- Intuitive video detail pages

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TailwindCSS, TypeScript
- **Backend**: Node.js, Express.js
- **Database**: Prisma ORM with SQLite
- **AI/ML**: OpenAI API / Google Gemini / Local LLMs (Ollama)
- **Video Data**: ytdl-core, youtube-transcript (no API key needed)
- **Deployment**: Docker + docker-compose

## Quick Start

### Prerequisites

- Docker and Docker Compose installed
- (Optional) OpenAI API key or Gemini API key for summaries

### Installation

1. Create environment file:
```bash
cp .env.example .env
```

2. Edit `.env` and add your API keys (optional but recommended):
```bash
# For OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=your_key_here

# OR for Gemini
LLM_PROVIDER=gemini
GEMINI_API_KEY=your_key_here
```

3. Start the application:
```bash
docker-compose up --build
```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:4000

## Usage

### Adding Videos

1. Click "Add Video" button
2. Paste a YouTube URL or video ID
3. (Optional) Assign a category and tags
4. Check "Get transcription and summary immediately" for instant processing
5. Click "Add Video"

### Managing Videos

- **Dashboard**: View statistics and recent videos
- **Videos Page**: Browse all videos with search and filters
- **Video Detail**: Watch video, view summary, read transcription
- **Categories**: Organize videos into categories

### Processing Videos

Videos can be processed to get transcriptions and summaries:
- Automatically when adding (if checkbox is selected)
- Manually from the video detail page (click "Generate Summary")

## Development

### Local Development (without Docker)

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### Project Structure

```
youtube-study-app/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express server
│   │   ├── routes/             # API routes
│   │   ├── services/           # Business logic
│   │   └── prisma/             # Database schema
│   └── package.json
├── frontend/
│   ├── app/                    # Next.js pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities
│   └── package.json
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Container definition
└── .env.example               # Environment template
```

## API Endpoints

### Videos
- `POST /api/videos` - Add video
- `GET /api/videos` - List videos
- `GET /api/videos/:id` - Get video details
- `PUT /api/videos/:id` - Update video
- `DELETE /api/videos/:id` - Delete video
- `POST /api/videos/:id/process` - Process video (transcription + summary)

### Categories
- `POST /api/categories` - Create category
- `GET /api/categories` - List categories
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Knowledge Graph
- `GET /api/graph` - Get knowledge graph
- `GET /api/graph/relationships` - Get video relationships

### Chat
- `POST /api/chat` - Create chat session
- `POST /api/chat/:id/message` - Send message
- `GET /api/chat/:id` - Get chat history

## Configuration

### LLM Providers

**OpenAI (Recommended):**
```env
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**Google Gemini:**
```env
LLM_PROVIDER=gemini
GEMINI_API_KEY=...
```

**Local LLM (Ollama):**
```env
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=llama2
```

### Database

By default, SQLite is used with data stored in `./data/app.db`. This persists across container restarts via Docker volumes.

## Troubleshooting

### Videos not processing
- Check that your LLM provider is configured correctly
- Verify API keys are valid
- Check backend logs: `docker-compose logs app`

### Transcription not available
- Some videos don't have captions enabled
- Try a different video with captions

### Container won't start
- Ensure ports 3000 and 4000 are not in use
- Check Docker logs: `docker-compose logs`

## License

MIT License
