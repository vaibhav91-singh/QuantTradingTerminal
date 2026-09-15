/**
 * Centralized Express Error Handler Middleware
 */
export function errorHandler(err, req, res, next) {
  console.error(`[Express Error] ${req.method} ${req.url}:`, err.stack || err.message);

  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
}
