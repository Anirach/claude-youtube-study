const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { getPerformanceStats, resetStats } = require('../middleware/performance.middleware');
const { getErrorStats, getErrorLog, clearErrorLog } = require('../middleware/error-handler.middleware');

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/monitoring/health - Comprehensive health check
 */
router.get('/health', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = 'healthy';
    const dbResponseTime = Date.now() - startTime;

    // Get system info
    const memoryUsage = process.memoryUsage();
    const uptime = process.uptime();

    // Get performance stats
    const perfStats = getPerformanceStats();

    // Get video count
    const videoCount = await prisma.video.count();
    const categoryCount = await prisma.category.count();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: Math.round(uptime),
      uptimeFormatted: formatUptime(uptime),
      database: {
        status: dbStatus,
        responseTime: dbResponseTime,
        videoCount,
        categoryCount
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        unit: 'MB',
        withinLimit: memoryUsage.heapUsed < (2 * 1024 * 1024 * 1024) // < 2GB per PRD
      },
      performance: {
        averageResponseTime: perfStats.averageResponseTime,
        totalRequests: perfStats.totalRequests,
        performanceScore: perfStats.performanceScore,
        meetsRequirement: perfStats.meetsRequirement
      },
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

/**
 * GET /api/monitoring/performance - Performance metrics
 */
router.get('/performance', (req, res) => {
  const stats = getPerformanceStats();
  res.json(stats);
});

/**
 * POST /api/monitoring/performance/reset - Reset performance stats
 */
router.post('/performance/reset', (req, res) => {
  resetStats();
  res.json({ message: 'Performance stats reset successfully' });
});

/**
 * GET /api/monitoring/errors - Error statistics
 */
router.get('/errors', (req, res) => {
  const stats = getErrorStats();
  res.json(stats);
});

/**
 * GET /api/monitoring/errors/log - Recent error log
 */
router.get('/errors/log', (req, res) => {
  const { limit = 50 } = req.query;
  const log = getErrorLog(parseInt(limit));
  res.json({
    count: log.length,
    errors: log
  });
});

/**
 * POST /api/monitoring/errors/clear - Clear error log
 */
router.post('/errors/clear', (req, res) => {
  clearErrorLog();
  res.json({ message: 'Error log cleared successfully' });
});

/**
 * GET /api/monitoring/system - System information
 */
router.get('/system', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();

    // Database stats
    const videoCount = await prisma.video.count();
    const categoryCount = await prisma.category.count();
    const chatSessionCount = await prisma.chatSession.count();

    // Calculate database size (approximate)
    const videos = await prisma.video.findMany({
      select: {
        transcription: true,
        summaryJson: true
      }
    });

    let dbSize = 0;
    videos.forEach(v => {
      dbSize += (v.transcription?.length || 0);
      dbSize += (v.summaryJson?.length || 0);
    });

    const system = {
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      },
      memory: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
        unit: 'MB'
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system
      },
      database: {
        videos: videoCount,
        categories: categoryCount,
        chatSessions: chatSessionCount,
        approximateSize: Math.round(dbSize / 1024 / 1024),
        unit: 'MB'
      }
    };

    res.json(system);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/monitoring/dashboard - Monitoring dashboard data
 */
router.get('/dashboard', async (req, res) => {
  try {
    const perfStats = getPerformanceStats();
    const errorStats = getErrorStats();
    const memoryUsage = process.memoryUsage();

    const dashboard = {
      overview: {
        status: 'healthy',
        uptime: formatUptime(process.uptime()),
        requests: perfStats.totalRequests,
        errors: errorStats.totalErrors,
        performanceScore: perfStats.performanceScore
      },
      performance: {
        avgResponseTime: perfStats.averageResponseTime,
        slowRequests: perfStats.slowRequestCount,
        topSlowEndpoints: perfStats.byEndpoint.slice(0, 5)
      },
      errors: {
        last1Hour: errorStats.last1Hour,
        last24Hours: errorStats.last24Hours,
        topErrorEndpoints: errorStats.byEndpoint.slice(0, 5)
      },
      resources: {
        memoryUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        memoryLimitMB: 2048,
        memoryPercentage: Math.round((memoryUsage.heapUsed / (2 * 1024 * 1024 * 1024)) * 100)
      }
    };

    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);

  return parts.join(' ');
}

module.exports = router;
