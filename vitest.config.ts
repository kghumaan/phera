import { defineConfig, configDefaults } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

// The live-DB integration suites all hit the single free-tier phera-test
// Supabase. Run in parallel they exhaust its connection budget and flake on
// random groups; run one-at-a-time they're stable. So they get their own
// project with file-parallelism OFF (one suite at a time), while everything
// else stays fully parallel. retry:2 inside each integration file mops up any
// remaining transient blip. See reference: rls-integration flake.
const INTEGRATION = [
  'tests/rls-integration.test.ts',
  'tests/workflow-integration.test.ts',
  'tests/edge-cases-integration.test.ts',
];

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Inline empty PostCSS at the VITE level (inherited by every project) so
  // transitive `.css` imports (e.g. react-datepicker) don't try to load the
  // Tailwind v4 PostCSS plugin during tests, which fails outside Next's build.
  css: { postcss: { plugins: [] } },
  test: {
    // Shared defaults — inherited by both projects via `extends: true`.
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    css: false, // tests don't render real CSS
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['tests/**/*.test.{ts,tsx}'],
          exclude: [...configDefaults.exclude, ...INTEGRATION],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: INTEGRATION,
          // One live-DB suite at a time — avoids free-tier connection contention.
          fileParallelism: false,
        },
      },
    ],
  },
});
