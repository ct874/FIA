const { chromium } = require('playwright')
const { execSync } = require('child_process')

const SCRATCH = 'C:\\Users\\INCUBA~1\\AppData\\Local\\Temp\\claude\\c--Users-incubation-OneDrive-Desktop-FIA\\26436d72-b29c-43ee-a460-ea0cd5c7722b\\scratchpad'

async function main() {
  const browser = await chromium.launch()
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto('https://fia-nu.vercel.app/')
  await page.waitForTimeout(1000)
  await page.locator('input').nth(0).fill('fia@admin.com')
  await page.locator('input').nth(1).fill('fia@123')
  await page.locator('button[type="submit"]').first().click()
  await page.waitForURL('**/home', { timeout: 15000 }).catch(() => {})
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SCRATCH}/live-1-baseline.png` })

  // Simulate a change made from a completely different session (curl), while
  // this dashboard tab stays open and untouched — this is exactly the
  // reported bug scenario.
  console.log('Uploading a school via a separate session (curl)...')
  const TOKEN = execSync(
    `curl -s -X POST https://localhost:5000/api/auth/login -H "Content-Type: application/json" -d "{\\"loginId\\":\\"fia@admin.com\\",\\"password\\":\\"fia@123\\",\\"rememberMe\\":true}"`,
  ).toString()
  const token = JSON.parse(TOKEN).data.token
  execSync(
    `curl -s -X POST https://localhost:5000/api/schools/upload -H "Authorization: Bearer ${token}" -F "file=@_tmp_live_test.xlsx"`,
  )

  console.log('Waiting 22s for background poll to pick up the change (no manual reload)...')
  await page.waitForTimeout(22000)
  await page.screenshot({ path: `${SCRATCH}/live-2-after-poll.png` })

  await page.goto('https://fia-nu.vercel.app/submissions')
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${SCRATCH}/live-3-submissions-grades.png`, fullPage: true })

  await browser.close()
}

main().catch((err) => {
  console.error('SCRIPT_ERROR', err)
  process.exit(1)
})
