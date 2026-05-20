import { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function Modal({ open, onClose, title, description, children, className }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl',
          className,
        )}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700"
          aria-label="Close"
        >
          <X size={18} />
        </button>
        {title ? <h2 className="mb-1 text-lg font-semibold">{title}</h2> : null}
        {description ? <p className="mb-4 text-sm text-slate-500">{description}</p> : null}
        {children}
      </div>
    </div>
  );
}
