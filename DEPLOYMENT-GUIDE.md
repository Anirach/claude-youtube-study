# YouTube Study App - Deployment Guide

**Version:** 1.0.0
**Last Updated:** November 2025

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Configuration](#configuration)
4. [Docker Deployment](#docker-deployment)
5. [Local Development](#local-development)
6. [Database Management](#database-management)
7. [Backup & Restore](#backup--restore)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)
10. [Production Recommendations](#production-recommendations)

---

## Prerequisites

### Required

- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- **2GB RAM** minimum (4GB recommended)
- **2GB disk space** minimum

### Optional (for AI features)

- **OpenAI API Key** (for GPT-based summaries)
- **Google Gemini API Key** (alternative to OpenAI)
- **Local LLM** (Ollama with Llama 2 or similar)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd claude-youtube-study
```

### 2. Configure Environment

```bash
cp .env.example .env
nano .env  # or use your preferred editor
```

Minimum configuration (works without API keys):
```bash
DATABASE_URL=file:./data/app.db
LLM_PROVIDER=openai  # Can work without key for basic features
```

Recommended configuration:
```bash
# LLM Provider
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-key-here

# Database
DATABASE_URL=file:./data/app.db
```

### 3. Start the Application

```bash
docker-compose up --build
```

Wait for the startup messages:
```
✅ Backend server is running on port 4000
✅ Frontend ready on http://localhost:3000
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

**That's it!** 🎉 The application is now running.

---

## Configuration

### Environment Variables

#### LLM Configuration

**OpenAI (Recommended):**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-key
```

**Google Gemini:**
```bash
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
```

**Local LLM (Ollama):**
```bash
LLM_PROVIDER=local
LOCAL_LLM_URL=http://localhost:11434
LOCAL_LLM_MODEL=llama2
```

#### Database Configuration

```bash
DATABASE_URL=file:./data/app.db
```

The database file will be created automatically at `./data/app.db`.

#### Port Configuration

```bash
# Backend API port
PORT=4000

# Frontend URL
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Docker Deployment

### Standard Deployment

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Docker Commands

```bash
# Rebuild only
docker-compose build

# Restart services
docker-compose restart

# View running containers
docker-compose ps

# Execute commands in container
docker-compose exec app sh
```

### Data Persistence

Data is persisted in the `./data` directory:
- `./data/app.db` - SQLite database
- `./backups/` - Database backups

**Important:** Do not delete the `./data` directory unless you want to reset all data.

---

## Local Development

### Backend Development

```bash
cd backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Start development server
npm run dev
```

Backend runs on `http://localhost:4000`

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs on `http://localhost:3000`

### Environment Setup

Create `.env` in project root:
```bash
# Database
DATABASE_URL=file:./data/app.db

# LLM
LLM_PROVIDER=openai
OPENAI_API_KEY=your-key

# Ports
PORT=4000
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000
```

---

## Database Management

### Prisma Commands

```bash
cd backend

# Generate Prisma Client
npx prisma generate

# Push schema changes
npx prisma db push

# Create migration
npx prisma migrate dev --name migration_name

# View database in Prisma Studio
npx prisma studio
```

### Database Location

- **Docker:** `/app/data/app.db`
- **Local:** `./data/app.db`

### Reset Database

```bash
# Stop application
docker-compose down

# Remove database
rm -rf ./data/app.db

# Restart (database will be recreated)
docker-compose up
```

---

## Backup & Restore

### Create Backup

#### Using Docker

```bash
docker-compose exec app npm run backup
```

#### Local Development

```bash
cd backend
npm run backup
```

**Output:**
```
✅ Backup completed successfully!
📁 Backup location: /path/to/backups/backup-2024-11-10T12-00-00
📊 Statistics:
   - Videos: 50
   - Categories: 5
   - Total Size: 15.3 MB
```

Backups are stored in `./backups/backup-YYYY-MM-DDTHH-MM-SS/`

### Restore from Backup

#### Using Docker

```bash
docker-compose exec app npm run restore
```

#### Local Development

```bash
cd backend
npm run restore
```

Follow the interactive prompts:
```
Available backups:
1. backup-2024-11-10T12-00-00
   Date: 11/10/2024, 12:00:00 PM
   Videos: 50 | Categories: 5

Select backup number to restore: 1
⚠️  This will replace all current data. Continue? (yes/no): yes
```

### Automated Backups

The backup script automatically:
- Keeps the last 10 backups
- Deletes older backups automatically
- Creates both database file and JSON export

**Recommended:** Set up a cron job for regular backups:

```bash
# Add to crontab: Daily backup at 2 AM
0 2 * * * cd /path/to/app && docker-compose exec -T app npm run backup
```

---

## Monitoring

### Health Check

```bash
curl http://localhost:4000/api/monitoring/health
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 3600,
  "database": {
    "status": "healthy",
    "videoCount": 100
  },
  "performance": {
    "performanceScore": 97.5,
    "meetsRequirement": true
  }
}
```

### Performance Monitoring

Access monitoring dashboard:
```
http://localhost:4000/api/monitoring/dashboard
```

### Key Metrics

- **Performance Score:** Should be ≥ 95% (per PRD requirement)
- **Average Response Time:** Should be < 2 seconds
- **Memory Usage:** Should be < 2GB
- **Error Rate:** Should be minimal

### View Logs

```bash
# All logs
docker-compose logs -f

# Backend only
docker-compose logs -f app

# Last 100 lines
docker-compose logs --tail=100

# Follow new logs
docker-compose logs -f --tail=0
```

---

## Troubleshooting

### Container Won't Start

**Issue:** Port already in use

```bash
# Check what's using the port
lsof -i :3000
lsof -i :4000

# Kill the process or change ports in .env
```

**Issue:** Database locked

```bash
# Stop all containers
docker-compose down

# Remove volumes
docker-compose down -v

# Restart
docker-compose up
```

### Videos Won't Process

**Issue:** No transcription available

- Not all YouTube videos have captions
- Try a different video with captions enabled

**Issue:** Summary generation fails

- Check LLM provider configuration
- Verify API key is valid
- Check API quotas/limits

### Slow Performance

**Check Performance Score:**
```bash
curl http://localhost:4000/api/monitoring/performance
```

**If < 95%:**
- Check slow request log
- Reduce concurrent video processing
- Increase container resources

**Memory Issues:**
```bash
# Check memory usage
docker stats

# Increase Docker memory limit in Docker Desktop settings
```

### Database Errors

**Prisma Client not generated:**
```bash
docker-compose exec app npx prisma generate
docker-compose restart
```

**Schema out of sync:**
```bash
docker-compose exec app npx prisma db push
```

### Frontend Issues

**404 errors:**
- Clear Next.js cache: Delete `frontend/.next`
- Rebuild: `docker-compose up --build`

**API connection errors:**
- Check `NEXT_PUBLIC_BACKEND_URL` in frontend `.env`
- Ensure backend is running: `curl http://localhost:4000/api/health`

---

## Production Recommendations

### 1. Security

- [ ] Change default ports
- [ ] Add authentication layer (not included by default)
- [ ] Use HTTPS with reverse proxy (nginx/Traefik)
- [ ] Set strong environment variable values
- [ ] Restrict network access to localhost only

### 2. Performance

- [ ] Increase Docker memory to 4GB
- [ ] Enable Docker resource limits in `docker-compose.yml`
- [ ] Set up monitoring alerts
- [ ] Configure log rotation

### 3. Reliability

- [ ] Set up automated backups (cron job)
- [ ] Monitor disk space
- [ ] Set up health check monitoring
- [ ] Configure restart policies

### 4. Scalability

Current limits (single Docker container):
- **Videos:** Tested up to 1,000
- **Concurrent Users:** 1 (personal use)
- **Database Size:** ~10MB per hour of video content

For larger deployments:
- Use PostgreSQL instead of SQLite
- Separate frontend/backend containers
- Add Redis for caching
- Implement proper vector database for RAG

---

## Maintenance

### Weekly

- Check disk space: `df -h`
- Review error logs: Check `/api/monitoring/errors`
- Verify backups exist: `ls -la ./backups`

### Monthly

- Update dependencies: `docker-compose pull && docker-compose up --build`
- Review performance: Check `/api/monitoring/performance`
- Clean old backups manually if needed

### As Needed

- Update API keys before expiration
- Increase storage if nearing capacity
- Review and optimize slow endpoints

---

## Getting Help

### Check Logs First

```bash
# View all logs
docker-compose logs -f

# Search for errors
docker-compose logs | grep -i error
```

### Verify Configuration

```bash
# Check environment
docker-compose exec app env | grep -E '(LLM|DATABASE)'

# Test database
docker-compose exec app npx prisma studio
```

### Reset Everything

```bash
# Nuclear option - complete reset
docker-compose down -v
rm -rf ./data ./backups
docker-compose up --build
```

---

## Quick Reference

### Common Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Logs
docker-compose logs -f

# Backup
docker-compose exec app npm run backup

# Health Check
curl http://localhost:4000/api/monitoring/health
```

### Important URLs

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000
- **Health Check:** http://localhost:4000/api/monitoring/health
- **API Docs:** See `API-DOCUMENTATION.md`

### File Locations

- **Database:** `./data/app.db`
- **Backups:** `./backups/`
- **Logs:** `docker-compose logs`
- **Config:** `.env`

---

**For detailed API documentation, see `API-DOCUMENTATION.md`**

**Questions? Issues? Check the troubleshooting section above!**
