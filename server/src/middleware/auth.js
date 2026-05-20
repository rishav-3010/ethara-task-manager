import { verifyToken } from '../utils/jwt.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/User.js';

export async function requireAuth(req, _res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) return next(new ApiError(401, 'Not authenticated', 'UNAUTHENTICATED'));
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);
    if (!user) return next(new ApiError(401, 'User no longer exists', 'UNAUTHENTICATED'));
    req.user = user;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token', 'UNAUTHENTICATED'));
  }
}
