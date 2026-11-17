'use strict';
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      // 覆盖率门槛：低于 80% 流水线失败
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80
      }
    }
  }
});
