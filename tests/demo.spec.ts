import { expect, test } from '@playwright/test'

test('all actor choices persist across refreshes and reset together', async ({ page, context }) => {
  await page.goto('/')
  const otherTab = await context.newPage()
  await otherTab.goto('/')
  for (const actor of ['ACT-01', 'ACT-02', 'ACT-03', 'ACT-04']) {
    const card = page.getByRole('button').filter({ hasText: actor })
    await card.click()
    await expect(card).toHaveAttribute('aria-pressed', 'true')
    await expect(otherTab.getByRole('button').filter({ hasText: actor })).toHaveAttribute('aria-pressed', 'true')
    await page.reload()
    await expect(card).toHaveAttribute('aria-pressed', 'true')
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ban-klang-transit:demo:v1')!).selectedActor)).toBe(actor)
  }
  await page.getByRole('button', { name: 'เริ่มการสาธิตใหม่' }).click()
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0)
  await page.reload()
  await expect(page.locator('[aria-pressed="true"]')).toHaveCount(0)
})

test('mobile layout, corrupted storage and unknown routes recover', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await page.evaluate(() => localStorage.setItem('ban-klang-transit:demo:v1', '{invalid'))
  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.getByRole('button').filter({ hasText: 'ACT-01' }).focus()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('button').filter({ hasText: 'ACT-01' })).toHaveAttribute('aria-pressed', 'true')
  await page.screenshot({ path: 'test-results/landing-mobile.png', fullPage: true })
  await page.goto('/unknown')
  await expect(page.getByRole('heading', { name: 'ไม่พบหน้านี้' })).toBeVisible()
  await page.getByRole('link', { name: 'กลับหน้าหลัก' }).click()
  await expect(page.getByRole('button').filter({ hasText: 'ACT-01' })).toHaveAttribute('aria-pressed', 'true')
  await page.setViewportSize({ width: 1440, height: 1000 })
  await page.screenshot({ path: 'test-results/landing-desktop.png', fullPage: true })
})
