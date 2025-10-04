import { test, expect } from '@playwright/test'
import path from 'path'
import ExcelJS from 'exceljs'
import { DateTime } from 'luxon'

const DATASET_PATH = path.resolve(__dirname, '../../SendGrid Stats.xlsx')

interface FixtureRow {
  email: string
  eventType: string
  category: string | null
  dateISO: string
}

let fixtureRow: FixtureRow

function parseCategory(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed) && parsed.length > 0) {
        return String(parsed[0])
      }
    } catch {
      // ignore JSON parse failures, fallback below
    }
  }
  const first = trimmed.split(',')[0]?.trim()
  return first || null
}

function parseTimestamp(raw: string): DateTime | null {
  const zone = 'Australia/Brisbane'
  const trimmed = raw.trim()
  if (!trimmed) return null

  let dt = DateTime.fromISO(trimmed, { zone })
  if (dt.isValid) return dt

  const formats = [
    "yyyy-MM-dd HH:mm:ss",
    "yyyy-MM-dd'T'HH:mm:ss",
    'dd/MM/yyyy, h:mm:ss a',
    'dd/MM/yyyy, H:mm:ss',
    'MM/dd/yyyy, h:mm:ss a',
    'MM/dd/yyyy HH:mm:ss',
  ]

  for (const format of formats) {
    dt = DateTime.fromFormat(trimmed, format, { zone, setZone: true })
    if (dt.isValid) return dt
  }

  const jsDate = new Date(trimmed)
  if (!Number.isNaN(jsDate.valueOf())) {
    dt = DateTime.fromJSDate(jsDate, { zone })
    if (dt.isValid) return dt
  }

  return null
}

async function loadFixtureRow(): Promise<FixtureRow> {
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(DATASET_PATH)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) {
    throw new Error('SendGrid Stats worksheet not found')
  }

  const headers = new Map<string, number>()
  worksheet.getRow(1).eachCell((cell, colNumber) => {
    const value = cell.value
    if (typeof value === 'string') {
      headers.set(value.trim().toLowerCase(), colNumber)
    }
  })

  const emailCol = headers.get('email')
  const eventCol = headers.get('event')
  const timestampCol = headers.get('timestamp')
  const categoryCol = headers.get('category')

  if (!emailCol || !eventCol || !timestampCol || !categoryCol) {
    throw new Error('Required columns missing from dataset')
  }

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber)
    const email = row.getCell(emailCol).text.trim()
    const eventType = row.getCell(eventCol).text.trim().toLowerCase()
    const timestampRaw = row.getCell(timestampCol).text.trim()
    const categoryRaw = row.getCell(categoryCol).text.trim()

    if (!email || !eventType || !timestampRaw) {
      continue
    }

    const dateTime = parseTimestamp(timestampRaw)
    if (!dateTime) {
      continue
    }

    return {
      email,
      eventType,
      category: parseCategory(categoryRaw),
      dateISO: dateTime.toISODate()!,
    }
  }

  throw new Error('No valid data rows found in dataset')
}

async function uploadDataset(page: import('@playwright/test').Page) {
  await page.goto('/')
  const uploadInput = page.getByTestId('excel-upload-input')
  await uploadInput.setInputFiles(DATASET_PATH)

  const eventCount = page.getByTestId('event-count')
  await expect(eventCount).toHaveText(/events loaded/i, { timeout: 20000 })
  await expect(eventCount).not.toHaveText(/0 events loaded/i, { timeout: 20000 })
  await expect(page.getByTestId('last-updated')).not.toHaveText(/Awaiting upload/i, { timeout: 20000 })
}

function parseNumber(value: string | null | undefined): number {
  if (!value) return 0
  return Number(value.replace(/[^0-9.]/g, ''))
}

async function expectRowsMatchEmail(page: import('@playwright/test').Page, email: string) {
  const rows = page.locator('[data-testid="activity-feed-row"]')
  await expect(rows).not.toHaveCount(0)
  const visibleRows = await rows.count()
  for (let index = 0; index < visibleRows; index += 1) {
    await expect(rows.nth(index).locator('td').nth(1)).toContainText(email, { timeout: 5000 })
  }
}

test.beforeAll(async () => {
  fixtureRow = await loadFixtureRow()
})

test('uploads dataset and filters by recipient and date range', async ({ page }) => {
  await uploadDataset(page)

  const emailInput = page.locator('#filter-email')
  await emailInput.fill(fixtureRow.email)
  await expectRowsMatchEmail(page, fixtureRow.email)

  const startInput = page.locator('input[placeholder="Start"]')
  const endInput = page.locator('input[placeholder="End"]')
  await startInput.fill(fixtureRow.dateISO)
  await endInput.fill(fixtureRow.dateISO)

  await expectRowsMatchEmail(page, fixtureRow.email)
  const expectedDate = DateTime.fromISO(fixtureRow.dateISO).toFormat('dd LLL yyyy')
  await expect(page.locator('[data-testid="activity-feed-row"]').first().locator('td').first()).toContainText(expectedDate)
})

test('sorts top categories and exports filtered activity CSV', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'File downloads unsupported in CI webkit runs')

  await uploadDataset(page)

  const uniqueOpensButton = page.getByRole('button', { name: 'Sort by Unique Opens' })
  await uniqueOpensButton.click()

  const categoriesTable = page.getByRole('table', { name: /Category performance/i })
  const rows = categoriesTable.locator('tbody tr')
  await expect(rows).not.toHaveCount(0)

  if ((await rows.count()) > 1) {
    const first = parseNumber(await rows.nth(0).locator('td').nth(2).textContent())
    const second = parseNumber(await rows.nth(1).locator('td').nth(2).textContent())
    expect(first).toBeGreaterThanOrEqual(second)
  }

  const eventTypeSelect = page.locator('#filter-event-type')
  await eventTypeSelect.selectOption(fixtureRow.eventType)

  if (fixtureRow.category) {
    const categorySelect = page.locator('#filter-category')
    const optionExists = await categorySelect.locator(`option[value="${fixtureRow.category}"]`).count()
    if (optionExists > 0) {
      await categorySelect.selectOption(fixtureRow.category)
    }
  }

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export activity' }).click(),
  ])

  const filename = download.suggestedFilename()
  expect(filename).toMatch(/^activity-\d{8}-\d{6}\.csv$/)
})

test('toggles chart metrics and switches figure granularity', async ({ page }) => {
  await uploadDataset(page)

  const deliveredToggle = page.getByRole('button', { name: 'Hide Delivered metric' })
  await deliveredToggle.click()
  await expect(deliveredToggle).toHaveAttribute('aria-pressed', 'false')
  await expect(deliveredToggle).toHaveAccessibleName('Show Delivered metric')
  await deliveredToggle.click()
  await expect(deliveredToggle).toHaveAttribute('aria-pressed', 'true')

  const weeklyButton = page.getByRole('button', { name: 'View weekly aggregates' })
  await weeklyButton.click()
  await expect(weeklyButton).toHaveAttribute('aria-pressed', 'true')

  const figuresTable = page.getByRole('table', { name: /Aggregated SendGrid metrics/i })
  await expect(figuresTable.locator('tbody tr')).not.toHaveCount(0)
  const weeklyLabel = await figuresTable.locator('tbody tr').first().locator('td').first().textContent()
  expect(weeklyLabel?.includes('–')).toBeTruthy()

  const monthlyButton = page.getByRole('button', { name: 'View monthly aggregates' })
  await monthlyButton.click()
  await expect(monthlyButton).toHaveAttribute('aria-pressed', 'true')
  const monthlyLabel = await figuresTable.locator('tbody tr').first().locator('td').first().textContent()
  expect(monthlyLabel).toMatch(/[A-Za-z]/)

  const funnel = page.getByRole('img', { name: /Funnel showing counts/i })
  await expect(funnel).toBeVisible()
})
