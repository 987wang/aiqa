'use strict';
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  testMatch: '**/*.e2e.spec.js',
  timeout: 60000,
  expect: { timeout: 10000 },
  use: {
    baseURL: 'http://localhost:3000',
    headless: false,
    // 单个操作最多等 30 秒，超时报错更直观
    actionTimeout: 30000,
    // 每步操作放慢 0.5 秒，便于观察/截图
    launchOptions: { slowMo: 500 }
  },
  webServer: {
    command: 'node src/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 20000
  }
});
