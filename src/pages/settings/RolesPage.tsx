import { ShieldCheck } from 'lucide-react';
import { ROLE_PRESETS, PERMISSION_LABELS, ALL_PERMISSIONS } from '../../lib/permissions';
import { PageHeader, Card } from '../../components/ui';

export default function RolesPage() {
  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Roles"
        subtitle="Preset permission bundles. Assign a role to a member from Settings → Users, then fine-tune their exact permissions there."
      />

      <div className="grid md:grid-cols-2 gap-4">
        {Object.entries(ROLE_PRESETS).map(([key, r]) => {
          const perms = key === 'admin' ? ALL_PERMISSIONS : r.permissions;
          return (
            <Card key={key}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-9 h-9 rounded-xl bg-[#C9A84C]/15 text-[#8a6d24] grid place-items-center">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-semibold text-[#0d1b0f]">{r.label}</h3>
                  <p className="text-xs text-gray-400">{perms.length} permission{perms.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {key === 'admin' ? (
                  <span className="px-2 py-0.5 rounded bg-[#C9A84C]/15 text-[11px] text-[#8a6d24] font-medium">Full access</span>
                ) : (
                  perms.map((p) => (
                    <span key={p} className="px-2 py-0.5 rounded bg-gray-100 text-[11px] text-gray-500">{PERMISSION_LABELS[p] ?? p}</span>
                  ))
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
