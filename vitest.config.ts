import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.{ts,tsx}'],
    css: false,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  // Inline empty PostCSS so transitive `.css` imports (e.g. react-datepicker)
  // don't try to load the Tailwind v4 PostCSS plugin during tests, which fails
  // outside Next's build. Tests don't render real CSS (test.css is false).
  css: { postcss: { plugins: [] } },
});
