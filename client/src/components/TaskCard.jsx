import { Trash2, Pencil, CalendarDays } from 'lucide-react';
import { Badge } from './ui/Badge.jsx';
import { Button } from './ui/Button.jsx';
import { formatDate, isOverdue } from '../lib/utils.js';

export function TaskCard({ task, onEdit, onDelete, canDelete }) {
  const overdue = isOverdue(task);
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug">{task.title}</p>
        <div className="flex shrink-0 gap-0.5">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
            <Pencil size={13} />
          </Button>
          {canDelete ? (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-600"
              onClick={() => onDelete(task)}
            >
              <Trash2 size={13} />
            </Button>
          ) : null}
        </div>
      </div>
      {task.description ? (
        <p className="mt-1 line-clamp-2 text-xs text-slate-500">{task.description}</p>
      ) : null}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge variant={task.priority}>{task.priority}</Badge>
        {task.dueDate ? (
          <span
            className={`inline-flex items-center gap-1 text-xs ${
              overdue ? 'text-red-600' : 'text-slate-500'
            }`}
          >
            <CalendarDays size={12} /> {formatDate(task.dueDate)}
          </span>
        ) : null}
        {task.assignee ? (
          <span className="ml-auto text-xs text-slate-500">{task.assignee.name}</span>
        ) : (
          <span className="ml-auto text-xs text-slate-400">Unassigned</span>
        )}
      </div>
    </div>
  );
}
