import { Screen } from '@/components/Screen';
import { EmptyState, PageHeading } from '@/components/ui';

export default function PlannerScreen() {
  // Phase 2: SSE chat against /api/agent/chat with in-chat confirmations.
  return (
    <Screen>
      <PageHeading title="Planner" subtitle="Your AI wedding planner" />
      <EmptyState
        icon="sparkles-outline"
        title="Phera Planner is coming to mobile"
        subtitle="Chat with your AI planner to manage guests, travel, and outreach — shipping in Phase 2 of the mobile build."
      />
    </Screen>
  );
}
