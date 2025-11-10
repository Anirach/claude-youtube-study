/**
 * Performance Monitoring Middleware
 * Tracks response times and logs slow operations
 */

const performanceStats = {
  requests: 0,
  totalResponseTime: 0,
  slowRequests: [],
  errorCount: 0,
  byEndpoint: {}
};

const performanceMonitor = (req, res, next) => {
  const startTime = Date.now();

  // Store original end function
  const originalEnd = res.end;

  // Override end function to track timing
  res.end = function(...args) {
    const duration = Date.now() - startTime;

    // Update statistics
    performanceStats.requests++;
    performanceStats.totalResponseTime += duration;

    const endpoint = `${req.method} ${req.path}`;

    if (!performanceStats.byEndpoint[endpoint]) {
      performanceStats.byEndpoint[endpoint] = {
        count: 0,
        totalTime: 0,
        avgTime: 0,
        maxTime: 0,
        minTime: Infinity
      };
    }

    const endpointStats = performanceStats.byEndpoint[endpoint];
    endpointStats.count++;
    endpointStats.totalTime += duration;
    endpointStats.avgTime = endpointStats.totalTime / endpointStats.count;
    endpointStats.maxTime = Math.max(endpointStats.maxTime, duration);
    endpointStats.minTime = Math.min(endpointStats.minTime, duration);

    // Log slow requests (> 2 seconds as per PRD requirement)
    if (duration > 2000) {
      const slowRequest = {
        endpoint,
        duration,
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        query: req.query,
        statusCode: res.statusCode
      };

      performanceStats.slowRequests.push(slowRequest);

      // Keep only last 100 slow requests
      if (performanceStats.slowRequests.length > 100) {
        performanceStats.slowRequests.shift();
      }

      console.warn(`⚠️  SLOW REQUEST: ${endpoint} took ${duration}ms`);
    }

    // Log request
    const statusColor = res.statusCode >= 500 ? '\x1b[31m' :
                       res.statusCode >= 400 ? '\x1b[33m' :
                       '\x1b[32m';
    const resetColor = '\x1b[0m';

    console.log(
      `${statusColor}${res.statusCode}${resetColor} ${req.method} ${req.path} - ${duration}ms`
    );

    // Track errors
    if (res.statusCode >= 500) {
      performanceStats.errorCount++;
    }

    // Call original end
    originalEnd.apply(res, args);
  };

  next();
};

const getPerformanceStats = () => {
  const avgResponseTime = performanceStats.requests > 0
    ? performanceStats.totalResponseTime / performanceStats.requests
    : 0;

  // Calculate percentage of requests meeting < 2s requirement
  const fastRequests = performanceStats.requests - performanceStats.slowRequests.length;
  const performanceScore = performanceStats.requests > 0
    ? (fastRequests / performanceStats.requests) * 100
    : 100;

  return {
    totalRequests: performanceStats.requests,
    averageResponseTime: Math.round(avgResponseTime),
    slowRequestCount: performanceStats.slowRequests.length,
    recentSlowRequests: performanceStats.slowRequests.slice(-10),
    errorCount: performanceStats.errorCount,
    performanceScore: Math.round(performanceScore * 100) / 100,
    meetsRequirement: performanceScore >= 95, // PRD: 95% of operations < 2s
    byEndpoint: Object.entries(performanceStats.byEndpoint)
      .map(([endpoint, stats]) => ({
        endpoint,
        ...stats,
        avgTime: Math.round(stats.avgTime)
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
  };
};

const resetStats = () => {
  performanceStats.requests = 0;
  performanceStats.totalResponseTime = 0;
  performanceStats.slowRequests = [];
  performanceStats.errorCount = 0;
  performanceStats.byEndpoint = {};
};

module.exports = {
  performanceMonitor,
  getPerformanceStats,
  resetStats
};
