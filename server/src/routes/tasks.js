import { Router } from 'express';
import { z } from 'zod';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validate } from '../middleware/validate.js';
import { requireAuth } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';

const router = Router();
router.use(requireAuth);

const updateTaskSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  status: z.enum(['todo', 'in_progress', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  assignee: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

async function loadTaskAndProject(req, _res, next) {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return next(new ApiError(404, 'Task not found', 'TASK_NOT_FOUND'));
    const project = await Project.findById(task.project);
    if (!project) return next(new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND'));
    const role = project.getMemberRole(req.user._id);
    if (!role) return next(new ApiError(403, 'Not a member of this project', 'FORBIDDEN'));
    req.task = task;
    req.project = project;
    req.projectRole = role;
    next();
  } catch (err) {
    next(err);
  }
}

router.patch(
  '/:taskId',
  loadTaskAndProject,
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const isAdmin = req.projectRole === 'admin';
    const isCreator = req.task.createdBy.toString() === req.user._id.toString();
    const isAssignee =
      req.task.assignee && req.task.assignee.toString() === req.user._id.toString();

    const updates = req.body;
    const keys = Object.keys(updates);
    const onlyStatus = keys.length === 1 && keys[0] === 'status';

    if (!isAdmin && !isCreator) {
      if (!(isAssignee && onlyStatus)) {
        throw new ApiError(403, 'Insufficient permission to edit this task', 'FORBIDDEN');
      }
    }

    if (updates.assignee !== undefined) {
      if (updates.assignee && !req.project.getMemberRole(updates.assignee)) {
        throw new ApiError(400, 'Assignee must be a project member', 'INVALID_ASSIGNEE');
      }
    }

    Object.assign(req.task, updates);
    await req.task.save();
    await req.task.populate('assignee', 'name email');
    await req.task.populate('createdBy', 'name email');
    res.json({ task: req.task });
  }),
);

router.delete(
  '/:taskId',
  loadTaskAndProject,
  asyncHandler(async (req, res) => {
    const isAdmin = req.projectRole === 'admin';
    const isCreator = req.task.createdBy.toString() === req.user._id.toString();
    if (!isAdmin && !isCreator) {
      throw new ApiError(403, 'Insufficient permission to delete this task', 'FORBIDDEN');
    }
    await req.task.deleteOne();
    res.json({ ok: true });
  }),
);

export default router;
