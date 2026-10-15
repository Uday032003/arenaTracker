export class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const message = err.isOperational || statusCode < 500 ? err.message : 'Internal server error';

  if (process.env.NODE_ENV !== 'test' && statusCode >= 500) {
    console.error('[SERVER ERROR]', err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
      details: err.details || null,
    },
  });
};
