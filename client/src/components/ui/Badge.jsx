import { cn } from '../../lib/utils.js';

const variants = {
  default: 'bg-slate-100 text-slate-700',
  todo: 'bg-slate-100 text-slate-700',
  in_progress: 'bg-blue-100 text-blue-700',
  done: 'bg-green-100 text-green-700',
  low: 'bg-slate-100 text-slate-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-red-100 text-red-700',
  danger: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  member: 'bg-slate-100 text-slate-700',
};

export function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        variants[variant] || variants.default,
        className,
      )}
      {...props}
    />
  );
}
