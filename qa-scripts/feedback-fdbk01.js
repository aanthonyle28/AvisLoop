const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  try {
    // Login
    await page.goto('http://localhost:3000/auth/login');
    await page.waitForLoadState('networkidle');
    await page.getByRole('textbox', { name: /email/i }).fill('audit-test@avisloop.com');
    await page.locator('input[type="password"]').first().fill('AuditTest123!');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/dashboard|jobs|campaigns/, { timeout: 15000 });
    console.log('Login OK, URL:', page.url());

    // FDBK-01: Navigate to feedback page (data seeded separately)
    await page.goto('http://localhost:3000/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.screenshot({ path: 'C:/AvisLoop/qa-64-feedback-list-desktop.png' });
    console.log('Screenshot: qa-64-feedback-list-desktop.png');

    const body = await page.locator('body').innerText();
    console.log('PAGE BODY:\n', body.substring(0, 2500));

    // Header check
    const h1 = await page.locator('h1').first().textContent();
    console.log('H1:', h1);

    // Stats check
    const hasTotal = body.includes('Total');
    const hasUnresolved = body.includes('Unresolved');
    const hasAvgRating = body.includes('Avg Rating');
    console.log('Stats - Total:', hasTotal, 'Unresolved:', hasUnresolved, 'Avg Rating:', hasAvgRating);

    // Stats numbers
    const statsGrid = await page.locator('.grid').first().innerText().catch(() => '');
    console.log('Stats grid:', statsGrid);

    // Customer names
    const hasMarcus = body.includes('AUDIT_Marcus Rodriguez');
    const hasPatricia = body.includes('AUDIT_Patricia Johnson');
    const hasSarah = body.includes('AUDIT_Sarah Chen');
    console.log('Customers - Marcus:', hasMarcus, 'Patricia:', hasPatricia, 'Sarah:', hasSarah);

    // Emails visible
    const hasMarcusEmail = body.includes('audit-marcus@example.com');
    const hasPatriciaEmail = body.includes('audit-patricia@example.com');
    const hasSarahEmail = body.includes('audit-sarah@example.com');
    console.log('Emails - Marcus:', hasMarcusEmail, 'Patricia:', hasPatriciaEmail, 'Sarah:', hasSarahEmail);

    // Feedback text
    const hasMarcusText = body.includes('technician was 30 minutes late');
    const hasPatriciaText = body.includes('Service was okay but pricing');
    // Sarah has NULL feedback_text
    const sarahText = body.includes('AUDIT_Sarah Chen');
    console.log('Feedback text - Marcus:', hasMarcusText, 'Patricia:', hasPatriciaText);

    // Mark Resolved buttons
    const resolveCount = await page.locator('button:has-text("Mark Resolved")').count();
    console.log('Mark Resolved buttons:', resolveCount);

    // Email links
    const emailCount = await page.locator('a:has-text("Email")').count();
    console.log('Email links:', emailCount);

    // Subtitle
    const subtitleEl = await page.locator('p.text-muted-foreground').first().textContent();
    console.log('Subtitle:', subtitleEl);

    console.log('\n=== FDBK-01 Results ===');
    console.log('HEADER:', h1 && h1.includes('Customer Feedback') ? 'PASS' : 'FAIL');
    console.log('STATS_BAR:', (hasTotal && hasUnresolved && hasAvgRating) ? 'PASS' : 'FAIL');
    console.log('ALL_CUSTOMERS:', (hasMarcus && hasPatricia && hasSarah) ? 'PASS' : 'FAIL');
    console.log('FEEDBACK_TEXT:', (hasMarcusText && hasPatriciaText) ? 'PASS' : 'FAIL');
    console.log('RESOLVE_BTNS:', (resolveCount >= 3) ? 'PASS' : 'FAIL');
    console.log('EMAIL_LINKS:', (emailCount >= 3) ? 'PASS' : 'FAIL');

  } catch(e) { console.error('ERROR:', e.message); console.error(e.stack); }
  finally { await browser.close(); }
})();
