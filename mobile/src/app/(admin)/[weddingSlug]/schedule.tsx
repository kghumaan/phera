import { Screen } from '@/components/Screen';
import { EmptyState, PageHeading } from '@/components/ui';

export default function ScheduleScreen() {
  // Phase 3: events list + create/edit against the schedule tables.
  return (
    <Screen>
      <PageHeading title="Schedule" subtitle="Events across your wedding week" />
      <EmptyState
        icon="calendar-outline"
        title="Schedule is coming soon"
        subtitle="Event management ships in Phase 3 of the mobile build. Use the web app in the meantime."
      />
    </Screen>
  );
}
