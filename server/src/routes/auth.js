import { Router } from 'express';
import { z } from 'zod';
import { User } from '../models/User.js';
import { signToken, cookieOptions } from '../utils/jwt.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post(
  '/signup',
  validate(signupSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    const existing = await User.findOne({ email });
    if (existing) throw new ApiError(409, 'Email already registered', 'EMAIL_TAKEN');
    const user = new User({ name, email });
    await user.setPassword(password);
    await user.save();
    const token = signToken({ sub: user._id.toString() });
    res.cookie('token', token, cookieOptions());
    res.status(201).json({ user });
  }),
);

router.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    const ok = await user.comparePassword(password);
    if (!ok) throw new ApiError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    const token = signToken({ sub: user._id.toString() });
    res.cookie('token', token, cookieOptions());
    res.json({ user });
  }),
);

router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions());
  res.json({ ok: true });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
