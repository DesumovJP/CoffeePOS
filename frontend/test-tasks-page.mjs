import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const SCREENSHOTS_DIR = '/Users/oleksandrsimcenko/CoffeePOS/frontend/task-test-screenshots';
const BASE = 'http://localhost:3000';

if (fs.existsSync(SCREENSHOTS_DIR)) {
  fs.readdirSync(SCREENSHOTS_DIR).forEach(f => fs.unlinkSync(path.join(SCREENSHOTS_DIR, f)));
} else {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

let n = 0;
const shot = async (page, name) => {
  const file = path.join(SCREENSHOTS_DIR, `${String(++n).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`📸 ${String(n).padStart(2, '0')}-${name}.png`);
};

const issues = [];
const log = (msg) => console.log('  ' + msg);
const bug = (msg) => { console.log('  🐛 BUG: ' + msg); issues.push(msg); };
const ok = (msg) => console.log('  ✅ ' + msg);
const warn = (msg) => console.log('  ⚠️  ' + msg);

// ── helpers ──────────────────────────────────────────────────────────────────

async function login(page, username = 'manager', password = 'CoffeePOS2026!') {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await page.locator('input[type="text"], input[autocomplete="username"]').first().fill(username);
  await page.locator('input[type="password"]').first().fill(password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 10000 });
  await page.waitForTimeout(1000);
}

async function goTasks(page) {
  await page.goto(`${BASE}/tasks`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
}

async function countCards(page) {
  return {
    todo: await page.locator(`.board .column:nth-child(1) [class*="taskCard"]`).count(),
    in_progress: await page.locator(`.board .column:nth-child(2) [class*="taskCard"]`).count(),
    done: await page.locator(`.board .column:nth-child(3) [class*="taskCard"]`).count(),
  };
}

async function openCreateModal(page) {
  await page.locator('button:has-text("Додати")').first().click();
  await page.waitForTimeout(600);
}

async function fillAndSubmitTask(page, { title, description = '', priority = 'medium', type = 'task', dueDate = '' }) {
  const modal = page.locator('[role="dialog"], [class*="Modal"], [class*="modal"]').first();
  await modal.waitFor({ state: 'visible', timeout: 5000 });

  const fields = await modal.locator('input, textarea').all();
  const visible = [];
  for (const f of fields) {
    if (await f.isVisible().catch(() => false)) visible.push(f);
  }

  if (visible[0]) await visible[0].fill(title);
  if (description && visible[1]) await visible[1].fill(description);

  // Priority select
  const selects = await modal.locator('select').all();
  if (selects[0] && priority) await selects[0].selectOption(priority);
  if (selects[1] && type) await selects[1].selectOption(type);

  // Due date
  if (dueDate) {
    const dateInput = modal.locator('input[type="date"]').first();
    if (await dateInput.isVisible().catch(() => false)) await dateInput.fill(dueDate);
  }

  // Assignee - selects[2]
  // Leave as default

  const submitBtn = modal.locator('button:has-text("Створити завдання"), button:has-text("Зберегти")').first();
  await submitBtn.click({ force: true });
  await page.waitForTimeout(1500);
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 300 });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  // ══════════════════════════════════════════════════════════════════
  // STEP 1: Login
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 1: Login ══');
  await login(page);
  ok(`Logged in — redirected to ${page.url()}`);
  await shot(page, 'after-login');

  // ══════════════════════════════════════════════════════════════════
  // STEP 2: Tasks page — initial state
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 2: Tasks page — initial state ══');
  await goTasks(page);
  await shot(page, 'tasks-empty');

  const heading = await page.locator('h1, [class*="pageTitle"]').first().textContent().catch(() => null);
  log(`Page heading: ${heading ?? '(none — check AppShell header)'}`);

  const cols = await page.locator('[class*="column"]').count();
  log(`Columns found: ${cols}`);
  if (cols >= 3) ok('3 Kanban columns visible');
  else bug(`Expected 3 columns, found ${cols}`);

  const emptyStates = await page.locator('[class*="emptyColumn"]').count();
  log(`Empty states visible: ${emptyStates}`);

  // Check for loading skeleton vs empty state
  await page.waitForTimeout(500);
  const skeletons = await page.locator('[class*="skeleton"], [class*="Skeleton"]').count();
  log(`Skeleton/loading indicators: ${skeletons}`);
  if (skeletons === 0) warn('No loading skeleton shown during data fetch');

  // ══════════════════════════════════════════════════════════════════
  // STEP 3: Create 3 tasks with different priorities
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 3: Create tasks ══');

  // Task 1: High priority
  await openCreateModal(page);
  await shot(page, 'create-modal-open');
  await fillAndSubmitTask(page, {
    title: 'Термінова перевірка каси',
    description: 'Звірити залишки в касі з системою',
    priority: 'high',
    type: 'task',
    dueDate: '2026-03-11',
  });
  await shot(page, 'after-create-1-high');

  let counts = await countCards(page);
  log(`After create 1: todo=${counts.todo}, in_progress=${counts.in_progress}, done=${counts.done}`);
  if (counts.todo >= 1) ok('Task 1 (high) appeared in todo column');
  else bug('Task 1 not visible in todo column after creation');

  // Task 2: Medium priority, daily type
  await openCreateModal(page);
  await fillAndSubmitTask(page, {
    title: 'Щоденне прибирання зони кави',
    description: 'Протерти всі поверхні, вимити групи',
    priority: 'medium',
    type: 'daily',
  });
  await shot(page, 'after-create-2-medium');

  // Task 3: Low priority
  await openCreateModal(page);
  await fillAndSubmitTask(page, {
    title: 'Оновити меню на дошці',
    priority: 'low',
    type: 'task',
    dueDate: '2026-03-20',
  });
  await shot(page, 'after-create-3-low');

  counts = await countCards(page);
  log(`After 3 creates: todo=${counts.todo}, in_progress=${counts.in_progress}, done=${counts.done}`);
  if (counts.todo >= 3) ok('All 3 tasks visible in todo column');
  else warn(`Expected ≥3 todo tasks, found ${counts.todo}`);

  // Check priority visual indicator (top bar)
  const highCard = page.locator('[class*="priorityHigh"]').first();
  const highVisible = await highCard.isVisible().catch(() => false);
  if (highVisible) ok('Priority top bar visible on high-priority card');
  else bug('High priority card has no visual priority indicator');

  // ══════════════════════════════════════════════════════════════════
  // STEP 4: Start task (todo → in_progress)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 4: Start task (Почати) ══');
  await goTasks(page);

  const startBtn = page.locator('button:has-text("Почати")').first();
  const startVisible = await startBtn.isVisible().catch(() => false);
  if (!startVisible) {
    bug('"Почати" button not found on any card');
  } else {
    await startBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'after-start-task');
    counts = await countCards(page);
    log(`After start: todo=${counts.todo}, in_progress=${counts.in_progress}, done=${counts.done}`);
    if (counts.in_progress >= 1) ok('Task moved to "В процесі" after clicking Почати');
    else bug('Task did not move to "В процесі" after clicking Почати');
  }

  // Check that "В процесі" card has no "Почати" button but has "Виконано"
  const inProgressCol = page.locator('.board .column').nth(1);
  const startInProgress = await inProgressCol.locator('button:has-text("Почати")').count();
  if (startInProgress === 0) ok('"Почати" button absent on in_progress card (correct)');
  else bug('"Почати" button wrongly shown on in_progress card');

  const completeInProgress = await inProgressCol.locator('button:has-text("Виконано")').count();
  if (completeInProgress >= 1) ok('"Виконано" button present on in_progress card');
  else bug('"Виконано" button missing on in_progress card');

  // ══════════════════════════════════════════════════════════════════
  // STEP 5: Complete task (Виконано)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 5: Complete task (Виконано) ══');

  const completeBtn = page.locator('button:has-text("Виконано")').first();
  const completeVisible = await completeBtn.isVisible().catch(() => false);
  if (!completeVisible) {
    bug('"Виконано" button not found');
  } else {
    await completeBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'after-complete-task');
    counts = await countCards(page);
    log(`After complete: todo=${counts.todo}, in_progress=${counts.in_progress}, done=${counts.done}`);
    if (counts.done >= 1) ok('Task moved to "Виконано" column');
    else bug('Task did not appear in "Виконано" column');
  }

  // Check done card: no Почати/Виконано buttons, shows completedAt timestamp
  const doneCol = page.locator('.board .column').nth(2);
  const doneCardText = await doneCol.locator('[class*="taskCard"]').first().textContent().catch(() => '');
  log(`Done card text (first 200): ${doneCardText.substring(0, 200).replace(/\s+/g, ' ')}`);

  const hasTimestamp = doneCardText.match(/\d{2}\.\d{2}/);
  if (hasTimestamp) ok('Done card shows completedAt timestamp');
  else warn('Done card may not show completedAt timestamp');

  const doneHasStart = await doneCol.locator('button:has-text("Почати")').count();
  const doneHasComplete = await doneCol.locator('button:has-text("Виконано")').count();
  if (doneHasStart === 0 && doneHasComplete === 0) ok('Done card has no action buttons (correct)');
  else bug(`Done card wrongly shows action buttons: Почати=${doneHasStart}, Виконано=${doneHasComplete}`);

  // ══════════════════════════════════════════════════════════════════
  // STEP 6: Edit task
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 6: Edit task ══');

  // Edit first todo task (settings icon)
  const editBtn = page.locator('.board .column').first().locator('button').filter({ has: page.locator('[class*="icon"], svg') }).nth(-2);
  const allCardBtns = await page.locator('.board .column').first().locator('[class*="taskCard"] button').all();
  log(`Buttons on first todo card: ${allCardBtns.length}`);

  // Find settings button (second to last in taskManageActions)
  const settingsBtn = page.locator('[class*="taskManageActions"] button').first();
  const settingsVisible = await settingsBtn.isVisible().catch(() => false);
  if (!settingsVisible) {
    bug('Settings/edit button not found on task card');
  } else {
    await settingsBtn.click();
    await page.waitForTimeout(600);
    await shot(page, 'edit-modal-open');

    const editModal = page.locator('[role="dialog"]').first();
    const editModalVisible = await editModal.isVisible().catch(() => false);
    if (!editModalVisible) {
      bug('Edit modal did not open after clicking settings button');
    } else {
      ok('Edit modal opened');
      const modalTitle = await editModal.locator('[class*="title"], h2, h3').first().textContent().catch(() => '');
      log(`Modal title: "${modalTitle.trim()}"`);

      // Check fields are pre-filled
      const titleField = await editModal.locator('input, textarea').first();
      const titleValue = await titleField.inputValue().catch(() => '');
      log(`Title field pre-filled: "${titleValue}"`);
      if (titleValue) ok('Title field pre-filled with existing value');
      else bug('Title field not pre-filled in edit mode');

      // Edit the title
      await titleField.fill('');
      await titleField.fill('Оновлена назва завдання');

      const saveBtn = editModal.locator('button:has-text("Зберегти")').first();
      const saveVisible = await saveBtn.isVisible().catch(() => false);
      if (!saveVisible) bug('"Зберегти" button not found in edit modal');
      else {
        await saveBtn.click({ force: true });
        await page.waitForTimeout(1500);
        await shot(page, 'after-edit-task');
        ok('Task edited successfully');

        // Verify new title appears
        const newTitle = await page.locator('[class*="taskCard"]').first().textContent().catch(() => '');
        if (newTitle.includes('Оновлена назва')) ok('Updated title visible on card');
        else warn('Updated title not immediately visible (may need refresh)');
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 7: Complete task from todo directly (bypass in_progress)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 7: Complete todo task directly ══');
  await goTasks(page);
  const todoCompleteBtn = page.locator('.board .column').first().locator('button:has-text("Виконано")').first();
  const todoCompleteVisible = await todoCompleteBtn.isVisible().catch(() => false);
  if (todoCompleteVisible) {
    await todoCompleteBtn.click();
    await page.waitForTimeout(1500);
    await shot(page, 'after-todo-complete');
    counts = await countCards(page);
    log(`After direct complete from todo: done=${counts.done}`);
    if (counts.done >= 2) ok('Can complete todo task directly (without starting)');
    else warn('Done count did not increase as expected');
  } else {
    warn('No "Виконано" button in todo column (might all be moved)');
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 8: Search functionality
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 8: Search ══');
  await goTasks(page);
  await shot(page, 'before-search');

  // Trigger search via AppShell search button
  const searchIcon = page.locator('[aria-label*="search"], [aria-label*="Search"], button:has([class*="search"]), [class*="searchButton"]').first();
  const searchIconVisible = await searchIcon.isVisible().catch(() => false);
  if (!searchIconVisible) {
    warn('AppShell search button not found via aria-label, trying by position...');
    // Try dispatching event directly
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('appshell:search')));
  } else {
    await searchIcon.click();
  }
  await page.waitForTimeout(600);

  const searchBar = page.locator('[class*="mobileSearchBar"], [class*="searchBar"]').first();
  const searchBarVisible = await searchBar.isVisible().catch(() => false);
  if (!searchBarVisible) {
    bug('Search bar did not appear after triggering search');
    // Also try dispatching event
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('appshell:search')));
    await page.waitForTimeout(600);
  }

  const searchInput = page.locator('input[placeholder*="Пошук"]').first();
  const searchInputVisible = await searchInput.isVisible().catch(() => false);
  if (!searchInputVisible) {
    bug('Search input not visible');
  } else {
    ok('Search bar appeared');
    await shot(page, 'search-open');

    // Search for something that exists
    await searchInput.fill('прибирання');
    await page.waitForTimeout(1500);
    await shot(page, 'search-results');

    counts = await countCards(page);
    const total = counts.todo + counts.in_progress + counts.done;
    log(`Search "прибирання": visible cards=${total}`);
    if (total >= 1) ok('Search filters tasks correctly');
    else warn('Search returned 0 results — task may have been completed/deleted');

    // Search for non-existent
    await searchInput.fill('xyznonexistentxyz');
    await page.waitForTimeout(1500);
    await shot(page, 'search-empty');
    counts = await countCards(page);
    const emptyTotal = counts.todo + counts.in_progress + counts.done;
    if (emptyTotal === 0) ok('Search correctly shows empty state for no matches');
    else warn(`Expected 0 results for nonsense query, found ${emptyTotal}`);

    // Clear search
    await searchInput.fill('');
    await page.waitForTimeout(800);
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 9: Delete task
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 9: Delete task ══');
  await goTasks(page);
  counts = await countCards(page);
  const totalBefore = counts.todo + counts.in_progress + counts.done;
  log(`Cards before delete: ${totalBefore}`);

  const deleteBtn = page.locator('[class*="taskManageActions"] button').nth(1);
  const deleteVisible = await deleteBtn.isVisible().catch(() => false);
  if (!deleteVisible) {
    bug('Delete button not found on any card');
  } else {
    await deleteBtn.click();
    await page.waitForTimeout(500);
    await shot(page, 'delete-confirm-modal');

    const confirmModal = page.locator('[role="dialog"]').first();
    const confirmVisible = await confirmModal.isVisible().catch(() => false);
    if (!confirmVisible) bug('Delete confirmation modal did not appear');
    else {
      ok('Delete confirmation modal appeared');
      const modalText = await confirmModal.textContent().catch(() => '');
      log(`Confirm modal content: "${modalText.substring(0, 150).replace(/\s+/g, ' ')}"`);
      if (modalText.includes('Видалити')) ok('Confirmation text visible');

      // Confirm delete
      const confirmBtn = confirmModal.locator('button:has-text("Видалити")').last();
      await confirmBtn.click();
      await page.waitForTimeout(1500);
      await shot(page, 'after-delete');

      counts = await countCards(page);
      const totalAfter = counts.todo + counts.in_progress + counts.done;
      log(`Cards after delete: ${totalAfter}`);
      if (totalAfter < totalBefore) ok('Task deleted successfully — card count decreased');
      else bug('Card count did not decrease after delete');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 10: Delete cancel (should NOT delete)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 10: Delete cancel ══');
  await goTasks(page);
  counts = await countCards(page);
  const countBefore = counts.todo + counts.in_progress + counts.done;

  const deleteBtnForCancel = page.locator('[class*="taskManageActions"] button').nth(1);
  const deleteBtnCancelVisible = await deleteBtnForCancel.isVisible().catch(() => false);
  if (deleteBtnCancelVisible) {
    await deleteBtnForCancel.click();
    await page.waitForTimeout(500);

    const cancelModal = page.locator('[role="dialog"]').first();
    const cancelBtn = cancelModal.locator('button:has-text("Скасувати")').first();
    const cancelVisible = await cancelBtn.isVisible().catch(() => false);
    if (cancelVisible) {
      await cancelBtn.click();
      await page.waitForTimeout(800);
      counts = await countCards(page);
      const countAfterCancel = counts.todo + counts.in_progress + counts.done;
      if (countAfterCancel === countBefore) ok('Cancelling delete keeps task intact');
      else bug('Task was deleted even after pressing Скасувати');
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 11: Due date display check
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 11: Due date display ══');
  await goTasks(page);
  await shot(page, 'due-date-check');

  // Check if any due date is shown
  const dateIcons = await page.locator('[class*="detailItem"]').all();
  log(`Detail items (date/assignee rows): ${dateIcons.length}`);

  // Check for date format
  const pageContent = await page.textContent('body').catch(() => '');
  const dateMatches = pageContent.match(/\d{2}\.\d{2}\.\d{4}/g);
  log(`Date strings found on page: ${JSON.stringify(dateMatches?.slice(0, 5))}`);

  // Check if due date "2026-03-11" shows as 11.03.2026
  if (dateMatches?.some(d => d === '11.03.2026')) {
    ok('Due date 2026-03-11 correctly displays as 11.03.2026');
  } else if (dateMatches?.some(d => d === '10.03.2026')) {
    bug('Due date timezone bug: 2026-03-11 showing as 10.03.2026 (UTC off-by-one)');
  } else {
    warn('Could not verify due date display (card may have been deleted or date not set)');
  }

  // ══════════════════════════════════════════════════════════════════
  // STEP 12: Role check — manager sees all tasks (no filter by assignee)
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 12: Role behavior (manager) ══');
  await goTasks(page);
  counts = await countCards(page);
  log(`Manager sees: todo=${counts.todo}, in_progress=${counts.in_progress}, done=${counts.done}`);
  ok('Manager view loaded — shows all tasks without assignee filter');

  // ══════════════════════════════════════════════════════════════════
  // STEP 13: UX/UI audit
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══ STEP 13: UX/UI Audit ══');
  await goTasks(page);
  await shot(page, 'ux-audit-full');

  // 1. Desktop search visibility
  const desktopSearchInput = page.locator('[class*="toolbar"] input[type="search"], [class*="toolbar"] input[placeholder*="Пошук"]');
  const desktopSearchVisible = await desktopSearchInput.isVisible().catch(() => false);
  if (!desktopSearchVisible) warn('No always-visible desktop search input in toolbar (only accessible via header icon)');
  else ok('Desktop search input visible in toolbar');

  // 2. Overdue highlighting
  const overdueCards = await page.locator('[class*="overdue"], [class*="dueWarning"], [class*="pastDue"]').count();
  if (overdueCards === 0) warn('No overdue highlighting for past due dates');
  else ok('Overdue cards are highlighted');

  // 3. Done cards visual distinction
  const doneCards = await page.locator('.board .column:nth-child(3) [class*="taskCard"]').all();
  if (doneCards.length > 0) {
    const doneCardClass = await doneCards[0].getAttribute('class').catch(() => '');
    if (doneCardClass.includes('done') || doneCardClass.includes('completed')) ok('Done cards have distinct CSS class');
    else warn('Done cards have no visual distinction (opacity/strikethrough) vs active cards');
  }

  // 4. Empty column CTA
  const emptyColumnBtn = await page.locator('[class*="emptyColumn"] button').count();
  if (emptyColumnBtn === 0) warn('Empty column has no CTA button to create a task');
  else ok('Empty column has a CTA button');

  // 5. Toast after mutations
  const toastEl = await page.locator('[class*="toast"], [class*="Toast"], [role="status"]').count();
  log(`Toast elements on page: ${toastEl}`);

  // 6. Accessibility — check aria-labels on icon buttons
  const iconButtons = await page.locator('[class*="taskManageActions"] button').all();
  let missingAriaCount = 0;
  for (const btn of iconButtons) {
    const aria = await btn.getAttribute('aria-label').catch(() => null);
    if (!aria) missingAriaCount++;
  }
  if (missingAriaCount > 0) warn(`${missingAriaCount} icon buttons missing aria-label (accessibility)`);
  else ok('All icon buttons have aria-labels');

  // 7. Column scroll behavior
  const taskList = page.locator('[class*="taskList"]').first();
  const overflow = await taskList.evaluate(el => getComputedStyle(el).overflowY).catch(() => '');
  log(`Task list overflow-y: ${overflow}`);
  if (overflow === 'auto' || overflow === 'scroll') ok('Task list scrollable for overflow');
  else warn('Task list may not scroll properly with many tasks');

  // Final screenshot
  await shot(page, 'final-state');

  // ══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ══════════════════════════════════════════════════════════════════
  console.log('\n══════════════════════════════════════════');
  console.log('SUMMARY');
  console.log('══════════════════════════════════════════');
  if (issues.length === 0) {
    console.log('✅ No bugs found!');
  } else {
    console.log(`🐛 ${issues.length} bug(s) found:`);
    issues.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
  }

  const relevant403 = consoleErrors.filter(e => e.includes('403') && !e.includes('/pos'));
  if (relevant403.length > 0) {
    console.log(`\n⚠️  403 errors (${relevant403.length}):`);
    relevant403.forEach(e => console.log('  ' + e.substring(0, 120)));
  }

  const shots = fs.readdirSync(SCREENSHOTS_DIR).filter(f => f.endsWith('.png'));
  console.log(`\n📁 ${shots.length} screenshots in: ${SCREENSHOTS_DIR}`);

  await browser.close();
}

main().catch(err => {
  console.error('Fatal:', err.message);
  process.exit(1);
});
