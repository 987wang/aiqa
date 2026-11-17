'use strict';
const { test, expect } = require('@playwright/test');

// 端到端：打开首页 → 输入问题 → 提交 → 断言回答 → 断言历史 → 刷新后仍存在
test('提问后回答与历史记录均正确，刷新后记录仍在', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('ask-input').fill('什么是 Spec 驱动开发？');
  await page.getByTestId('ask-button').click();

  await expect(page.getByTestId('answer-panel')).toBeVisible();
  await expect(page.getByTestId('answer-text')).not.toBeEmpty({ timeout: 10000 });

  const firstItem = page.getByTestId('history-list').getByTestId('history-item').first();
  await expect(firstItem).toContainText('什么是 Spec 驱动开发？');

  await page.reload();
  await expect(page.getByTestId('history-list').getByTestId('history-item').first()).toContainText('什么是 Spec 驱动开发？');
});
