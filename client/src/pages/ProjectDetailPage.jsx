import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Select } from '../components/ui/Input.jsx';
import { TaskCard } from '../components/TaskCard.jsx';
import { TaskFormModal } from '../components/TaskFormModal.jsx';
import { MembersPanel } from '../components/MembersPanel.jsx';

const COLUMNS = [
  { id: 'todo', label: 'To Do' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

export function ProjectDetailPage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [role, setRole] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState('');
  const [taskModal, setTaskModal] = useState({ open: false, initial: null });

  const loadProject = async () => {
    try {
      const { project, role } = await api.get(`/api/projects/${projectId}`);
      setProject(project);
      setRole(role);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadTasks = async () => {
    try {
      const { tasks } = await api.get(`/api/projects/${projectId}/tasks`);
      setTasks(tasks);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadProject();
    loadTasks();
  }, [projectId]);

  const handleCreateTask = async (payload) => {
    await api.post(`/api/projects/${projectId}/tasks`, payload);
    loadTasks();
  };

  const handleUpdateTask = async (payload) => {
    await api.patch(`/api/tasks/${taskModal.initial._id}`, payload);
    loadTasks();
  };

  const handleStatusChange = async (task, status) => {
    try {
      await api.patch(`/api/tasks/${task._id}`, { status });
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (task) => {
    if (!confirm(`Delete task "${task.title}"?`)) return;
    try {
      await api.del(`/api/tasks/${task._id}`);
      loadTasks();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await api.del(`/api/projects/${projectId}`);
      navigate('/projects');
    } catch (err) {
      alert(err.message);
    }
  };

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!project) return <div className="p-6 text-slate-500">Loading project...</div>;

  const isAdmin = role === 'admin';

  const canModifyTask = (task) =>
    isAdmin ||
    task.createdBy._id === user._id ||
    (task.assignee && task.assignee._id === user._id);

  const canDeleteTask = (task) => isAdmin || task.createdBy._id === user._id;

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{project.name}</h1>
          {project.description ? (
            <p className="mt-1 max-w-2xl text-sm text-slate-600">{project.description}</p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setTaskModal({ open: true, initial: null })}>
            <Plus size={16} /> New Task
          </Button>
          {isAdmin ? (
            <Button variant="destructive" onClick={handleDeleteProject}>
              <Trash2 size={16} /> Delete
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="grid gap-4 md:grid-cols-3">
          {COLUMNS.map((col) => {
            const colTasks = tasks.filter((t) => t.status === col.id);
            return (
              <div key={col.id} className="rounded-lg bg-slate-100 p-3">
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold">{col.label}</h2>
                  <span className="text-xs text-slate-500">{colTasks.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {colTasks.length === 0 ? (
                    <p className="px-1 py-4 text-xs text-slate-400">No tasks</p>
                  ) : (
                    colTasks.map((t) => (
                      <div key={t._id} className="flex flex-col gap-1">
                        <TaskCard
                          task={t}
                          onEdit={(task) => setTaskModal({ open: true, initial: task })}
                          onDelete={handleDeleteTask}
                          canDelete={canDeleteTask(t)}
                        />
                        {canModifyTask(t) ? (
                          <Select
                            className="h-7 text-xs"
                            value={t.status}
                            onChange={(e) => handleStatusChange(t, e.target.value)}
                          >
                            <option value="todo">Move to: To Do</option>
                            <option value="in_progress">Move to: In Progress</option>
                            <option value="done">Move to: Done</option>
                          </Select>
                        ) : null}
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <MembersPanel project={project} role={role} onChange={setProject} />
      </div>

      <TaskFormModal
        open={taskModal.open}
        initial={taskModal.initial}
        members={project.members}
        onClose={() => setTaskModal({ open: false, initial: null })}
        onSubmit={taskModal.initial ? handleUpdateTask : handleCreateTask}
      />
    </div>
  );
}
