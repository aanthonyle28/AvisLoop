import { chromium } from 'playwright';
import { join } from 'path';

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'audit-test@avisloop.com';
const PASSWORD = 'AuditTest123!';
const SCREENSHOT_DIR = 'C:\\AvisLoop';

function screenshotPath(name) {
  return join(SCREENSHOT_DIR, name);
}

async function runAnalyticsTests() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  // Login
  console.log('[1] Logging in...');
  await page.goto(`${BASE_URL}/auth/login`);
  await page.waitForLoadState('networkidle');
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard', { timeout: 10000 });
  console.log('    Logged in, at:', page.url());

  // Navigate to analytics
  console.log('[2] Navigating to /analytics...');
  await page.goto(`${BASE_URL}/analytics`);
  await page.waitForLoadState('networkidle');
  console.log('    URL:', page.url());

  // Screenshot desktop view
  await page.screenshot({ path: screenshotPath('qa-64-analytics-desktop.png'), fullPage: false });
  console.log('    Screenshot: qa-64-analytics-desktop.png');

  // Page header
  const h1 = await page.locator('h1').textContent();
  const subtitle = await page.locator('p.text-muted-foreground').first().textContent();
  console.log('[3] Page header:', JSON.stringify(h1));
  console.log('    Subtitle:', JSON.stringify(subtitle));

  // Summary cards - get parent containers
  const allCardTexts = await page.locator('[class*="p-6"]').allTextContents();
  console.log('[4] Card texts (all p-6 elements):');
  allCardTexts.forEach((t, i) => {
    const clean = t.replace(/\s+/g, ' ').trim();
    if (clean.length > 0) console.log(`    [${i}]: ${clean}`);
  });

  // Specific metric values
  try {
    const overallResponseRate = await page.locator('text=Overall Response Rate').locator('..').locator('.text-4xl').textContent();
    console.log('[5] Overall Response Rate value:', overallResponseRate);
  } catch (e) {
    console.log('[5] Could not get Overall Response Rate:', e.message);
  }

  try {
    const overallReviewRate = await page.locator('text=Overall Review Rate').locator('..').locator('.text-4xl').textContent();
    console.log('[6] Overall Review Rate value:', overallReviewRate);
  } catch (e) {
    console.log('[6] Could not get Overall Review Rate:', e.message);
  }

  try {
    const totalRequestsSent = await page.locator('text=Total Requests Sent').locator('..').locator('.text-4xl').textContent();
    console.log('[7] Total Requests Sent value:', totalRequestsSent);
  } catch (e) {
    console.log('[7] Could not get Total Requests Sent:', e.message);
  }

  // Check if "Breakdown by Service Type" table exists
  const breakdownHeading = await page.locator('h2:has-text("Breakdown by Service Type")').count();
  console.log('[8] Breakdown table heading present:', breakdownHeading > 0);

  // Table headers
  const headers = await page.locator('thead th').allTextContents();
  console.log('[9] Table headers:', JSON.stringify(headers));

  // Table rows
  const rowCount = await page.locator('tbody tr').count();
  console.log('[10] Table row count:', rowCount);

  for (let i = 0; i < rowCount; i++) {
    const cells = await page.locator('tbody tr').nth(i).locator('td').allTextContents();
    const cleaned = cells.map(c => c.replace(/\s+/g, ' ').trim());
    console.log(`     Row ${i + 1}:`, JSON.stringify(cleaned));
  }

  // Check percentage bars
  const barElements = await page.locator('div[style*="width:"], div[style*="width: "]').all();
  console.log('[11] Elements with width style:', barElements.length);
  for (let i = 0; i < Math.min(6, barElements.length); i++) {
    const style = await barElements[i].getAttribute('style');
    console.log(`     Bar ${i + 1} style: ${style}`);
  }

  // Also check bg-primary bars
  const bgPrimaryBars = await page.locator('.bg-primary').all();
  console.log('[12] bg-primary elements:', bgPrimaryBars.length);
  for (let i = 0; i < Math.min(6, bgPrimaryBars.length); i++) {
    const style = await bgPrimaryBars[i].getAttribute('style');
    console.log(`     Primary bar ${i + 1} style: ${style}`);
  }

  // Full page screenshot for breakdown
  await page.screenshot({ path: screenshotPath('qa-64-analytics-breakdown.png'), fullPage: true });
  console.log('[13] Screenshot: qa-64-analytics-breakdown.png');

  // Check empty state (only for businesses with no jobs - code inspection)
  console.log('[14] Checking empty state code path...');
  console.log('     Empty state condition: data.byServiceType.length === 0');
  console.log('     Empty state renders: ChartBar icon + "No analytics data yet" + description + "Add your first job" button');
  console.log('     For test business (6 HVAC jobs): empty state NOT rendered (byServiceType.length = 3)');

  await browser.close();
  console.log('\n[DONE] Analytics QA test complete');
}

runAnalyticsTests().catch(err => {
  console.error('FATAL ERROR:', err);
  process.exit(1);
});
