import { Router } from 'express';
import { z } from 'zod';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { loadProject, requireProjectAdmin } from '../middleware/projectAccess.js';
import { ApiError } from '../utils/ApiError.js';
import taskRoutes from './projectTasks.js';

const router = Router();

router.use(requireAuth);

const createProjectSchema = z.object({
  name: z.string().min(1).max(120),
  description: z.string().max(2000).optional().default(''),
});

const updateProjectSchema = createProjectSchema.partial();

const addMemberSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member']).default('member'),
});

const updateMemberSchema = z.object({
  role: z.enum(['admin', 'member']),
});

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    })
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .sort('-updatedAt');
    res.json({ projects });
  }),
);

router.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await Project.create({
      ...req.body,
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });
    await project.populate('owner', 'name email');
    await project.populate('members.user', 'name email');
    res.status(201).json({ project });
  }),
);

router.get(
  '/:projectId',
  loadProject(),
  asyncHandler(async (req, res) => {
    await req.project.populate('owner', 'name email');
    await req.project.populate('members.user', 'name email');
    res.json({ project: req.project, role: req.projectRole });
  }),
);

router.patch(
  '/:projectId',
  loadProject(),
  requireProjectAdmin,
  validate(updateProjectSchema),
  asyncHandler(async (req, res) => {
    Object.assign(req.project, req.body);
    await req.project.save();
    await req.project.populate('owner', 'name email');
    await req.project.populate('members.user', 'name email');
    res.json({ project: req.project });
  }),
);

router.delete(
  '/:projectId',
  loadProject(),
  requireProjectAdmin,
  asyncHandler(async (req, res) => {
    await Task.deleteMany({ project: req.project._id });
    await req.project.deleteOne();
    res.json({ ok: true });
  }),
);

router.post(
  '/:projectId/members',
  loadProject(),
  requireProjectAdmin,
  validate(addMemberSchema),
  asyncHandler(async (req, res) => {
    const { email, role } = req.body;
    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, 'User with that email not found', 'USER_NOT_FOUND');
    if (req.project.getMemberRole(user._id)) {
      throw new ApiError(409, 'User is already a member', 'ALREADY_MEMBER');
    }
    req.project.members.push({ user: user._id, role });
    await req.project.save();
    await req.project.populate('owner', 'name email');
    await req.project.populate('members.user', 'name email');
    res.status(201).json({ project: req.project });
  }),
);

router.patch(
  '/:projectId/members/:userId',
  loadProject(),
  requireProjectAdmin,
  validate(updateMemberSchema),
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (req.project.owner.toString() === userId) {
      throw new ApiError(400, "Cannot change the owner's role", 'OWNER_ROLE');
    }
    const m = req.project.members.find((mm) => mm.user.toString() === userId);
    if (!m) throw new ApiError(404, 'Member not found', 'MEMBER_NOT_FOUND');
    m.role = req.body.role;
    await req.project.save();
    await req.project.populate('owner', 'name email');
    await req.project.populate('members.user', 'name email');
    res.json({ project: req.project });
  }),
);

router.delete(
  '/:projectId/members/:userId',
  loadProject(),
  requireProjectAdmin,
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (req.project.owner.toString() === userId) {
      throw new ApiError(400, 'Cannot remove the owner', 'OWNER_REMOVE');
    }
    req.project.members = req.project.members.filter((mm) => mm.user.toString() !== userId);
    await req.project.save();
    await Task.updateMany(
      { project: req.project._id, assignee: userId },
      { $set: { assignee: null } },
    );
    await req.project.populate('owner', 'name email');
    await req.project.populate('members.user', 'name email');
    res.json({ project: req.project });
  }),
);

router.use('/:projectId/tasks', taskRoutes);

export default router;
