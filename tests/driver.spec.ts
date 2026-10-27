import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

// Every request used by these tests is submitted through the ACT-01 UI.
async function submitPatientBooking(page: Page, hour = '13', minute = '10') {
  await page.clock.setFixedTime(new Date('2026-10-26T03:30:00Z'))
  await page.goto('/booking')
  await page.getByRole('button', { name: 'เริ่มจองรถ →', exact: true }).click()
  await page.getByRole('checkbox', { name: 'รับทราบการใช้ข้อมูล' }).check()
  await page.getByRole('button', { name: 'รับทราบและถัดไป' }).click()
  await page.getByLabel('ชื่อผู้ป่วย *', { exact: true }).fill('ผู้รับบริการ จำลอง')
  await page.getByLabel('เบอร์โทรศัพท์ของคุณ *', { exact: true }).fill('0800000000')
  await page.getByLabel('โรงพยาบาล *', { exact: true }).selectOption('โรงพยาบาลที่เลือก (จำลอง)')
  await page.getByRole('button', { name: /วันนัดหมาย \*/ }).click()
  await page.getByRole('button', { name: '30 ตุลาคม 2569', exact: true }).click()
  await page.getByRole('button', { name: 'ยืนยันวันที่', exact: true }).click()
  await page.getByRole('button', { name: /เวลานัดหมาย \*/ }).click()
  await page.getByRole('combobox', { name: 'ชั่วโมง', exact: true }).selectOption(hour)
  await page.getByRole('combobox', { name: 'นาที', exact: true }).selectOption(minute)
  await page.getByRole('button', { name: 'ยืนยันเวลา', exact: true }).click()
  await page.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await page.getByRole('button', { name: 'เลือกจุดรับบนแผนที่', exact: true }).last().click()
  await page.getByRole('slider').focus()
  await page.keyboard.press('ArrowRight')
  await page.getByRole('button', { name: 'ยืนยันจุดรับ', exact: true }).click()
  await page.getByRole('button', { name: 'ถัดไป →', exact: true }).click()
  await page.getByRole('button', { name: 'ยืนยันและส่งคำขอ', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'ส่งคำขอแล้ว', exact: true })).toBeVisible()
  return (await page.locator('.booking-reference > strong').textContent())!
}
async function selectResources(page: Page, vehicle = '01', driver = 'A') {
  await page.getByRole('button', { name: /^รถรับส่ง:/ }).click()
  await page.getByRole('option', { name: new RegExp(`รถคันที่ ${vehicle}`) }).click()
  await page.getByRole('button', { name: /^คนขับ:/ }).click()
  await page.getByRole('option', { name: new RegExp(`คนขับ ${driver}`) }).click()
}
async function assign(page: Page, id: string, vehicle = '01', driver = 'A') {
  await page.goto(`/dispatcher/assignment?booking=${id}`)
  await selectResources(page, vehicle, driver)
  await page.getByRole('button', { name: 'ตรวจสอบซ้ำและยืนยันการมอบหมาย', exact: true }).click()
  await expect(page.getByRole('dialog', { name: '✓ รถและคนขับพร้อมรับงาน' })).toBeVisible()
  await page.getByRole('button', { name: 'ยืนยันการมอบหมาย', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'ยืนยันการมอบหมายงาน?' })).toBeVisible()
  await page.getByRole('button', { name: 'ยืนยันการมอบหมาย', exact: true }).click()
  await expect(page).toHaveURL(/dispatcher\/tracking$/)
}


test('complete shared ACT-01 → ACT-02 → ACT-03 journey across tabs and reload', async ({ page, context }) => {
  const id = await submitPatientBooking(page)
  await page.goto('/dispatcher')
  await page.getByRole('row').filter({ hasText: id }).getByRole('button', { name: 'ดูรายละเอียด →', exact: true }).click()
  await page.getByRole('button', { name: 'อนุมัติคำขอ', exact: true }).click()
  await page.getByRole('button', { name: 'ยืนยันอนุมัติ', exact: true }).click()
  await assign(page, id)
  const patient = await context.newPage()
  await patient.goto(`/booking/status/${id}`)
  const driver = await context.newPage()
  await driver.clock.setFixedTime(new Date('2026-10-30T03:30:00Z'))
  await driver.goto('/driver')
  await driver.getByLabel('คนขับสาธิต', { exact: true }).selectOption('demo-driver-B')
  await expect(driver.getByText('ไม่มีงานรับส่งวันนี้', { exact: true })).toBeVisible()
  await driver.getByLabel('คนขับสาธิต', { exact: true }).selectOption('demo-driver-A')
  await driver.getByRole('button', { name: 'ดูรายละเอียดงาน', exact: false }).click()
  await expect(driver.getByText('ผู้รับบริการ • ผู้รับบริการ จำลอง', { exact: true })).toBeVisible()
  await expect(driver.locator('.driver-schedule')).toContainText('12:15')
  await driver.getByRole('button', { name: 'เปิดแผนที่ไปจุดรับ' }).click()
  await expect(driver.getByRole('img', { name: /ตำแหน่งจุดรับจำลอง/ })).toBeVisible()
  await driver.getByRole('button', { name: 'ปิดแผนที่', exact: true }).click()
  await driver.getByRole('button', { name: 'เริ่มออกไปรับผู้ป่วย' }).click()
  await driver.getByRole('button', { name: 'อัปเดตสถานะงาน' }).click()
  await driver.getByRole('button', { name: 'ยกเลิก', exact: true }).click()
  expect(await driver.evaluate(() => JSON.parse(localStorage.getItem('ban-klang-transit:demo:v1')!).bookings[0].status)).toBe('approved')
  for (const stage of ['going_to_pickup', 'patient_onboard', 'going_to_hospital', 'delivered']) {
    await driver.getByRole('button', { name: 'อัปเดตสถานะงาน', exact: true }).click()
    await driver.getByRole('button', { name: 'ยืนยันการอัปเดต', exact: true }).click()
    await expect(driver.getByRole('dialog')).toHaveCount(0)
    const saved = await driver.evaluate(() => JSON.parse(localStorage.getItem('ban-klang-transit:demo:v1')!).bookings[0])
    expect(saved.driverProgress.stage).toBe(stage)
    expect(saved.status).toBe(stage === 'delivered' ? 'completed' : 'in_transit')
    await expect(page.getByRole('row').filter({ hasText: id })).toContainText(stage === 'delivered' ? 'เสร็จสิ้น' : 'กำลังเดินทาง')
    await driver.reload()
    await expect(driver.getByLabel('คนขับสาธิต')).toHaveValue('demo-driver-A')
  }
  await expect(patient.getByText('เสร็จสิ้น', { exact: true }).first()).toBeVisible()
  await patient.reload()
  await expect(patient.getByText('เสร็จสิ้น', { exact: true }).first()).toBeVisible()
  await driver.getByRole('link', { name: 'ดูประวัติงาน', exact: true }).click()
  await expect(driver.locator('.driver-trip')).toContainText(id)
  await expect(driver.locator('.driver-trip')).toContainText('เสร็จสิ้น')
})

async function seedDriver(page: Page) {
  await page.clock.setFixedTime(new Date('2026-10-30T03:30:00Z'))
  await page.goto('/driver')
  await page.evaluate(() => {
    const key = 'ban-klang-transit:demo:v1'
    const state = JSON.parse(localStorage.getItem(key)!)
    state.bookings = [1, 2].map(n => ({ id: `BK-000${n}`, patientName: 'ผู้รับบริการ จำลอง', status: 'approved', driverId: 'demo-driver-A', vehicleId: 'demo-vehicle-1', appointmentAt: `2026-10-30T${n === 1 ? '06' : '09'}:10:00.000Z`, schedule: { departureAt: `2026-10-30T${n === 1 ? '04' : '07'}:45:00.000Z`, pickupAt: `2026-10-30T${n === 1 ? '05' : '08'}:15:00.000Z`, arrivalAt: `2026-10-30T${n === 1 ? '05' : '08'}:50:00.000Z`, endsAt: `2026-10-30T${n === 1 ? '06' : '09'}:10:00.000Z`, centerToPickupMinutes: 30, pickupToHospitalMinutes: 35, preparationMinutes: 20, calculation: 'demo-manual-v1' } }))
    localStorage.setItem(key, JSON.stringify(state))
    sessionStorage.setItem('ban-klang-transit:driver', 'demo-driver-A')
  })
  await page.reload()
}

test('stale confirmations, identity isolation, missing jobs, and storage reset', async ({ page, context }) => {
  await seedDriver(page)
  await page.goto('/driver/status?booking=BK-0001')
  await page.getByRole('button', { name: 'อัปเดตสถานะงาน', exact: true }).click()
  const other = await context.newPage()
  await other.goto('/driver/status?booking=BK-0001')
  await other.getByLabel('คนขับสาธิต').selectOption('demo-driver-A')
  await other.getByRole('button', { name: 'อัปเดตสถานะงาน', exact: true }).click()
  await other.getByRole('button', { name: 'ยืนยันการอัปเดต', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('งานหรือสถานะเปลี่ยนแล้ว')
  await expect(page.getByRole('button', { name: 'ยืนยันการอัปเดต', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.getByLabel('คนขับสาธิต').selectOption('demo-driver-B')
  await expect(other.getByLabel('คนขับสาธิต')).toHaveValue('demo-driver-A')
  await page.goto('/driver/details?booking=missing')
  await expect(page.getByRole('heading', { name: 'ไม่พบงานที่มอบหมายให้คนขับนี้' })).toBeVisible()
  await other.evaluate(() => localStorage.removeItem('ban-klang-transit:demo:v1'))
  await expect(page.getByRole('heading', { name: 'เลือกคนขับสาธิตเพื่อดูงาน' })).toBeVisible()
})

for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440, 1920]) {
  test(`driver layouts and dialogs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await seedDriver(page)
    for (const path of ['/driver', '/driver/details?booking=BK-0001', '/driver/status?booking=BK-0001', '/driver/history']) {
      await page.goto(path)
      await expect(page.locator('h1')).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
      for (const control of await page.locator('.driver-shell button, .driver-shell select, .driver-nav a').all()) {
        const box = await control.boundingBox()
        if (box) { expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(width + 1) }
      }
      if (path.includes('/status')) {
        await page.getByRole('button', { name: 'อัปเดตสถานะงาน', exact: true }).click()
        const dialog = page.getByRole('dialog')
        await expect(dialog).toBeVisible()
        const bounds = await dialog.boundingBox()
        expect(bounds!.x).toBeGreaterThanOrEqual(0)
        expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width)
        await page.screenshot({ path: `test-results/driver-dialog-${width}.png`, fullPage: true })
        await page.getByRole('button', { name: 'ยกเลิก', exact: true }).click()
      }
      if (path === '/driver') await page.screenshot({ path: `test-results/driver-dashboard-${width}.png`, fullPage: true })
    }
    await page.evaluate(() => {
      const key = 'ban-klang-transit:demo:v1'
      const state = JSON.parse(localStorage.getItem(key)!)
      state.bookings[0].status = 'completed'
      localStorage.setItem(key, JSON.stringify(state))
    })
    await page.goto('/driver/history')
    await expect(page.locator('.driver-trip')).toContainText('BK-0001')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.getByRole('button', { name: /ดูรายละเอียด/ }).click()
    await page.getByRole('button', { name: 'ดูสถานะงาน', exact: true }).click()
    await expect(page.getByRole('button', { name: 'อัปเดตสถานะงาน', exact: true })).toHaveCount(0)
    await expect(page.locator('.driver-current')).toContainText('ส่งถึงโรงพยาบาล')
  })
}
