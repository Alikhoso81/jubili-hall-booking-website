import { ReactNode } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { can } from '../lib/permissions';
import { Card, EmptyState } from './ui';

export default function RequirePermission({ perm, children }: { perm: string; children: ReactNode }) {
  const { staff } = useAuth();

  if (!can(staff, perm)) {
    return (
      <Card>
        <EmptyState
          icon={<ShieldAlert className="w-10 h-10" />}
          title="No access"
          hint="You don't have permission to view this page. Ask an admin to grant it from Settings → Users."
        />
      </Card>
    );
  }

  return <>{children}</>;
}
