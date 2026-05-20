import { ApiError } from '../utils/ApiError.js';

export function notFound(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}

export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  if (err.name === 'ValidationError') {
    status = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'CastError') {
    status = 400;
    code = 'INVALID_ID';
    message = 'Invalid id';
  } else if (err.code === 11000) {
    status = 409;
    code = 'DUPLICATE';
    message = 'Duplicate value';
  }

  if (status >= 500) console.error(err);

  res.status(status).json({ error: { message, code } });
}
