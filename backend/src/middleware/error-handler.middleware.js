/**
 * Centralized Error Handler Middleware
 * Logs errors and provides consistent error responses
 */

const errorLog = [];
const MAX_ERROR_LOG_SIZE = 500;

class AppError extends Error {
  constructor(message, statusCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const error = {
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    details: err.details || null
  };

  // Log error
  console.error('❌ ERROR:', {
    message: error.message,
    statusCode: error.statusCode,
    path: error.path,
    method: error.method,
    timestamp: error.timestamp
  });

  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', err.stack);
  }

  // Store in error log
  errorLog.push(error);
  if (errorLog.length > MAX_ERROR_LOG_SIZE) {
    errorLog.shift();
  }

  // Send response
  res.status(error.statusCode).json({
    error: {
      message: error.message,
      statusCode: error.statusCode,
      timestamp: error.timestamp,
      path: error.path,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      ...(error.details && { details: error.details })
    }
  });
};

const getErrorLog = (limit = 50) => {
  return errorLog.slice(-limit).reverse();
};

const getErrorStats = () => {
  const now = Date.now();
  const oneHourAgo = now - (60 * 60 * 1000);
  const oneDayAgo = now - (24 * 60 * 60 * 1000);

  const recentErrors = errorLog.filter(
    e => new Date(e.timestamp).getTime() > oneHourAgo
  );

  const last24HoursErrors = errorLog.filter(
    e => new Date(e.timestamp).getTime() > oneDayAgo
  );

  // Group by status code
  const errorsByStatus = {};
  errorLog.forEach(e => {
    if (!errorsByStatus[e.statusCode]) {
      errorsByStatus[e.statusCode] = 0;
    }
    errorsByStatus[e.statusCode]++;
  });

  // Group by endpoint
  const errorsByEndpoint = {};
  errorLog.forEach(e => {
    const endpoint = `${e.method} ${e.path}`;
    if (!errorsByEndpoint[endpoint]) {
      errorsByEndpoint[endpoint] = 0;
    }
    errorsByEndpoint[endpoint]++;
  });

  return {
    totalErrors: errorLog.length,
    last1Hour: recentErrors.length,
    last24Hours: last24HoursErrors.length,
    byStatusCode: errorsByStatus,
    byEndpoint: Object.entries(errorsByEndpoint)
      .map(([endpoint, count]) => ({ endpoint, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10),
    recentErrors: errorLog.slice(-10).reverse()
  };
};

const clearErrorLog = () => {
  errorLog.length = 0;
};

module.exports = {
  AppError,
  errorHandler,
  getErrorLog,
  getErrorStats,
  clearErrorLog
};
