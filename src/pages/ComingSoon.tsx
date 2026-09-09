import { Hammer } from 'lucide-react';
import { PageHeader, Card, EmptyState } from '../components/ui';

export default function ComingSoon({ title, eyebrow, note }: { title: string; eyebrow?: string; note?: string }) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} />
      <Card>
        <EmptyState
          icon={<Hammer className="w-10 h-10" />}
          title="Module in progress"
          hint={
            note ??
            'This section is scaffolded and will be built out next. The navigation, permissions and layout are already wired up.'
          }
        />
      </Card>
    </>
  );
}
