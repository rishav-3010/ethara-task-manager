import { Project } from '../models/Project.js';
import { ApiError } from '../utils/ApiError.js';

export const loadProject = (paramName = 'projectId') =>
  async (req, _res, next) => {
    try {
      const id = req.params[paramName];
      const project = await Project.findById(id);
      if (!project) return next(new ApiError(404, 'Project not found', 'PROJECT_NOT_FOUND'));
      const role = project.getMemberRole(req.user._id);
      if (!role) return next(new ApiError(403, 'Not a member of this project', 'FORBIDDEN'));
      req.project = project;
      req.projectRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };

export function requireProjectAdmin(req, _res, next) {
  if (req.projectRole !== 'admin') {
    return next(new ApiError(403, 'Admin role required', 'FORBIDDEN'));
  }
  next();
}
