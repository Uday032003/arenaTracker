// Lightweight in-memory rate limiter for authentication endpoints
const rateLimitMap = new Map();

export const rateLimit = ({ windowMs = 15 * 60 * 1000, max = 20, message = 'Too many requests, please try again later' } = {}) => {
  return (req, res, next) => {
    // In test environment, skip rate limiting
    if (process.env.NODE_ENV === 'test') {
      return next();
    }

    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = rateLimitMap.get(ip) || { count: 0, resetTime: now + windowMs };

    if (now > entry.resetTime) {
      entry.count = 1;
      entry.resetTime = now + windowMs;
    } else {
      entry.count += 1;
    }

    rateLimitMap.set(ip, entry);

    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > max) {
      return res.status(429).json({
        success: false,
        error: {
          message,
          statusCode: 429,
        },
      });
    }

    next();
  };
};
