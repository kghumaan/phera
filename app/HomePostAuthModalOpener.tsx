'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

type Tier = 'base' | 'premium' | 'planner_perwedding' | 'planner_studio';
const VALID_TIERS: readonly Tier[] = ['base', 'premium', 'planner_perwedding', 'planner_studio'];

interface Props {
  user: { id?: string } | null | undefined;
  setUpgradeModalOpen: (open: boolean) => void;
  setUpgradeTier: (tier: Tier) => void;
}

export default function HomePostAuthModalOpener({ user, setUpgradeModalOpen, setUpgradeTier }: Props) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const tier = searchParams.get('tier');
    if (tier && (VALID_TIERS as readonly string[]).includes(tier) && user) {
      setUpgradeTier(tier as Tier);
      setUpgradeModalOpen(true);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [searchParams, user, setUpgradeModalOpen, setUpgradeTier]);

  return null;
}
