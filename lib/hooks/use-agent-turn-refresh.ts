'use client';

import { useEffect, useRef } from 'react';

/** Fired on window after every completed agent turn in the docked Planner
 *  sidebar (components/admin/AssistantSidebar.tsx) — the agent may have just
 *  mutated the data the page underneath is showing. */
export const AGENT_TURN_EVENT = 'phera:agent-turn-complete';

/**
 * Re-run `handler` after every agent turn in the docked Planner sidebar.
 * Admin pages use this to silently refetch their data so agent edits ("tag
 * the Sharmas as family", "move the sangeet to 7pm") appear without a reload.
 *
 * The handler is kept in a ref so callers can pass a fresh closure every
 * render without re-subscribing the listener.
 */
export function useAgentTurnRefresh(handler: () => void | Promise<void>) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    const listener = () => {
      void handlerRef.current();
    };
    window.addEventListener(AGENT_TURN_EVENT, listener);
    return () => window.removeEventListener(AGENT_TURN_EVENT, listener);
  }, []);
}
