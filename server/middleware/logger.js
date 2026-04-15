const morgan = require('morgan');

// Custom token: adds request body for POST/PUT (dev only)
morgan.token('body', (req) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const body = { ...req.body };
    if (body.password) body.password = '***'; // mask password
    return JSON.stringify(body);
  }
  return '';
});

const format =
  process.env.NODE_ENV === 'production'
    ? 'combined'
    : ':method :url :status :response-time ms - :res[content-length] :body';

const logger = morgan(format);

module.exports = { logger };
