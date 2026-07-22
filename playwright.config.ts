import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

if (!process.env.CI) {
  dotenv.config({
    path: path.resolve(__dirname, '.env.e2e'),
  });
}

export default defineConfig({
  testDir: './e2e',
  testIgnore: ['**/tests/**'],
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['html'], ['junit', { outputFile: 'test-results/results.xml' }]],
  workers: 1,

  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/user.json',
      },
      dependencies: ['setup'],
    },
  ],

  webServer: {
    command: 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY!,
      AI_PROVIDER: process.env.AI_PROVIDER ?? 'deepseek',
      DEEPSEEK_KEY: process.env.DEEPSEEK_KEY ?? 'unused-in-e2e',
    },
  },
});
