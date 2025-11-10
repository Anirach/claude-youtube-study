# YouTube Study App 📚

A comprehensive knowledge management system for YouTube videos with AI-powered summaries, interactive knowledge graphs, and intelligent chat capabilities.

---

## ✨ Features

- 🎥 **Video Management** - Add, organize, and track YouTube videos
- 🤖 **AI-Powered Summaries** - Multi-level summarization with timestamps
- 🕸️ **Knowledge Graph** - Interactive visualization of video relationships
- 💬 **Intelligent Chat** - RAG-based Q&A across multiple videos
- ⚙️ **Production Ready** - Monitoring, backups, health checks

---

## 🚀 Quick Start

```bash
# 1. Configure environment
cp .env.example .env

# 2. Start with Docker
docker-compose up --build

# 3. Access at http://localhost:3000
```

---

## 📚 Documentation

- **[Setup Guide](SETUP.md)** - Installation and configuration
- **[Deployment Guide](DEPLOYMENT-GUIDE.md)** - Production deployment
- **[API Documentation](API-DOCUMENTATION.md)** - Complete API reference

---

## 🛠️ Tech Stack

**Backend:** Node.js, Express, Prisma, SQLite
**Frontend:** Next.js 14, React, TailwindCSS
**AI/ML:** OpenAI/Gemini/Ollama

---

## 📊 Performance

✅ 95%+ operations < 2 seconds
✅ Memory usage < 2GB
✅ Full monitoring & health checks

```bash
curl http://localhost:4000/api/monitoring/health
```

---

**Made with ❤️ for knowledge enthusiasts**
