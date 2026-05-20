import { useState } from 'react';
import { UserPlus, Trash2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { Button } from './ui/Button.jsx';
import { Input, Label, Select } from './ui/Input.jsx';
import { Badge } from './ui/Badge.jsx';
import { Modal } from './ui/Modal.jsx';

export function MembersPanel({ project, role, onChange }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [memberRole, setMemberRole] = useState('member');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = role === 'admin';

  const addMember = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const { project: updated } = await api.post(`/api/projects/${project._id}/members`, {
        email,
        role: memberRole,
      });
      onChange(updated);
      setEmail('');
      setMemberRole('member');
      setOpen(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member?')) return;
    try {
      const { project: updated } = await api.del(
        `/api/projects/${project._id}/members/${userId}`,
      );
      onChange(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const changeRole = async (userId, newRole) => {
    try {
      const { project: updated } = await api.patch(
        `/api/projects/${project._id}/members/${userId}`,
        { role: newRole },
      );
      onChange(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Members ({project.members.length})</h3>
        {isAdmin ? (
          <Button size="sm" onClick={() => setOpen(true)}>
            <UserPlus size={14} /> Add
          </Button>
        ) : null}
      </div>
      <ul className="flex flex-col gap-2">
        {project.members.map((m) => {
          const isOwner = project.owner._id === m.user._id;
          return (
            <li
              key={m.user._id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {m.user.name} {isOwner ? <span className="text-xs text-slate-400">(owner)</span> : null}
                </p>
                <p className="truncate text-xs text-slate-500">{m.user.email}</p>
              </div>
              <div className="flex items-center gap-2">
                {isAdmin && !isOwner ? (
                  <Select
                    className="h-7 w-24 text-xs"
                    value={m.role}
                    onChange={(e) => changeRole(m.user._id, e.target.value)}
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </Select>
                ) : (
                  <Badge variant={m.role}>{m.role}</Badge>
                )}
                {isAdmin && !isOwner ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-600"
                    onClick={() => removeMember(m.user._id)}
                  >
                    <Trash2 size={13} />
                  </Button>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <Modal open={open} onClose={() => setOpen(false)} title="Add Member">
        <form onSubmit={addMember} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="m-email">Email</Label>
            <Input
              id="m-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>Role</Label>
            <Select value={memberRole} onChange={(e) => setMemberRole(e.target.value)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </Select>
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={busy}>
              {busy ? 'Adding...' : 'Add member'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
