import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/playwright',
  testMatch: 'security-audit.spec.mjs',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4317',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node tests/security-audit-server.mjs',
    port: 4317,
    reuseExistingServer: true,
    timeout: 20_000,
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox-desktop', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit-desktop', use: { ...devices['Desktop Safari'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'pixel-chromium', use: { ...devices['Pixel 7'] } },
    { name: 'canvas-chromium', use: { ...devices['Desktop Chrome'] }, metadata: { renderMode: 'canvas' } },
    { name: 'javascript-disabled', use: { ...devices['Desktop Chrome'], javaScriptEnabled: false } },
  ],
});
