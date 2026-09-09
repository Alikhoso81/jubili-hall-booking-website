import { useCallback, useEffect, useState } from 'react';
import { Plus, ShieldCheck, Mail, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../lib/auth';
import { Staff } from '../../lib/types';
import { fetchStaffList } from '../../lib/api';
import {
  PERMISSION_GROUPS, PERMISSION_LABELS, ROLE_PRESETS, permissionsForRole, effectivePermissions,
} from '../../lib/permissions';
import { initials } from '../../lib/format';
import { useToast } from '../../lib/useToast';
import { PageHeader, Card, Button, Field, Input, Select, Modal, Loading, Badge, Toast } from '../../components/ui';

interface Invite {
  id: string;
  email: string;
  display_name: string;
  role: string;
  permissions: string[];
}

export default function UsersPage() {
  const { staff: me, refreshStaff } = useAuth();
  const { toast, success, error } = useToast();
  const [members, setMembers] = useState<Staff[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [roleFor, setRoleFor] = useState<Staff | null>(null);

  const isAdmin = me?.role === 'admin';

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [staffList, inviteRes] = await Promise.all([
        fetchStaffList(),
        supabase.from('invites').select('id, email, display_name, role, permissions').order('created_at', { ascending: true }),
      ]);
      setMembers(staffList);
      setInvites((inviteRes.data ?? []) as Invite[]);
    } catch {
      error('Could not load users.');
    }
    setLoading(false);
  }, [error]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleActive = async (m: Staff) => {
    const { error: e } = await supabase.from('staff').update({ is_active: !m.is_active }).eq('id', m.id);
    if (e) error('Could not update member.');
    else {
      success(m.is_active ? 'Member deactivated.' : 'Member activated.');
      if (m.id === me?.id) refreshStaff();
      load();
    }
  };

  const cancelInvite = async (id: string) => {
    await supabase.from('invites').delete().eq('id', id);
    load();
  };

  return (
    <>
      <PageHeader
        eyebrow="Users"
        title="Company users"
        subtitle="Users with the Users permission can add members and assign roles. All members can view this list."
        actions={isAdmin && <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4" /> Add user</Button>}
      />

      <Card padded={false}>
        {loading ? (
          <Loading />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Name', 'Email', 'Role', 'Permissions', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {members.map((m) => {
                  const perms = effectivePermissions(m);
                  return (
                    <tr key={m.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-8 h-8 rounded-full bg-[#0d1b0f] text-[#C9A84C] text-xs font-bold grid place-items-center shrink-0">
                            {initials(m.display_name)}
                          </span>
                          <span className="font-medium text-[#0d1b0f]">{m.display_name}{m.id === me?.id && <span className="text-gray-400 font-normal"> (you)</span>}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{m.email}</td>
                      <td className="px-4 py-3 capitalize text-gray-700">{ROLE_PRESETS[m.role]?.label ?? m.role}</td>
                      <td className="px-4 py-3 max-w-sm">
                        <div className="flex flex-wrap gap-1">
                          {perms.slice(0, 4).map((p) => (
                            <span key={p} className="px-1.5 py-0.5 rounded bg-gray-100 text-[11px] text-gray-500">{PERMISSION_LABELS[p] ?? p}</span>
                          ))}
                          {perms.length > 4 && <span className="px-1.5 py-0.5 text-[11px] text-gray-400">+{perms.length - 4} more</span>}
                          {perms.length === 0 && <span className="text-[11px] text-gray-400">None</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {m.is_active
                          ? <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
                          : <Badge className="bg-gray-100 text-gray-500 border-gray-200">Deactivated</Badge>}
                      </td>
                      <td className="px-4 py-3">
                        {isAdmin ? (
                          <div className="flex gap-2">
                            <button onClick={() => setRoleFor(m)} className="inline-flex items-center gap-1 text-xs font-medium text-[#0d1b0f] border border-gray-200 rounded-lg px-2 py-1 hover:border-[#C9A84C]">
                              <ShieldCheck className="w-3.5 h-3.5" /> Assign role
                            </button>
                            <button
                              onClick={() => toggleActive(m)}
                              className={`text-xs font-medium rounded-lg px-2 py-1 border ${
                                m.is_active ? 'text-amber-700 border-amber-200 hover:bg-amber-50' : 'text-emerald-700 border-emerald-200 hover:bg-emerald-50'
                              }`}
                            >
                              {m.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {invites.map((iv) => (
                  <tr key={iv.id} className="bg-amber-50/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 grid place-items-center shrink-0">
                          <Mail className="w-4 h-4" />
                        </span>
                        <span className="font-medium text-[#0d1b0f]">{iv.display_name || iv.email.split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{iv.email}</td>
                    <td className="px-4 py-3 capitalize text-gray-700">{ROLE_PRESETS[iv.role]?.label ?? iv.role}</td>
                    <td className="px-4 py-3 text-gray-400 text-xs">Applied on sign-up</td>
                    <td className="px-4 py-3">
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">Pending verification</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {isAdmin && (
                        <button onClick={() => cancelInvite(iv.id)} className="text-xs font-medium text-red-600 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50">
                          Cancel invite
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <AddUserModal
        open={addOpen}
        invitedBy={me?.id ?? null}
        onClose={() => setAddOpen(false)}
        onSaved={() => {
          setAddOpen(false);
          success('Invite created. Ask them to sign up with that email.');
          load();
        }}
        onError={error}
      />

      <AssignRoleModal
        member={roleFor}
        onClose={() => setRoleFor(null)}
        onSaved={() => {
          const changedSelf = roleFor?.id === me?.id;
          setRoleFor(null);
          success('Role updated.');
          if (changedSelf) refreshStaff();
          load();
        }}
        onError={error}
      />

      <Toast toast={toast} />
    </>
  );
}

function AddUserModal({
  open,
  invitedBy,
  onClose,
  onSaved,
  onError,
}: {
  open: boolean;
  invitedBy: string | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('booker');
  const [saving, setSaving] = useState(false);
  const signupUrl = `${window.location.origin}/`;

  useEffect(() => {
    if (!open) return;
    setEmail('');
    setName('');
    setRole('booker');
  }, [open]);

  const save = async () => {
    if (!/.+@.+\..+/.test(email.trim())) {
      onError('Enter a valid email.');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('invites').upsert(
      {
        email: email.trim().toLowerCase(),
        display_name: name.trim(),
        role,
        permissions: permissionsForRole(role),
        invited_by: invitedBy,
      },
      { onConflict: 'email' }
    );
    setSaving(false);
    if (error) onError('Could not create the invite.');
    else onSaved();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add user">
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Create an invite, then share the sign-in page. When they sign up with this email they get the role below automatically.
        </p>
        <Field label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="person@example.com" />
        </Field>
        <Field label="Name (optional)">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLE_PRESETS).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
          </Select>
        </Field>
        <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-xs text-gray-500">
          <span className="truncate flex-1">{signupUrl}</span>
          <button
            onClick={() => navigator.clipboard?.writeText(signupUrl)}
            className="inline-flex items-center gap-1 text-[#8a6d24] font-medium shrink-0"
          >
            <Copy className="w-3.5 h-3.5" /> Copy link
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Create invite'}</Button>
        </div>
      </div>
    </Modal>
  );
}

function AssignRoleModal({
  member,
  onClose,
  onSaved,
  onError,
}: {
  member: Staff | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (m: string) => void;
}) {
  const [role, setRole] = useState('booker');
  const [perms, setPerms] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!member) return;
    setRole(member.role);
    setPerms(effectivePermissions(member));
  }, [member]);

  const applyRole = (r: string) => {
    setRole(r);
    setPerms(r === 'admin' ? [] : permissionsForRole(r));
  };

  const toggle = (key: string) =>
    setPerms((p) => (p.includes(key) ? p.filter((x) => x !== key) : [...p, key]));

  const save = async () => {
    if (!member) return;
    setSaving(true);
    const { error } = await supabase
      .from('staff')
      .update({ role, permissions: role === 'admin' ? [] : perms })
      .eq('id', member.id);
    setSaving(false);
    if (error) onError('Could not update the role.');
    else onSaved();
  };

  return (
    <Modal open={member !== null} onClose={onClose} title={`Assign role — ${member?.display_name ?? ''}`} size="lg">
      <div className="space-y-4">
        <Field label="Role">
          <Select value={role} onChange={(e) => applyRole(e.target.value)}>
            {Object.entries(ROLE_PRESETS).map(([key, r]) => <option key={key} value={key}>{r.label}</option>)}
          </Select>
        </Field>

        {role === 'admin' ? (
          <p className="text-sm text-gray-500 bg-gray-50 rounded-lg px-3 py-2">Admins have every permission.</p>
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1 space-y-4">
            {PERMISSION_GROUPS.map((g) => (
              <div key={g.group}>
                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">{g.group}</div>
                <div className="grid sm:grid-cols-2 gap-1.5">
                  {g.items.map((it) => (
                    <label key={it.key} className="flex items-center gap-2 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={perms.includes(it.key)}
                        onChange={() => toggle(it.key)}
                        className="rounded border-gray-300 text-[#C9A84C] focus:ring-[#C9A84C]"
                      />
                      {it.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save role'}</Button>
        </div>
      </div>
    </Modal>
  );
}
