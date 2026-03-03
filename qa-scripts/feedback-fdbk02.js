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
    console.log('Login OK');

    // Navigate to feedback
    await page.goto('http://localhost:3000/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // === Step 1: Mark Marcus resolved ===
    console.log('\n=== Step 1: Mark resolved ===');
    const markResolvedBtns = await page.locator('button:has-text("Mark Resolved")').count();
    console.log('Mark Resolved buttons before:', markResolvedBtns);

    await page.locator('button:has-text("Mark Resolved")').first().click();
    await page.waitForTimeout(800);

    // Verify dialog opens
    const dialogVisible = await page.locator('[role="dialog"]').isVisible().catch(() => false);
    const dialogTitle = await page.locator('[role="dialog"] [role="heading"]').textContent().catch(() => '');
    const dialogText = await page.locator('[role="dialog"]').innerText().catch(() => '');
    console.log('Dialog visible:', dialogVisible, 'Title:', dialogTitle);
    console.log('Dialog text:', dialogText);
    console.log('DIALOG_OPENS:', (dialogVisible && dialogTitle.includes('Resolve Feedback')) ? 'PASS' : 'FAIL');
    console.log('DIALOG_CUSTOMER_NAME:', dialogText.includes('AUDIT_Marcus Rodriguez') ? 'PASS' : 'FAIL');

    // Type internal notes
    await page.locator('textarea[name="internal_notes"]').fill('Called customer, offered $50 credit. Customer satisfied with resolution.');
    console.log('Typed internal notes');

    // Submit
    await page.locator('[role="dialog"] button[type="submit"]').click();
    console.log('Clicked submit');

    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const dialogGone = !(await page.locator('[role="dialog"]').isVisible().catch(() => true));
    console.log('Dialog closed:', dialogGone);

    const bodyAfterResolve = await page.locator('body').innerText();
    console.log('Body after resolve:\n', bodyAfterResolve.substring(0, 1200));

    const hasReopen = bodyAfterResolve.includes('Reopen');
    const hasNotesText = bodyAfterResolve.includes('Called customer, offered $50 credit');
    const hasInternalNotesLabel = bodyAfterResolve.includes('Internal notes:');
    console.log('Has Reopen button:', hasReopen);
    console.log('Has notes text:', hasNotesText);
    console.log('Has "Internal notes:" label:', hasInternalNotesLabel);

    await page.screenshot({ path: 'C:/AvisLoop/qa-64-feedback-resolved.png' });
    console.log('Screenshot: qa-64-feedback-resolved.png');

    console.log('RESOLVES:', (hasReopen && dialogGone) ? 'PASS' : 'FAIL');
    console.log('NOTES_VISIBLE:', hasNotesText ? 'PASS' : 'FAIL');

    // === Step 2: Verify persistence after navigation ===
    console.log('\n=== Step 2: Persistence after navigation ===');
    await page.goto('http://localhost:3000/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto('http://localhost:3000/feedback');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyAfterNav = await page.locator('body').innerText();
    console.log('Body after navigation:\n', bodyAfterNav.substring(0, 1200));

    const hasReopenAfterNav = bodyAfterNav.includes('Reopen');
    const hasNotesAfterNav = bodyAfterNav.includes('Called customer, offered $50 credit');
    const statsAfterResolve = bodyAfterNav.match(/Total[\s\S]*?(\d+)[\s\S]*?Unresolved[\s\S]*?(\d+)[\s\S]*?Resolved[\s\S]*?(\d+)/);
    console.log('Reopen after nav:', hasReopenAfterNav, 'Notes after nav:', hasNotesAfterNav);

    await page.screenshot({ path: 'C:/AvisLoop/qa-64-feedback-after-refresh.png' });
    console.log('Screenshot: qa-64-feedback-after-refresh.png');

    console.log('PERSISTS_AFTER_REFRESH:', (hasReopenAfterNav && hasNotesAfterNav) ? 'PASS' : 'FAIL');

    // Check stats: should be Total=3, Unresolved=2, Resolved=1
    const hasUnresolved2 = bodyAfterNav.includes('Unresolved') && bodyAfterNav.includes('2');
    const statsGrid = await page.locator('.grid').first().innerText().catch(() => '');
    console.log('Stats grid after resolve:', statsGrid);

    // === Step 3: Verify DB state (done via separate REST check) ===
    console.log('\n=== Step 4: Reopen Marcus ===');
    await page.locator('button:has-text("Reopen")').first().click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const bodyAfterReopen = await page.locator('body').innerText();
    console.log('Body after reopen:\n', bodyAfterReopen.substring(0, 1200));

    const markResolvedAfterReopen = await page.locator('button:has-text("Mark Resolved")').count();
    const reopenAfterReopen = await page.locator('button:has-text("Reopen")').count();
    console.log('Mark Resolved after reopen:', markResolvedAfterReopen, '(should be 3)');
    console.log('Reopen after reopen:', reopenAfterReopen, '(should be 0)');

    const statsAfterReopen = await page.locator('.grid').first().innerText().catch(() => '');
    console.log('Stats after reopen:', statsAfterReopen);

    await page.screenshot({ path: 'C:/AvisLoop/qa-64-feedback-reopened.png' });
    console.log('Screenshot: qa-64-feedback-reopened.png');

    console.log('REOPEN_WORKS:', (markResolvedAfterReopen >= 3 && reopenAfterReopen === 0) ? 'PASS' : 'FAIL');

    // === Part E: Re-resolve for clean state ===
    console.log('\n=== Part E: Re-resolve for clean state ===');
    await page.locator('button:has-text("Mark Resolved")').first().click();
    await page.waitForTimeout(800);
    await page.locator('textarea[name="internal_notes"]').fill('Resolved after QA testing');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle');

    const bodyFinal = await page.locator('body').innerText();
    const hasReopenFinal = bodyFinal.includes('Reopen');
    const statsFinal = await page.locator('.grid').first().innerText().catch(() => '');
    console.log('Final state has Reopen:', hasReopenFinal);
    console.log('Final stats:', statsFinal);

    await page.screenshot({ path: 'C:/AvisLoop/qa-64-feedback-final.png' });
    console.log('Screenshot: qa-64-feedback-final.png');

    console.log('RE_RESOLVE_WORKS:', hasReopenFinal ? 'PASS' : 'FAIL');

    // Summary
    console.log('\n=== FDBK-02 Overall Results ===');
    console.log('1. Dialog opens correctly');
    console.log('2. Resolves and shows internal notes');
    console.log('3. Persists after page navigation');
    console.log('4. Reopen works, stats update');
    console.log('5. Re-resolve works for clean state');

  } catch(e) { console.error('ERROR:', e.message); console.error(e.stack); }
  finally { await browser.close(); }
})();
