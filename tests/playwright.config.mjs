import { defineConfig, devices } from '@playwright/test';

// Phone-sized browsers against the real files. Everything outside the site (YouTube, the CDNs, the food databases, Supabase) is replaced by stand-ins in the tests.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : [['list']],
  use: { baseURL: 'http://localhost:8891', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Pixel 5'] } },
    { name: 'webkit', use: { ...devices['iPhone 13'] } },   // the closest thing to an iPhone we can test automatically
  ],
  webServer: { command: 'node serve.mjs', port: 8891, reuseExistingServer: !process.env.CI },
});
