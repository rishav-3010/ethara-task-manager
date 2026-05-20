import { Router } from 'express';
import { Project } from '../models/Project.js';
import { Task } from '../models/Task.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const projects = await Project.find({
      $or: [{ owner: userId }, { 'members.user': userId }],
    }).select('_id name');
    const projectIds = projects.map((p) => p._id);

    const [byStatus, overdueCount, myTasks, recentTasks] = await Promise.all([
      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),
      Task.find({ assignee: userId, status: { $ne: 'done' } })
        .populate('project', 'name')
        .sort('dueDate')
        .limit(20),
      Task.find({ project: { $in: projectIds } })
        .populate('project', 'name')
        .populate('assignee', 'name email')
        .sort('-updatedAt')
        .limit(10),
    ]);

    const statusCounts = { todo: 0, in_progress: 0, done: 0 };
    byStatus.forEach((s) => {
      statusCounts[s._id] = s.count;
    });

    res.json({
      projectCount: projects.length,
      statusCounts,
      overdueCount,
      myTasks,
      recentTasks,
    });
  }),
);

export default router;
