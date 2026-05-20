import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTodo, Loader2, CheckCircle2, AlertTriangle, FolderKanban } from 'lucide-react';
import { api } from '../lib/api.js';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { formatDate, isOverdue } from '../lib/utils.js';

const STAT_META = [
  { key: 'projectCount', label: 'Projects', icon: FolderKanban, color: 'text-slate-700' },
  { key: 'todo', label: 'To Do', icon: ListTodo, color: 'text-slate-700' },
  { key: 'in_progress', label: 'In Progress', icon: Loader2, color: 'text-blue-600' },
  { key: 'done', label: 'Done', icon: CheckCircle2, color: 'text-green-600' },
  { key: 'overdueCount', label: 'Overdue', icon: AlertTriangle, color: 'text-red-600' },
];

export function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .get('/api/dashboard')
      .then(setData)
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!data) return <div className="p-6 text-slate-500">Loading dashboard...</div>;

  const values = {
    projectCount: data.projectCount,
    todo: data.statusCounts.todo,
    in_progress: data.statusCounts.in_progress,
    done: data.statusCounts.done,
    overdueCount: data.overdueCount,
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-semibold">Dashboard</h1>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {STAT_META.map(({ key, label, icon: Icon, color }) => (
          <Card key={key}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-slate-500">{label}</p>
                <p className="mt-1 text-2xl font-semibold">{values[key]}</p>
              </div>
              <Icon className={color} size={24} />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {data.myTasks.length === 0 ? (
              <p className="text-sm text-slate-500">No tasks assigned to you.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {data.myTasks.map((t) => (
                  <li key={t._id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/projects/${t.project?._id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {t.title}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {t.project?.name}
                        {t.dueDate ? ` · due ${formatDate(t.dueDate)}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOverdue(t) ? <Badge variant="danger">Overdue</Badge> : null}
                      <Badge variant={t.status}>{t.status.replace('_', ' ')}</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentTasks.length === 0 ? (
              <p className="text-sm text-slate-500">No recent tasks.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-slate-100">
                {data.recentTasks.map((t) => (
                  <li key={t._id} className="flex items-center justify-between py-3">
                    <div className="min-w-0">
                      <Link
                        to={`/projects/${t.project?._id}`}
                        className="block truncate font-medium hover:underline"
                      >
                        {t.title}
                      </Link>
                      <p className="truncate text-xs text-slate-500">
                        {t.project?.name}
                        {t.assignee ? ` · ${t.assignee.name}` : ''}
                      </p>
                    </div>
                    <Badge variant={t.status}>{t.status.replace('_', ' ')}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
