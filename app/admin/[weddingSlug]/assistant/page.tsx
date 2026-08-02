'use client';

import { Box } from '@mui/material';
import { use, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AgentChatPanel } from '@/components/agent/AgentChatPanel';

export default function AssistantPage({ params }: { params: Promise<{ weddingSlug: string }> }) {
  const { weddingSlug } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isWelcome = searchParams.get('welcome') === '1';
  // fresh=1 = the wedding was created moments ago (hero/welcome flow): the
  // panel skips its history fetch for an instant first paint. One-shot — we
  // capture it in a ref, then strip it from the URL so a reload restores
  // history normally.
  const freshRef = useRef(searchParams.get('fresh') === '1');
  useEffect(() => {
    if (searchParams.get('fresh') !== '1') return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete('fresh');
    router.replace(`/admin/${weddingSlug}/assistant${next.size ? `?${next.toString()}` : ''}`, { scroll: false });
  }, [searchParams, router, weddingSlug]);

  // Lock the document while the planner is open: the chat is a full-height
  // app surface — the PAGE must never scroll (only the message list inside
  // does). Without this, mobile Safari's URL-bar resize and its focus-pan
  // when the keyboard opens leave the page scrolled, with the chat shoved
  // under the fixed header and background showing beneath the composer.
  // position:fixed on <body> is the only reliable iOS scroll lock.
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prev = {
      htmlOverflow: html.style.overflow,
      htmlHeight: html.style.height,
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyInset: body.style.inset,
      bodyWidth: body.style.width,
      bodyOverscroll: body.style.overscrollBehavior,
    };
    html.style.overflow = 'hidden';
    html.style.height = '100%';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.inset = '0';
    body.style.width = '100%';
    body.style.overscrollBehavior = 'none';
    // If iOS panned the viewport for the keyboard, snap back once it closes.
    const snapBack = () => {
      const vv = window.visualViewport;
      if (vv && vv.height >= window.innerHeight - 50) window.scrollTo(0, 0);
    };
    window.visualViewport?.addEventListener('resize', snapBack);
    return () => {
      html.style.overflow = prev.htmlOverflow;
      html.style.height = prev.htmlHeight;
      body.style.overflow = prev.bodyOverflow;
      body.style.position = prev.bodyPosition;
      body.style.inset = prev.bodyInset;
      body.style.width = prev.bodyWidth;
      body.style.overscrollBehavior = prev.bodyOverscroll;
      window.visualViewport?.removeEventListener('resize', snapBack);
    };
  }, []);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <AgentChatPanel weddingSlug={weddingSlug} onboarding={isWelcome} freshWedding={freshRef.current} />
    </Box>
  );
}
