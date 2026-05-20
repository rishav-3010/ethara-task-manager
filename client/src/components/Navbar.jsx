import { Link, useNavigate } from 'react-router-dom';
import { LogOut, LayoutDashboard, FolderKanban } from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';
import { Button } from './ui/Button.jsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link to="/" className="font-semibold">
            Ethara Tasks
          </Link>
          {user ? (
            <nav className="flex items-center gap-1 text-sm">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                <LayoutDashboard size={16} /> Dashboard
              </Link>
              <Link
                to="/projects"
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-slate-700 hover:bg-slate-100"
              >
                <FolderKanban size={16} /> Projects
              </Link>
            </nav>
          ) : null}
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={14} /> Logout
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
