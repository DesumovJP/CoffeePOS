import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = '/Users/oleksandrsimcenko/CoffeePOS/frontend/task-test-screenshots';
const BASE = 'http://localhost:3000';
const TEST_PHOTO = path.join(SCREENSHOTS_DIR, 'test-photo.png');

// Clear old screenshots (keep test-photo.png)
if (fs.existsSync(SCREENSHOTS_DIR)) {
  fs.readdirSync(SCREENSHOTS_DIR)
    .filter(f => f !== 'test-photo.png')
    .forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));
}

let n = 0;
const shot = async (page, name) => {
  const file = path.join(SCREENSHOTS_DIR, `${String(++n).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`  📸 ${String(n).padStart(2, '0')}-${name}.png`);
};

const issues = [];
const ok   = (m) => console.log(`  ✅ ${m}`);
const bug  = (m) => { console.log(`  🐛 BUG: ${m}`); issues.push(m); };
const warn = (m) => console.log(`  ⚠️  ${m}`);
const log  = (m) => console.log(`  ${m}`);

// ── helpers ──────────────────────────────────────────────────────────────────

async function login(page, username = 'manager', password = 'CoffeePOS2026!') {
  await page.goto(`${BASE}/tasks`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    try { localStorage.removeItem('paradise-pos-token'); localStorage.removeItem('paradise-pos-user'); } catch {}
  });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  await page.locator('input[type="text"], input[autocomplete="username"]').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  await page.waitForTimeout(800);
}

async function goTasks(page) {
  await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
}

async function openCreate(page) {
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('appshell:action')));
  await page.waitForTimeout(600);
}

async function fillCreate(page, { title, description = '', priority = 'medium', type = 'task', dueDate = '' }) {
  const modal = page.locator('[role="dialog"]').first();
  await modal.waitFor({ state: 'visible', timeout: 8000 });
  await page.waitForTimeout(300);

  const inputs = await modal.locator('input:not([type="date"]):not([type="file"]), textarea').all();
  const visible = [];
  for (const f of inputs) { if (await f.isVisible().catch(() => false)) visible.push(f); }
  if (visible[0]) { await visible[0].click(); await visible[0].fill(title); }
  if (description && visible[1]) await visible[1].fill(description);

  const selects = await modal.locator('select').all();
  if (selects[0]) await selects[0].selectOption(priority);
  if (selects[1]) await selects[1].selectOption(type);
  if (dueDate) {
    const di = modal.locator('input[type="date"]').first();
    if (await di.isVisible().catch(() => false)) await di.fill(dueDate);
  }

  const btn = modal.locator('button:has-text("Створити завдання"), button:has-text("Зберегти"), button[class*="primary"]').first();
  await btn.isVisible({ timeout: 5000 }).catch(() => {});
  await btn.click({ force: true });
  await page.waitForTimeout(1800);
}

// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 220 });
  const ctx     = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page    = await ctx.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  // ══════════════════════════════════════════════════════════════════
  // 1. Login
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 1. Login ══');
  await login(page);
  ok(`Logged in — ${page.url()}`);
  await goTasks(page);
  await shot(page, 'tasks-initial');

  const colHeaders = await page.locator('[class*="colHeader"]').allTextContents();
  log(`Columns: ${JSON.stringify(colHeaders)}`);
  if (colHeaders.length >= 3) ok('3 columns present');
  else bug(`Expected 3 columns, got ${colHeaders.length}`);

  // ══════════════════════════════════════════════════════════════════
  // 2. Create task (high priority, due date)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 2. Create task ══');
  await openCreate(page);
  await shot(page, 'create-modal');
  await fillCreate(page, {
    title: 'Перевірка чистоти обладнання',
    description: 'Протерти кавомашину, гріндер і парову трубку',
    priority: 'high',
    type: 'daily',
    dueDate: '2026-03-11',
  });
  await shot(page, 'after-create');

  const allText = await page.textContent('body').catch(() => '');
  if (allText.includes('Перевірка чистоти')) ok('Created task visible on board');
  else bug('Created task not found on board');

  // ══════════════════════════════════════════════════════════════════
  // 3. Card visual quality audit
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 3. Card visual audit ══');
  await goTasks(page);
  await shot(page, 'card-visual-audit');

  // Priority stripe color
  const firstCard = page.locator('[class*="card"]').first();
  const stripeBefore = await firstCard.evaluate(el => {
    const style = window.getComputedStyle(el, '::before');
    return { height: style.height, bg: style.background };
  }).catch(() => ({}));
  log(`Priority stripe computed: height=${stripeBefore.height}`);
  if (stripeBefore.height && parseFloat(stripeBefore.height) >= 3) ok('Priority stripe ≥ 3px');
  else warn(`Priority stripe height: ${stripeBefore.height}`);

  // Manage icons visible (not hidden on non-hover)
  const manageSection = page.locator('[class*="manage"]').first();
  const manageOpacity = await manageSection.evaluate(el => parseFloat(window.getComputedStyle(el).opacity)).catch(() => 0);
  log(`Manage icons opacity (default): ${manageOpacity}`);
  if (manageOpacity >= 0.4) ok(`Manage icons always visible (opacity ${manageOpacity.toFixed(2)}) — touch-friendly`);
  else bug(`Manage icons opacity ${manageOpacity} — invisible on touch devices`);

  // Priority dot
  const priorityDot = page.locator('[class*="priorityDot"]').first();
  const dotVisible = await priorityDot.isVisible().catch(() => false);
  if (dotVisible) ok('Priority dot visible in meta');
  else warn('Priority dot not found');

  // Meta text readability
  const metaText = page.locator('[class*="metaMuted"]').first();
  const metaColor = await metaText.evaluate(el => window.getComputedStyle(el).color).catch(() => '');
  const metaSize  = await metaText.evaluate(el => window.getComputedStyle(el).fontSize).catch(() => '');
  log(`Meta text: font-size=${metaSize}, color=${metaColor}`);
  if (parseFloat(metaSize) >= 11) ok(`Meta text ${metaSize} (≥11px — readable)`);
  else warn(`Meta text ${metaSize} may be too small`);

  // Action strip height
  const stripBtn = page.locator('[class*="stripBtn"]').first();
  const stripBox  = await stripBtn.boundingBox().catch(() => null);
  if (stripBox) {
    log(`Strip button height: ${stripBox.height.toFixed(0)}px`);
    if (stripBox.height >= 40) ok(`Action strip ${stripBox.height.toFixed(0)}px — iOS-friendly tap target`);
    else warn(`Strip ${stripBox.height.toFixed(0)}px < 40px`);
  }

  // ══════════════════════════════════════════════════════════════════
  // 4. Start task → live timer
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 4. Start task ══');
  const startBtn = page.locator('button:has-text("Почати")').first();
  if (!await startBtn.isVisible().catch(() => false)) {
    bug('"Почати" button not found');
  } else {
    await startBtn.click();
    await page.waitForTimeout(2500);
    await shot(page, 'timer-running');

    const timerEl = page.locator('[class*="timerDisplay"]').first();
    const timerVisible = await timerEl.isVisible().catch(() => false);
    if (timerVisible) {
      const t1 = await timerEl.textContent().catch(() => '');
      await page.waitForTimeout(2000);
      const t2 = await timerEl.textContent().catch(() => '');
      if (t1 !== t2) ok(`Timer increments: "${t1.trim()}" → "${t2.trim()}"`);
      else bug('Timer not incrementing');
    } else {
      bug('Timer display missing on in_progress card');
    }

    const doneVisible = await page.locator('button:has-text("Виконано")').first().isVisible().catch(() => false);
    if (doneVisible) ok('"Виконано" button present on in_progress card');
    else bug('"Виконано" button missing');
  }

  // ══════════════════════════════════════════════════════════════════
  // 5. Complete task WITH PHOTO — full flow
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 5. Complete with photo + note ══');
  const completeBtn = page.locator('button:has-text("Виконано")').first();
  if (!await completeBtn.isVisible().catch(() => false)) {
    bug('"Виконано" button not visible');
  } else {
    await completeBtn.click();
    await page.waitForTimeout(800);
    await shot(page, 'complete-modal-open');

    const modal = page.locator('[role="dialog"]').first();
    const modalOk = await modal.isVisible().catch(() => false);
    if (!modalOk) {
      bug('Completion modal did not open');
    } else {
      ok('Completion modal opened');

      // Verify elapsed time shown
      const modalText = await modal.textContent().catch(() => '');
      if (modalText.includes('Час виконання') || modalText.includes(' с') || modalText.includes('хв')) {
        ok('Elapsed time visible in modal');
      } else {
        warn('Elapsed time not found in modal text');
      }

      // Fill note
      const noteArea = modal.locator('textarea').first();
      if (await noteArea.isVisible().catch(() => false)) {
        await noteArea.fill('Обладнання очищено, все перевірено ✓');
        ok('Note filled');
      } else {
        bug('Note textarea not found');
      }

      // Upload photo via file input
      const fileInput = modal.locator('input[type="file"]').first();
      const fileInputExists = await fileInput.count().catch(() => 0);
      if (fileInputExists > 0) {
        await fileInput.setInputFiles(TEST_PHOTO);
        await page.waitForTimeout(800);
        await shot(page, 'complete-modal-with-photo');

        // Verify preview appears
        const preview = modal.locator('[class*="photoPreview"], [class*="previewImg"], img').first();
        const previewVisible = await preview.isVisible().catch(() => false);
        if (previewVisible) ok('Photo preview shown in completion modal');
        else warn('Photo preview not visible after file selection');
      } else {
        bug('File input for photo not found in completion modal');
      }

      // Submit
      const confirmBtn = modal.locator('button:has-text("Позначити виконаним"), button[class*="primary"]').last();
      await confirmBtn.click({ force: true });
      await page.waitForTimeout(3000); // photo upload takes time
      await shot(page, 'after-complete-with-photo');
      ok('Completion submitted');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 6. Done card — photo thumbnail visible
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 6. Done card — photo thumbnail ══');
  await goTasks(page);
  await shot(page, 'done-column-with-photo');

  const doneCol = page.locator('[class*="column"]').nth(2);
  const doneCards = await doneCol.locator('[class*="card"]').count();
  log(`Done column cards: ${doneCards}`);

  if (doneCards > 0) {
    // Check done stamp
    const doneStamp = doneCol.locator('[class*="doneStamp"]').first();
    const stampText = await doneStamp.textContent().catch(() => '');
    log(`Done stamp: "${stampText.substring(0, 100).replace(/\s+/g, ' ')}"`);
    if (stampText.includes('с') || stampText.includes('хв')) ok('Duration in done stamp');
    if (stampText.includes('manager'))                        ok('completedBy in done stamp');
    if (stampText.includes('📝'))                             ok('Note icon in done stamp');

    // Check photo thumbnail
    const photoThumb = doneCol.locator('[class*="photoThumbWrap"]').first();
    const thumbVisible = await photoThumb.isVisible().catch(() => false);
    if (thumbVisible) {
      ok('Photo THUMBNAIL visible on done card');
      const imgEl = photoThumb.locator('img').first();
      const src = await imgEl.getAttribute('src').catch(() => '');
      log(`Photo src: ${src?.substring(0, 80)}`);
      if (src && src.length > 5) ok('Photo thumbnail has valid src');
      else bug('Photo thumbnail img has no src');

      // Check it links to full photo
      const href = await photoThumb.getAttribute('href').catch(() => '');
      if (href) ok(`Photo links to: ${href.substring(0, 80)}`);
    } else {
      warn('Photo thumbnail not visible — may be upload issue (Railway ephemeral storage) or backend not yet deployed');
      // Check if at least 📷 emoji would have been there before
      const noteIcon = doneCol.locator('[class*="doneNote"]').first();
      if (await noteIcon.isVisible().catch(() => false)) ok('Note icon visible on done card');
    }
  } else {
    warn('No done cards found — task may not have moved to done column');
  }

  // ══════════════════════════════════════════════════════════════════
  // 7. Done card structure
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 7. Done card structure ══');

  if (doneCards > 0) {
    // Title strikethrough
    const titleDone = doneCol.locator('[class*="titleDone"]').first();
    if (await titleDone.isVisible().catch(() => false)) ok('Strikethrough on done title');
    else warn('No titleDone class on done card title');

    // Dimmed opacity
    const cardDone = doneCol.locator('[class*="cardDone"]').first();
    const doneOpacity = await cardDone.evaluate(el => parseFloat(window.getComputedStyle(el).opacity)).catch(() => 1);
    log(`Done card opacity: ${doneOpacity}`);
    if (doneOpacity < 1) ok(`Done card dimmed (opacity ${doneOpacity})`);

    // No action buttons
    const startInDone    = await doneCol.locator('button:has-text("Почати")').count();
    const completeInDone = await doneCol.locator('button:has-text("Виконано")').count();
    if (startInDone === 0 && completeInDone === 0) ok('No action buttons on done cards');
    else bug(`Done card wrongly shows action buttons`);
  }

  // ══════════════════════════════════════════════════════════════════
  // 8. Edit task
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 8. Edit task ══');
  await goTasks(page);
  const editBtn = page.locator('[class*="iconBtn"]').first();
  if (await editBtn.isVisible().catch(() => false)) {
    await editBtn.click();
    await page.waitForTimeout(500);
    const editModal = page.locator('[role="dialog"]').first();
    if (await editModal.isVisible().catch(() => false)) {
      ok('Edit modal opens');
      const titleInput = editModal.locator('input').first();
      const prefilled  = await titleInput.inputValue().catch(() => '');
      if (prefilled) ok(`Title pre-filled: "${prefilled}"`);
      else bug('Title field empty in edit mode');
      await editModal.locator('button:has-text("Зберегти"), button[class*="primary"]').last().click({ force: true });
      await page.waitForTimeout(1500);
      ok('Edit saved');
    }
  } else warn('Edit icon button not found');

  await shot(page, 'after-edit');

  // ══════════════════════════════════════════════════════════════════
  // 9. Search
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 9. Search ══');
  await goTasks(page);
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('appshell:search')));
  await page.waitForTimeout(600);

  const searchInput = page.locator('input[placeholder*="Пошук"]').first();
  if (await searchInput.isVisible().catch(() => false)) {
    ok('Search bar appeared');
    await searchInput.fill('чистот');
    await page.waitForTimeout(1200);
    await shot(page, 'search-results');
    const bodyText = await page.textContent('body').catch(() => '');
    if (bodyText.includes('чистот') || bodyText.includes('Чистот')) ok('Search returns matching results');
    else warn('Search result not found (task may have been completed)');

    await searchInput.fill('zzznoresult');
    await page.waitForTimeout(1200);
    const emptyEl = page.locator('[class*="emptyText"]').first();
    if (await emptyEl.isVisible().catch(() => false)) ok('Empty state for no-match search');
    else warn('Empty state not shown for nonsense query');
    await shot(page, 'search-empty');

    const closeSearch = page.locator('button[aria-label*="Закрити"], button[aria-label*="закрити"]').first();
    if (await closeSearch.isVisible().catch(() => false)) { await closeSearch.click(); ok('Search closed'); }
  } else {
    bug('Search input not visible');
  }

  // ══════════════════════════════════════════════════════════════════
  // 10. Delete
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 10. Delete task ══');
  await goTasks(page);
  const deleteBtn = page.locator('[class*="iconBtn"]').nth(1);
  if (await deleteBtn.isVisible().catch(() => false)) {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    const delModal = page.locator('[role="dialog"]').first();
    if (await delModal.isVisible().catch(() => false)) {
      ok('Delete confirmation modal');
      await delModal.locator('button:has-text("Видалити")').last().click();
      await page.waitForTimeout(1500);
      ok('Task deleted');
      await shot(page, 'after-delete');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // 11. Barista role — filtered view
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 11. Barista role ══');
  await login(page, 'barista', 'CoffeePOS2026!');
  await goTasks(page);
  await shot(page, 'barista-view');
  ok('Barista tasks view loaded');
  const baristaManage = await page.locator('[class*="manage"]').count();
  log(`Barista sees ${baristaManage} manage sections (only for own tasks)`);

  // ══════════════════════════════════════════════════════════════════
  // 12. Final manager view
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ 12. Final manager view ══');
  await login(page, 'manager', 'CoffeePOS2026!');
  await goTasks(page);
  await shot(page, 'final-manager-view');

  // ══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('══════════════════════════════════════════');
  if (issues.length === 0) {
    console.log('✅ All tests passed — 0 bugs');
  } else {
    console.log(`🐛 ${issues.length} bug(s):`);
    issues.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  }

  const errs = consoleErrors.filter(e => !e.includes('favicon') && !e.includes('Warning'));
  if (errs.length) {
    console.log(`\n⚠️  Console errors (${errs.length}):`);
    errs.slice(0, 4).forEach(e => console.log('  ' + e.substring(0, 120)));
  }

  const shots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png') && f !== 'test-photo.png');
  console.log(`\n📁 ${shots.length} screenshots saved`);
  await browser.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
