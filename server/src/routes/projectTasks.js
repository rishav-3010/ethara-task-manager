import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { loadProject } from '../middleware/projectAccess.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router({ mergeParams: true });

const createTaskSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional().default(''),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

router.use(loadProject());

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { status, assignee, overdue } = req.query;
    const filter = { project: req.project._id };
    if (status) filter.status = status;
    if (assignee) filter.assignee = assignee;
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'done' };
    }
    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    res.json({ tasks });
  }),
);

router.post(
  '/',
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const { assignee, ...rest } = req.body;
    if (assignee && !req.project.getMemberRole(assignee)) {
      throw new ApiError(400, 'Assignee must be a project member', 'INVALID_ASSIGNEE');
    }
    const task = await Task.create({
      ...rest,
      assignee: assignee || null,
      project: req.project._id,
      createdBy: req.user._id,
    });
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    res.status(201).json({ task });
  }),
);

export default router;
