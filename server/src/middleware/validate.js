import { ZodError } from 'zod';
import { AppError } from './errorHandler.js';

export const validateBody = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Validation failed', 422, details));
    }
    next(err);
  }
};

export const validateQuery = (schema) => (req, res, next) => {
  try {
    req.query = schema.parse(req.query);
    next();
  } catch (err) {
    if (err instanceof ZodError) {
      const details = err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      }));
      return next(new AppError('Invalid query parameters', 422, details));
    }
    next(err);
  }
};
