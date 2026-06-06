import { defineConfig } from '@playwright/test';

const hasSupabase =
  !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
  !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
  webServer: hasSupabase
    ? {
        command: 'npm run build && npm run start -- -p 3000',
        port: 3000,
        reuseExistingServer: !process.env.CI,
      }
    : undefined,
});
