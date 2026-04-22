import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Phera · Ops',
  robots: { index: false, follow: false },
};

const DARK_BG = '#0B0B0E';
const DARK_TEXT = '#E7E7EA';

export default function OpsLayout({ children }: { children: ReactNode }) {
  return (
    <div
      data-ops-root
      style={{
        minHeight: '100vh',
        background: DARK_BG,
        color: DARK_TEXT,
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial',
        colorScheme: 'dark',
      }}
    >
      {children}
    </div>
  );
}
