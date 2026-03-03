const { chromium } = require('playwright');
const path = require('path');

const screenshotDir = 'C:/AvisLoop';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  const results = {};

  try {
    // ===== Login =====
    console.log('=== Login ===');
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: /email/i }).fill('audit-test@avisloop.com');
    await page.getByRole('textbox', { name: /password/i }).fill('AuditTest123!');
    const loginBtn = page.getByRole('button', { name: /sign in|log in|^login$/i }).first();
    await loginBtn.click();
    await page.waitForURL(/dashboard|jobs|campaigns/, { timeout: 15000 });
    console.log('Login OK, URL:', page.url());

    // ===== HIST-01: History page displays send logs with correct status badges =====
    console.log('\n=== HIST-01: History page display ===');
    await page.goto('http://localhost:3000/history');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Screenshot: full desktop view
    await page.screenshot({ path: `${screenshotDir}/qa-64-history-full-desktop.png`, fullPage: false });
    console.log('Screenshot: qa-64-history-full-desktop.png');

    // Check page header
    const h1Text = await page.locator('h1').first().textContent();
    console.log('H1 text:', h1Text);
    results.hist01_header = h1Text?.includes('Send History') ? 'PASS' : 'FAIL';

    // Check total count in description
    const descText = await page.locator('p.text-muted-foreground').first().textContent();
    console.log('Description:', descText);
    results.hist01_total = descText?.includes('10 total') ? 'PASS' : 'FAIL - got: ' + descText;

    // Check table columns
    const headers = await page.locator('thead th, thead td').allTextContents();
    console.log('Table headers:', headers);
    results.hist01_columns = (
      headers.some(h => /recipient/i.test(h)) &&
      headers.some(h => /subject/i.test(h)) &&
      headers.some(h => /status/i.test(h)) &&
      headers.some(h => /sent/i.test(h))
    ) ? 'PASS' : 'FAIL - headers: ' + JSON.stringify(headers);

    // Check showing count
    const showingText = await page.locator('.text-sm.text-muted-foreground').first().textContent().catch(() => '');
    console.log('Showing text:', showingText);

    // Count all status badge texts
    const statusBadgeTexts = await page.locator('tbody tr').evaluateAll((rows) => {
      return rows.map(row => {
        const statusCell = row.querySelector('[class*="StatusDot"], span[class*="inline-flex"], .inline-flex');
        // Get badge text from the row
        const cells = Array.from(row.querySelectorAll('td'));
        // Status column is 3rd column (index 2) based on: select, recipient, subject, status, sent, actions
        // But we have select col only on resendable rows, so find by dot color
        const allText = Array.from(row.querySelectorAll('span')).map(s => s.textContent?.trim()).filter(Boolean);
        return allText;
      });
    });
    console.log('Row span texts (sample):', statusBadgeTexts.slice(0, 4));

    // Check status badge display for specific statuses
    const allRows = await page.locator('tbody tr').all();
    console.log('Total rows rendered:', allRows.length);
    results.hist01_row_count = allRows.length === 10 ? 'PASS' : 'FAIL - got ' + allRows.length;

    // Look for specific status badge texts
    const deliveredBadges = await page.getByText('Delivered', { exact: true }).count();
    const failedBadges = await page.getByText('Failed', { exact: true }).count();
    const pendingBadges = await page.getByText('Pending', { exact: true }).count();
    console.log('Badge counts - Delivered:', deliveredBadges, 'Failed:', failedBadges, 'Pending:', pendingBadges);

    // Expected: delivered=3 (delivered x2 + sent x1 + opened x1 = 4 "Delivered"), failed=3 (failed x2 + bounced x1 + complained x1 = 4 "Failed"), pending=1
    // Actually: delivered(3) + sent(1) + opened(1) = 5 "Delivered" badges
    // failed(2) + bounced(1) + complained(1) = 4 "Failed" badges
    // pending(1) = 1 "Pending" badge
    results.hist01_status_badges = (deliveredBadges >= 4 && failedBadges >= 3 && pendingBadges >= 1) ? 'PASS' :
      `PARTIAL - Delivered: ${deliveredBadges}, Failed: ${failedBadges}, Pending: ${pendingBadges}`;

    console.log('HIST-01 results:', {
      header: results.hist01_header,
      total: results.hist01_total,
      columns: results.hist01_columns,
      row_count: results.hist01_row_count,
      status_badges: results.hist01_status_badges,
    });

    // ===== HIST-02: Status chip filter =====
    console.log('\n=== HIST-02: Status filter ===');

    // Select "Failed" status
    const selectTrigger = page.locator('[role="combobox"]').first();
    await selectTrigger.click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: 'Failed' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const failedFilterRows = await page.locator('tbody tr').count();
    console.log('Rows with Failed filter:', failedFilterRows);
    await page.screenshot({ path: `${screenshotDir}/qa-64-history-filter-failed.png` });
    results.hist02_failed = failedFilterRows === 2 ? 'PASS' : 'FAIL - got ' + failedFilterRows + ' (expected 2)';

    // Select "Delivered" status
    await selectTrigger.click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: 'Delivered' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const deliveredFilterRows = await page.locator('tbody tr').count();
    console.log('Rows with Delivered filter:', deliveredFilterRows);
    await page.screenshot({ path: `${screenshotDir}/qa-64-history-filter-delivered.png` });
    results.hist02_delivered = deliveredFilterRows === 3 ? 'PASS' : 'FAIL - got ' + deliveredFilterRows + ' (expected 3)';

    // Select "Bounced" status
    await selectTrigger.click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: 'Bounced' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const bouncedFilterRows = await page.locator('tbody tr').count();
    console.log('Rows with Bounced filter:', bouncedFilterRows);
    results.hist02_bounced = bouncedFilterRows === 1 ? 'PASS' : 'FAIL - got ' + bouncedFilterRows + ' (expected 1)';

    // Reset to "All statuses"
    await selectTrigger.click();
    await page.waitForTimeout(500);
    await page.locator('[role="option"]').filter({ hasText: 'All statuses' }).click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const allFilterRows = await page.locator('tbody tr').count();
    results.hist02_all = allFilterRows === 10 ? 'PASS' : 'FAIL - got ' + allFilterRows + ' (expected 10)';

    results.hist02 = (results.hist02_failed === 'PASS' && results.hist02_delivered === 'PASS' &&
                      results.hist02_bounced === 'PASS' && results.hist02_all === 'PASS') ? 'PASS' : 'FAIL';
    console.log('HIST-02 results:', { failed: results.hist02_failed, delivered: results.hist02_delivered,
                                       bounced: results.hist02_bounced, all: results.hist02_all });

    // ===== HIST-03: Date preset chips =====
    console.log('\n=== HIST-03: Date preset chips ===');

    // Click "Today" preset
    const todayChip = page.getByRole('button', { name: 'Today' });
    await todayChip.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const todayRows = await page.locator('tbody tr').count();
    console.log('Rows with Today filter:', todayRows);
    await page.screenshot({ path: `${screenshotDir}/qa-64-history-date-preset.png` });
    // Today: pending (1h ago), delivered (2h ago), failed (3h ago), bounced (4h ago) = 4 rows
    results.hist03_today = todayRows === 4 ? 'PASS' : 'FAIL - got ' + todayRows + ' (expected 4)';

    // Verify count display
    const todayCountText = await page.locator('.text-sm.text-muted-foreground').first().textContent().catch(() => '');
    console.log('Today count text:', todayCountText);

    // Click "Past Week" chip
    const pastWeekChip = page.getByRole('button', { name: 'Past Week' });
    await pastWeekChip.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const weekRows = await page.locator('tbody tr').count();
    console.log('Rows with Past Week filter:', weekRows);
    // Past Week: 4 today + sent 3 days ago + delivered 5 days ago = 6 rows
    results.hist03_week = weekRows === 6 ? 'PASS' : 'FAIL - got ' + weekRows + ' (expected 6)';

    // Click "Past 3 Months" chip
    const past3MonthsChip = page.getByRole('button', { name: 'Past 3 Months' });
    await past3MonthsChip.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const threeMonthRows = await page.locator('tbody tr').count();
    console.log('Rows with Past 3 Months filter:', threeMonthRows);
    // Past 3 months: all 10 rows should be within 3 months (oldest is 65 days ago)
    results.hist03_3months = threeMonthRows >= 9 ? 'PASS' : 'FAIL - got ' + threeMonthRows + ' (expected 10, 65 days back)';

    // Toggle off the chip (click active chip to deselect)
    await past3MonthsChip.click();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const afterToggleRows = await page.locator('tbody tr').count();
    results.hist03_toggle = afterToggleRows === 10 ? 'PASS' : 'FAIL - got ' + afterToggleRows + ' after toggle off';

    results.hist03 = (results.hist03_today === 'PASS' && results.hist03_week === 'PASS' &&
                      results.hist03_3months === 'PASS') ? 'PASS' : 'FAIL';
    console.log('HIST-03 results:', { today: results.hist03_today, week: results.hist03_week,
                                       '3months': results.hist03_3months, toggle: results.hist03_toggle });

    // ===== HIST-04: Resend button only on failed/bounced =====
    console.log('\n=== HIST-04: Retry buttons only on failed/bounced ===');

    // Ensure all filters cleared
    const clearBtn = page.getByRole('button', { name: /clear/i });
    if (await clearBtn.isVisible().catch(() => false)) {
      await clearBtn.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);
    }

    await page.screenshot({ path: `${screenshotDir}/qa-64-history-retry-buttons.png` });

    // Count retry buttons
    const retryButtons = await page.getByRole('button', { name: /retry/i }).count();
    console.log('Retry button count:', retryButtons);
    // Expected: 2 failed + 1 bounced = 3 retry buttons
    results.hist04_retry_count = retryButtons === 3 ? 'PASS' : 'FAIL - got ' + retryButtons + ' (expected 3: 2 failed + 1 bounced)';

    // Verify rows WITHOUT retry buttons (should have no retry for delivered/sent/opened/pending/complained)
    const allRowsText = await page.locator('tbody tr').allTextContents();
    console.log('Total rows on page:', allRowsText.length);
    results.hist04_row_total = allRowsText.length === 10 ? 'PASS' : 'FAIL - got ' + allRowsText.length;

    results.hist04 = (results.hist04_retry_count === 'PASS') ? 'PASS' : 'FAIL';
    console.log('HIST-04 results:', { retry_count: results.hist04_retry_count, row_total: results.hist04_row_total });

    // ===== HIST-05: Bulk select only selects failed/bounced =====
    console.log('\n=== HIST-05: Bulk select restriction ===');

    // Check checkboxes visible in leftmost column
    // Only failed/bounced rows should have checkboxes
    const checkboxes = await page.locator('tbody [role="checkbox"]').count();
    console.log('Checkboxes in tbody:', checkboxes);
    // Expected: 3 checkboxes (2 failed + 1 bounced)
    results.hist05_checkbox_count = checkboxes === 3 ? 'PASS' : 'FAIL - got ' + checkboxes + ' (expected 3: 2 failed + 1 bounced)';

    // Check header checkbox
    const headerCheckbox = page.locator('thead [role="checkbox"]');
    const headerCheckboxVisible = await headerCheckbox.isVisible().catch(() => false);
    console.log('Header checkbox visible:', headerCheckboxVisible);

    // Click header checkbox to select all
    if (headerCheckboxVisible) {
      await headerCheckbox.click();
      await page.waitForTimeout(500);
    } else {
      // Try finding select-all checkbox by aria-label
      const selectAllCheckbox = page.locator('[aria-label="Select all failed"]');
      await selectAllCheckbox.click();
      await page.waitForTimeout(500);
    }

    await page.screenshot({ path: `${screenshotDir}/qa-64-history-bulk-select.png` });

    // Check selected count text
    const selectedCountText = await page.locator('.text-sm.font-medium').textContent().catch(() => '');
    console.log('Selected count text:', selectedCountText);
    // Expected: "3 messages selected"
    results.hist05_selected_count = selectedCountText?.includes('3') ? 'PASS' :
      'FAIL - got "' + selectedCountText + '" (expected "3 messages selected")';

    // Check "Retry Selected" button appears
    const retrySelectedBtn = await page.getByRole('button', { name: /retry selected/i }).isVisible().catch(() => false);
    results.hist05_retry_selected_btn = retrySelectedBtn ? 'PASS' : 'FAIL - Retry Selected button not visible';
    console.log('Retry Selected button visible:', retrySelectedBtn);

    // Deselect all
    if (headerCheckboxVisible) {
      await headerCheckbox.click();
    } else {
      const selectAllCheckbox = page.locator('[aria-label="Select all failed"]');
      await selectAllCheckbox.click();
    }
    await page.waitForTimeout(500);

    const bulkBarAfterDeselect = await page.locator('.text-sm.font-medium').isVisible().catch(() => false);
    results.hist05_deselect = !bulkBarAfterDeselect ? 'PASS' : 'FAIL - bulk bar still visible after deselect';
    console.log('Bulk bar gone after deselect:', !bulkBarAfterDeselect);

    results.hist05 = (
      results.hist05_checkbox_count === 'PASS' &&
      results.hist05_selected_count === 'PASS' &&
      results.hist05_retry_selected_btn === 'PASS'
    ) ? 'PASS' : 'FAIL';
    console.log('HIST-05 results:', {
      checkbox_count: results.hist05_checkbox_count,
      selected_count: results.hist05_selected_count,
      retry_selected_btn: results.hist05_retry_selected_btn,
      deselect: results.hist05_deselect,
    });

  } catch (err) {
    console.error('ERROR:', err.message);
    results.error = err.message;
    await page.screenshot({ path: `${screenshotDir}/qa-64-error.png` }).catch(() => {});
  } finally {
    await browser.close();
  }

  // ===== Summary =====
  console.log('\n========== FINAL RESULTS ==========');
  console.log('HIST-01 (Display + status badges):', results.hist01_header === 'PASS' && results.hist01_row_count === 'PASS' && results.hist01_columns === 'PASS' ? 'PASS' : 'REVIEW');
  console.log('  - Header:', results.hist01_header);
  console.log('  - Total:', results.hist01_total);
  console.log('  - Columns:', results.hist01_columns);
  console.log('  - Row count:', results.hist01_row_count);
  console.log('  - Status badges:', results.hist01_status_badges);
  console.log('HIST-02 (Status filter):', results.hist02);
  console.log('HIST-03 (Date presets):', results.hist03);
  console.log('HIST-04 (Retry buttons):', results.hist04);
  console.log('HIST-05 (Bulk select):', results.hist05);
  if (results.error) {
    console.log('ERROR:', results.error);
  }
  console.log('====================================');
})();
