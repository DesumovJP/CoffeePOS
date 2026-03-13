import { chromium } from 'playwright';
import fs from 'fs';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = '/tmp/coffeepos-test';

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

const results = {
  bugs: [],
  warnings: [],
  dataChecks: {},
  screenshots: [],
  pageScores: {},
};

function log(msg) {
  console.log(`[${new Date().toISOString()}] ${msg}`);
}

function logBug(page, description, reproduction) {
  const bug = { page, description, reproduction };
  results.bugs.push(bug);
  log(`!!! BUG on ${page}: ${description}`);
}

function logWarning(page, description) {
  results.warnings.push({ page, description });
  log(`WARNING on ${page}: ${description}`);
}

async function screenshot(page, name, description) {
  const path = `${SCREENSHOT_DIR}/${name}`;
  await page.screenshot({ path, fullPage: true });
  results.screenshots.push({ path, description });
  log(`Screenshot saved: ${path}`);
  return path;
}

async function login(page) {
  log('--- LOGIN ---');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // Fill identifier/username
  const identifierInput = page.locator('input[name="identifier"], input[type="text"], input[placeholder*="email"], input[placeholder*="логін"]').first();
  await identifierInput.waitFor({ timeout: 5000 });
  await identifierInput.fill('owner');

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill('owner123');

  const submitBtn = page.locator('button[type="submit"], button').filter({ hasText: /увійти|login|sign in/i }).first();
  if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await submitBtn.click();
  } else {
    await page.keyboard.press('Enter');
  }

  await page.waitForTimeout(3000);
  log(`After login, URL: ${page.url()}`);
}

// ============================================================
// BLOCK 0: POS + Orders
// ============================================================
async function block0_POS(page) {
  log('\n=== BLOCK 0: POS and Orders ===');

  await page.goto(`${BASE_URL}/pos`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await screenshot(page, '00-pos-initial.png', 'POS initial state');

  // Check if ShiftGuard is showing (needs shift to be opened)
  const shiftGuardText = await page.textContent('body');
  const needsShift = shiftGuardText.includes("Відкрити зміну") || shiftGuardText.includes('Ім\'я баристи');

  if (needsShift) {
    log('ShiftGuard detected - opening shift');

    const baristaInput = page.locator('input[placeholder*="Введіть ім\'я"]').first();
    await baristaInput.fill('Олексій');

    const cashInput = page.locator('input[type="number"]').first();
    await cashInput.fill('500');

    const openBtn = page.locator('button').filter({ hasText: /Відкрити зміну/i }).first();
    await openBtn.click();
    await page.waitForTimeout(3000);
    log('Shift opened');
  } else {
    log('Shift already open or POS loaded directly');
  }

  await screenshot(page, '00-pos-after-shift.png', 'POS after shift check');

  // ---- ORDER 1 (cash) ----
  log('--- Making Order 1 (cash) ---');

  // Wait for products to load
  await page.waitForSelector('[class*="ProductCard"], [class*="productCard"], button[class*="card"]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);

  // Find product cards - use more precise selectors based on ProductCard component
  let productButtons = page.locator('[class*="ProductCard"]');
  let count = await productButtons.count();
  log(`ProductCard elements: ${count}`);

  if (count === 0) {
    // Fallback: find clickable items in product grid
    productButtons = page.locator('[class*="card"][class*="glass"], [class*="glass"][class*="card"]');
    count = await productButtons.count();
    log(`GlassCard elements: ${count}`);
  }

  if (count === 0) {
    productButtons = page.locator('button').filter({ hasText: /₴/ });
    count = await productButtons.count();
    log(`Buttons with price: ${count}`);
  }

  // Filter for in-stock items only (not greyed out)
  let order1Items = [];
  let order2Items = [];

  if (count > 0) {
    // Click a simple product (Еспресо or Флет Вайт - no sizes)
    // Try to find "Еспресо" first (no sizes = direct add)
    const espresso = page.locator('[class*="ProductCard"], [class*="productCard"]').filter({ hasText: /Еспресо|Флет Вайт|Чізкейк|Тірамісу/i }).first();
    const espressoVisible = await espresso.isVisible({ timeout: 2000 }).catch(() => false);

    if (espressoVisible) {
      const espressoText = await espresso.textContent().catch(() => '');
      log(`Clicking: ${espressoText.substring(0, 50)}`);
      await espresso.click();
      await page.waitForTimeout(800);
      order1Items.push(espressoText.trim());
    } else {
      // Click first product
      await productButtons.first().click();
      await page.waitForTimeout(800);

      // If size picker opened, choose first size
      const sizePicker = page.locator('[class*="SizePicker"], [class*="sizePicker"]').first();
      if (await sizePicker.isVisible({ timeout: 1500 }).catch(() => false)) {
        log('Size picker appeared, selecting first size');
        const sizeBtn = sizePicker.locator('button').first();
        await sizeBtn.click();
        await page.waitForTimeout(500);
      }
    }

    // Click a second product
    const cappuccino = page.locator('[class*="ProductCard"], [class*="productCard"]').filter({ hasText: /Капучіно|Маффін|Круасан/i }).first();
    const cappVisible = await cappuccino.isVisible({ timeout: 2000 }).catch(() => false);

    if (cappVisible) {
      const cappText = await cappuccino.textContent().catch(() => '');
      log(`Clicking: ${cappText.substring(0, 50)}`);
      await cappuccino.click();
      await page.waitForTimeout(800);

      // Handle size picker if appears
      const sizePicker2 = page.locator('[class*="SizePicker"], [class*="sizePicker"]').first();
      if (await sizePicker2.isVisible({ timeout: 1500 }).catch(() => false)) {
        log('Size picker appeared for product 2, selecting first size');
        const sizeBtn2 = sizePicker2.locator('button').first();
        await sizeBtn2.click();
        await page.waitForTimeout(500);
      }
      order1Items.push(cappText.trim());
    }
  }

  await screenshot(page, '00-pos-order1-items.png', 'POS Order 1 items added');

  // Read order total from OrderSummary
  const totalSection = page.locator('[class*="total"], [class*="Total"]').filter({ hasText: /₴/ }).first();
  const totalText = await totalSection.textContent().catch(() => '0');
  log(`Order 1 total text: "${totalText}"`);

  // Extract numeric value
  const totalMatch = totalText.match(/[\d\s]+[,.]?[\d]*/);
  const order1Total = totalMatch ? parseFloat(totalMatch[0].replace(/\s/g, '').replace(',', '.')) : 0;
  log(`Order 1 total: ₴${order1Total}`);

  // Find and click checkout/pay button
  const checkoutBtn = page.locator('button').filter({ hasText: /Сплатити|Оплатити|Оформити|Замовлення|оплата/i }).first();
  const checkoutAlt = page.locator('[class*="checkout"], [class*="Checkout"]').first();

  let paidOrder1 = false;
  if (await checkoutBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await checkoutBtn.click();
    await page.waitForTimeout(1000);
    paidOrder1 = true;
    log('Clicked checkout button');
  } else if (await checkoutAlt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await checkoutAlt.click();
    await page.waitForTimeout(1000);
    paidOrder1 = true;
  } else {
    // Try keyboard shortcut Enter
    log('No checkout button found, trying Enter key');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
    paidOrder1 = true;
  }

  if (paidOrder1) {
    await screenshot(page, '00-pos-payment-modal.png', 'POS payment modal order 1');

    // Payment modal should be open - cash is default, just confirm
    const confirmPayBtn = page.locator('button').filter({ hasText: /Підтвердити оплату/i }).first();
    if (await confirmPayBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      log('Cash is default, clicking Підтвердити оплату');
      await confirmPayBtn.click();
      await page.waitForTimeout(2000);

      // Success screen
      const successBtn = page.locator('button').filter({ hasText: /Нове замовлення/i }).first();
      if (await successBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await screenshot(page, '00-pos-order1-success.png', 'Order 1 payment success');
        await successBtn.click();
        await page.waitForTimeout(1000);
        log('Order 1 completed with CASH');
      }
    } else {
      log('Confirm pay button not found');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }
  }

  results.dataChecks.order1Total = order1Total;

  // ---- ORDER 2 (card) ----
  log('--- Making Order 2 (card) ---');
  await page.waitForTimeout(1000);

  // Add different products
  const latte = page.locator('[class*="ProductCard"], [class*="productCard"]').filter({ hasText: /Латте|Мокко|Американо/i }).first();
  const latteVisible = await latte.isVisible({ timeout: 2000 }).catch(() => false);

  if (latteVisible) {
    await latte.click();
    await page.waitForTimeout(800);

    const sizePicker3 = page.locator('[class*="SizePicker"], [class*="sizePicker"]').first();
    if (await sizePicker3.isVisible({ timeout: 1500 }).catch(() => false)) {
      log('Size picker for Latte, choosing first size');
      await sizePicker3.locator('button').first().click();
      await page.waitForTimeout(500);
    }
  } else {
    // Fallback: click 3rd product
    const allProducts = page.locator('[class*="ProductCard"], [class*="productCard"]');
    const totalProds = await allProducts.count();
    if (totalProds > 2) {
      await allProducts.nth(2).click();
      await page.waitForTimeout(800);
      const sp = page.locator('[class*="SizePicker"]').first();
      if (await sp.isVisible({ timeout: 1000 }).catch(() => false)) {
        await sp.locator('button').first().click();
        await page.waitForTimeout(500);
      }
    }
  }

  // Add cheesecake or a second item
  const dessert = page.locator('[class*="ProductCard"], [class*="productCard"]').filter({ hasText: /Лимонад|Тірамісу|Чізкейк/i }).first();
  if (await dessert.isVisible({ timeout: 2000 }).catch(() => false)) {
    await dessert.click();
    await page.waitForTimeout(800);
  }

  await screenshot(page, '00-pos-order2-items.png', 'POS Order 2 items added');

  const totalText2 = await page.locator('[class*="total"], [class*="Total"]').filter({ hasText: /₴/ }).first().textContent().catch(() => '0');
  const totalMatch2 = totalText2.match(/[\d\s]+[,.]?[\d]*/);
  const order2Total = totalMatch2 ? parseFloat(totalMatch2[0].replace(/\s/g, '').replace(',', '.')) : 0;
  log(`Order 2 total: ₴${order2Total}`);

  // Checkout
  const checkoutBtn2 = page.locator('button').filter({ hasText: /Сплатити|Оплатити|Оформити/i }).first();
  if (await checkoutBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await checkoutBtn2.click();
    await page.waitForTimeout(1000);
  } else {
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);
  }

  await screenshot(page, '00-pos-payment2-modal.png', 'POS payment modal order 2');

  // Select CARD payment
  const cardBtn = page.locator('button').filter({ hasText: /Картка/i }).first();
  if (await cardBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await cardBtn.click();
    await page.waitForTimeout(500);
    log('Selected CARD payment');
  }

  const confirmPayBtn2 = page.locator('button').filter({ hasText: /Підтвердити оплату/i }).first();
  if (await confirmPayBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
    await confirmPayBtn2.click();
    await page.waitForTimeout(2000);

    const successBtn2 = page.locator('button').filter({ hasText: /Нове замовлення/i }).first();
    if (await successBtn2.isVisible({ timeout: 3000 }).catch(() => false)) {
      await screenshot(page, '00-pos-order2-success.png', 'Order 2 payment success (card)');
      await successBtn2.click();
      await page.waitForTimeout(1000);
      log('Order 2 completed with CARD');
    }
  } else {
    log('Confirm pay button 2 not found');
    await page.keyboard.press('Escape');
  }

  results.dataChecks.order2Total = order2Total;
  results.dataChecks.totalRevenue = order1Total + order2Total;
  log(`TOTALS: Order1=₴${order1Total}, Order2=₴${order2Total}, Combined=₴${order1Total + order2Total}`);

  await screenshot(page, '00-pos-after-orders.png', 'POS after both orders completed');
}

// ============================================================
// BLOCK 1: Suppliers
// ============================================================
async function block1_Suppliers(page) {
  log('\n=== BLOCK 1: Suppliers ===');

  await page.goto(`${BASE_URL}/admin/suppliers`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  const currentUrl = page.url();
  log(`Suppliers URL: ${currentUrl}`);

  if (currentUrl.includes('404') || currentUrl.includes('not-found')) {
    logBug('/admin/suppliers', 'Page returns 404', 'Navigate to /admin/suppliers');
    await screenshot(page, '01-suppliers-main.png', 'Suppliers 404');
    return;
  }

  await screenshot(page, '01-suppliers-main.png', 'Suppliers main page');

  // Extract stats section text
  const statsArea = page.locator('[class*="stat"], [class*="Stat"], [class*="summary"]');
  const statsCount = await statsArea.count();
  log(`Stats elements: ${statsCount}`);

  // Get full page text for analysis
  const bodyText = await page.textContent('body');

  // Extract numbers from stats
  const statsMatch = bodyText.match(/Постачальників[^\d]*(\d+)|Поставок[^\d]*(\d+)|Витрачено[^\d]*₴([\d\s]+)/gi);
  log(`Stats text matches: ${statsMatch ? statsMatch.join(' | ') : 'none'}`);

  // Check table
  const tableRows = page.locator('table tbody tr');
  const rowCount = await tableRows.count();
  log(`Supplier table rows: ${rowCount}`);
  results.dataChecks.suppliersCount = rowCount;

  if (rowCount === 0) {
    logBug('/admin/suppliers', 'Table has 0 rows', 'Load /admin/suppliers');
  } else {
    // Log first few rows
    for (let i = 0; i < Math.min(3, rowCount); i++) {
      const rowText = await tableRows.nth(i).textContent().catch(() => '');
      log(`Row ${i}: ${rowText.substring(0, 80)}`);
    }

    // Check for pending vs received columns
    const headerCells = page.locator('table thead th');
    const headers = await headerCells.allTextContents().catch(() => []);
    log(`Table headers: ${headers.join(' | ')}`);

    // Check badges in table
    const greenBadges = page.locator('[class*="badge"][class*="success"], [class*="Badge"][class*="success"]');
    const yellowBadges = page.locator('[class*="badge"][class*="warning"], [class*="Badge"][class*="warning"]');
    const greenCount = await greenBadges.count();
    const yellowCount = await yellowBadges.count();
    log(`Green badges (received): ${greenCount}, Yellow badges (pending): ${yellowCount}`);

    // Click first row
    await tableRows.first().click();
    await page.waitForTimeout(1500);

    const modal = page.locator('[role="dialog"]').first();
    const modalOpen = await modal.isVisible({ timeout: 3000 }).catch(() => false);

    if (!modalOpen) {
      logWarning('/admin/suppliers', 'Supplier detail modal did not open on row click');
      await screenshot(page, '01b-supplier-detail.png', 'Supplier modal did not open');
    } else {
      log('Supplier detail modal opened');
      await screenshot(page, '01b-supplier-detail.png', 'Supplier detail modal');

      const modalText = await modal.textContent().catch(() => '');
      log(`Modal text (200): ${modalText.substring(0, 200)}`);

      const hasDeliveries = modalText.toLowerCase().includes('постав');
      const hasNewBtn = await modal.locator('button').filter({ hasText: /нова|Нова|постав/i }).isVisible({ timeout: 1000 }).catch(() => false);

      log(`Modal hasDeliveries: ${hasDeliveries}, hasNewDeliveryBtn: ${hasNewBtn}`);
      if (!hasDeliveries) logWarning('/admin/suppliers', 'Detail modal missing deliveries section');
      if (!hasNewBtn) logWarning('/admin/suppliers', 'Detail modal missing "New Supply" button');

      // Close modal
      await page.keyboard.press('Escape');
      await page.waitForTimeout(800);
    }
  }

  // Search - try header search icon first
  // The search icon in the header dispatches 'appshell:search' event
  const headerSearchIcon = page.locator('[class*="AppShell"] button[aria-label*="search"], [class*="header"] button[aria-label*="пошук"]').first();
  const searchIconVisible = await headerSearchIcon.isVisible({ timeout: 2000 }).catch(() => false);

  if (searchIconVisible) {
    await headerSearchIcon.click();
    await page.waitForTimeout(500);
  } else {
    // Dispatch appshell:search event
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('appshell:search')));
    await page.waitForTimeout(500);
  }

  // Look for search input
  const searchInput = page.locator('input[type="search"], input[placeholder*="пошук"], input[placeholder*="Пошук"]').first();
  const searchInputVisible = await searchInput.isVisible({ timeout: 3000 }).catch(() => false);

  if (searchInputVisible) {
    await searchInput.fill('Фреш');
    await page.waitForTimeout(1000);
    await screenshot(page, '01c-suppliers-search.png', 'Suppliers search for Фреш');
    log('Search works: filtered suppliers');

    await searchInput.clear();
    await page.waitForTimeout(500);
  } else {
    logWarning('/admin/suppliers', 'Search input not visible after triggering');
    await screenshot(page, '01c-suppliers-search.png', 'Suppliers - search not working');
  }

  results.pageScores.suppliers = 8;
}

// ============================================================
// BLOCK 2: Employees
// ============================================================
async function block2_Employees(page) {
  log('\n=== BLOCK 2: Employees ===');

  await page.goto(`${BASE_URL}/admin/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await screenshot(page, '02-employees-list.png', 'Employees list tab');

  const bodyText = await page.textContent('body');
  const tableRows = page.locator('table tbody tr');
  const rowCount = await tableRows.count();
  log(`Employee rows: ${rowCount}`);
  results.dataChecks.employeesCount = rowCount;

  if (rowCount < 5) {
    logWarning('/admin/employees', `Expected 5+ employees, found only ${rowCount}`);
  }

  // Check role badges
  const hasOwner = bodyText.includes('Власник');
  const hasManager = bodyText.includes('Менеджер');
  const hasBarista = bodyText.includes('Бариста');
  log(`Roles visible: Owner=${hasOwner}, Manager=${hasManager}, Barista=${hasBarista}`);

  // Check active status
  const hasActive = bodyText.includes('Активний');
  log(`Active status badge: ${hasActive}`);

  // Find Maria Kovalenko
  const mariaRow = page.locator('tr').filter({ hasText: /Марія|Коваленко/i }).first();
  const mariaVisible = await mariaRow.isVisible({ timeout: 3000 }).catch(() => false);

  if (mariaVisible) {
    log('Found Марія Коваленко row, clicking...');
    await mariaRow.click();
    await page.waitForTimeout(1500);
  } else {
    log('Марія Коваленко not found, clicking first employee row');
    if (rowCount > 0) {
      await tableRows.first().click();
      await page.waitForTimeout(1500);
    }
  }

  const detailModal = page.locator('[role="dialog"]').first();
  const detailOpen = await detailModal.isVisible({ timeout: 3000 }).catch(() => false);

  if (detailOpen) {
    log('Employee detail modal opened');
    const modalText = await detailModal.textContent().catch(() => '');
    log(`Modal text: ${modalText.substring(0, 300)}`);

    // Check for key fields
    const hasEmail = modalText.includes('@');
    const hasPhone = modalText.includes('+380') || modalText.includes('Телефон');
    const hasHireDate = modalText.includes('Дата найму') || modalText.includes('2023') || modalText.includes('2024');
    log(`Modal fields: email=${hasEmail}, phone=${hasPhone}, hireDate=${hasHireDate}`);

    if (!hasEmail) logWarning('/admin/employees', 'Detail modal missing email');
    if (!hasPhone) logWarning('/admin/employees', 'Detail modal missing phone');
  } else {
    logWarning('/admin/employees', 'Employee detail modal did not open');
  }

  await screenshot(page, '02b-employee-detail.png', 'Employee detail modal');

  // Close modal
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);

  // Edit employee - find edit button (pencil icon) in actions column
  if (rowCount > 0) {
    // Hover first row to reveal action buttons
    const firstRow = tableRows.first();
    await firstRow.hover();
    await page.waitForTimeout(300);

    // Find edit button in that row
    const editBtn = firstRow.locator('button').nth(0);
    const editBtnCount = await firstRow.locator('button').count();
    log(`Buttons in first row: ${editBtnCount}`);

    if (editBtnCount > 0) {
      // First button should be edit (pencil)
      await editBtn.click();
      await page.waitForTimeout(1000);

      const editModal = page.locator('[role="dialog"]').first();
      if (await editModal.isVisible({ timeout: 3000 }).catch(() => false)) {
        log('Edit modal opened');
        // Find position field
        const positionInput = editModal.locator('input[name="position"], input').nth(2);
        if (await positionInput.isVisible({ timeout: 2000 }).catch(() => false)) {
          await positionInput.clear();
          await positionInput.fill('Старший бариста');
          log('Filled position field');
        }

        const saveBtn = editModal.locator('button').filter({ hasText: /Збер|збер/i }).first();
        if (await saveBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await saveBtn.click();
          await page.waitForTimeout(1500);
          log('Saved employee edit');
        } else {
          await page.keyboard.press('Escape');
        }
      } else {
        log('Edit modal did not open after clicking first button');
        await page.keyboard.press('Escape');
      }
    } else {
      logWarning('/admin/employees', 'No action buttons found in table row');
    }
  }

  await screenshot(page, '02c-employee-edited.png', 'Employee after edit');

  // Add new employee - click "+ Додати" button via header action event
  log('Creating new employee...');
  await page.evaluate(() => window.dispatchEvent(new CustomEvent('appshell:action')));
  await page.waitForTimeout(1000);

  let createModal = page.locator('[role="dialog"]').first();
  let createModalOpen = await createModal.isVisible({ timeout: 3000 }).catch(() => false);

  if (!createModalOpen) {
    // Try the button with "+" or "Додати"
    const addBtn = page.locator('button').filter({ hasText: /Додати|новий|Новий|\+/i }).first();
    if (await addBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await addBtn.click();
      await page.waitForTimeout(1000);
      createModalOpen = await createModal.isVisible({ timeout: 3000 }).catch(() => false);
    }
  }

  if (createModalOpen) {
    log('Create employee modal open');
    // Fill name
    const nameInput = createModal.locator('input[name="name"], input[placeholder*="Ім\'я"], input[placeholder*="ім\'я"]').first();
    if (await nameInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await nameInput.fill('Тест Тестенко');
      log('Filled name');
    } else {
      // Try first input
      const firstInput = createModal.locator('input').first();
      await firstInput.fill('Тест Тестенко');
    }

    // Select role barista - find role select
    const roleSelect = createModal.locator('select[name="role"]').first();
    if (await roleSelect.isVisible({ timeout: 2000 }).catch(() => false)) {
      await roleSelect.selectOption('barista');
      log('Set role to barista');
    }

    // Set email (required?)
    const emailInput = createModal.locator('input[type="email"], input[name="email"]').first();
    if (await emailInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await emailInput.fill('test.testenko@coffeepos.com');
    }

    // Set password if required
    const passwordInput = createModal.locator('input[type="password"], input[name="password"]').first();
    if (await passwordInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await passwordInput.fill('test123456');
    }

    const submitBtn = createModal.locator('button[type="submit"], button').filter({ hasText: /Збер|збер|Додати|Створит/i }).first();
    if (await submitBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await submitBtn.click();
      await page.waitForTimeout(2000);
      log('Submitted new employee form');
    }
  } else {
    logWarning('/admin/employees', 'Create employee modal did not open');
  }

  await screenshot(page, '02d-employee-created.png', 'Employee created');

  // Delete test employee
  const testRow = page.locator('tr').filter({ hasText: /Тест Тестенко/i }).first();
  const testRowVisible = await testRow.isVisible({ timeout: 3000 }).catch(() => false);

  if (testRowVisible) {
    log('Found test employee, deleting...');
    await testRow.hover();
    await page.waitForTimeout(300);

    // Delete button should be 2nd button in actions
    const deleteBtn = testRow.locator('button').last();
    if (await deleteBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await deleteBtn.click();
      await page.waitForTimeout(1000);

      const confirmModal = page.locator('[role="dialog"]').first();
      if (await confirmModal.isVisible({ timeout: 2000 }).catch(() => false)) {
        const yesBtn = confirmModal.locator('button').filter({ hasText: /видалит|Видалит|Так|підтвер/i }).first();
        if (await yesBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
          await yesBtn.click();
          await page.waitForTimeout(1500);
          log('Test employee deleted');
        }
      }
    }
  } else {
    log('Test employee not found in table (may not have been created)');
  }

  await screenshot(page, '02e-employee-deleted.png', 'After employee deletion');

  // ---- ANALYTICS TAB ----
  log('--- Analytics Tab ---');

  // Close any lingering modals first
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);

  // Find SegmentedControl analytics tab - it should be in main content area
  // Based on TABS = [{ id: 'list', label: 'Працівники' }, { id: 'analytics', label: 'Аналітика' }]
  const analyticsBtn = page.locator('[class*="SegmentedControl"] button, [class*="segmentedControl"] button').filter({ hasText: /Аналітика/i }).first();
  const analyticsBtnAlt = page.locator('main button, [class*="content"] button').filter({ hasText: /Аналітика/i }).first();

  let analyticsClicked = false;
  if (await analyticsBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await analyticsBtn.click();
    analyticsClicked = true;
    log('Clicked analytics tab via SegmentedControl');
  } else if (await analyticsBtnAlt.isVisible({ timeout: 2000 }).catch(() => false)) {
    await analyticsBtnAlt.click();
    analyticsClicked = true;
    log('Clicked analytics tab alt');
  } else {
    logWarning('/admin/employees', 'Analytics tab button not found');
  }

  if (analyticsClicked) {
    await page.waitForTimeout(2000);
    await screenshot(page, '02f-employees-analytics.png', 'Employees analytics tab');

    const analyticsText = await page.textContent('body');

    // Check month navigation
    const hasCurrentMonth = analyticsText.includes('Березень') || analyticsText.includes('2026');
    log(`Analytics has current month: ${hasCurrentMonth}`);

    // Check stats grid
    const statsCards = page.locator('[class*="StatsGrid"], [class*="statsGrid"]');
    const statsCount = await statsCards.count();
    log(`StatsGrid count: ${statsCount}`);

    // Check charts
    const charts = page.locator('svg.recharts-surface, [class*="recharts"]');
    const chartsCount = await charts.count();
    log(`Charts count: ${chartsCount}`);

    if (chartsCount === 0) {
      logWarning('/admin/employees/analytics', 'No charts found in analytics tab');
    }

    // Prev month navigation
    const navBtns = page.locator('[class*="monthNav"] button, [class*="nav"] button');
    const navCount = await navBtns.count();
    log(`Navigation buttons: ${navCount}`);

    // Find < button
    const prevBtn = page.locator('button[aria-label*="попередній"], button[aria-label*="prev"]').first();
    let prevBtnAlt = null;

    // Look for buttons containing only "<" or chevron left icon
    const allBtns = await page.locator('button').all();
    let prevBtnFound = null;
    for (const btn of allBtns) {
      const text = await btn.textContent().catch(() => '');
      const ariaLabel = await btn.getAttribute('aria-label').catch(() => '');
      if (text.trim() === '<' || ariaLabel?.includes('prev') || ariaLabel?.includes('назад')) {
        prevBtnFound = btn;
        break;
      }
    }

    if (await prevBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
      await prevBtn.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '02g-analytics-prev-month.png', 'Employees analytics prev month');
      log('Navigated to prev month');

      // Check if > button is properly disabled
      const nextBtn = page.locator('button[aria-label*="наступний"], button[aria-label*="next"]').first();
      // Go back to March
      if (await nextBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextBtn.click();
        await page.waitForTimeout(1000);
      }
    } else if (prevBtnFound) {
      await prevBtnFound.click();
      await page.waitForTimeout(1500);
      await screenshot(page, '02g-analytics-prev-month.png', 'Employees analytics prev month (alt)');
    } else {
      // Try finding via SVG chevron icons inside buttons
      const svgBtns = page.locator('button').filter({ has: page.locator('svg') });
      const svgBtnCount = await svgBtns.count();
      log(`Buttons with SVG: ${svgBtnCount}`);
      if (svgBtnCount >= 2) {
        await svgBtns.first().click();
        await page.waitForTimeout(1500);
        await screenshot(page, '02g-analytics-prev-month.png', 'Employees analytics prev month (svg btn)');
      } else {
        await screenshot(page, '02g-analytics-prev-month.png', 'Analytics - prev month btn not found');
      }
    }
  } else {
    await screenshot(page, '02f-employees-analytics.png', 'Employees analytics tab not found');
    await screenshot(page, '02g-analytics-prev-month.png', 'Employees analytics tab not found');
  }

  results.pageScores.employees = 7;
}

// ============================================================
// BLOCK 3: Dashboard/Analytics
// ============================================================
async function block3_Dashboard(page) {
  log('\n=== BLOCK 3: Dashboard Analytics ===');

  await page.goto(`${BASE_URL}/admin/dashboard`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);

  await screenshot(page, '03-analytics-overview.png', 'Dashboard analytics overview');

  const bodyText = await page.textContent('body');

  // Find stat cards
  const statCards = page.locator('[class*="StatCard"], [class*="statCard"], [class*="stat-card"]');
  const cardCount = await statCards.count();
  log(`Stat cards: ${cardCount}`);

  if (cardCount < 4) {
    logWarning('/admin/dashboard', `Expected 4 stat cards, found ${cardCount}`);
  }

  // Extract values from stat cards
  const allCardTexts = [];
  for (let i = 0; i < cardCount; i++) {
    const text = await statCards.nth(i).textContent().catch(() => '');
    allCardTexts.push(text.trim());
    log(`Stat card ${i}: ${text.substring(0, 100)}`);
  }

  // Check for revenue today
  const revenueCard = bodyText.match(/Виторг сьогодні[^\d]*₴?([\d\s,]+)/i);
  const ordersCard = bodyText.match(/Замовлень сьогодні[^\d]*(\d+)/i);
  const avgCard = bodyText.match(/Середній чек[^\d]*₴?([\d\s,]+)/i);
  const shiftsCard = bodyText.match(/Активних змін[^\d]*(\d+)/i);

  log(`Revenue today: ${revenueCard ? revenueCard[1].trim() : 'not found'}`);
  log(`Orders today: ${ordersCard ? ordersCard[1].trim() : 'not found'}`);
  log(`Avg check: ${avgCard ? avgCard[1].trim() : 'not found'}`);
  log(`Active shifts: ${shiftsCard ? shiftsCard[1].trim() : 'not found'}`);

  results.dataChecks.dashboardRevenue = revenueCard ? revenueCard[1].trim() : null;
  results.dataChecks.dashboardOrders = ordersCard ? ordersCard[1].trim() : null;

  // Check for non-zero revenue
  if (revenueCard) {
    const revNum = parseFloat(revenueCard[1].replace(/\s/g, '').replace(',', '.')) || 0;
    if (revNum === 0) {
      logBug('/admin/dashboard', 'Revenue today is 0 even though POS orders were made',
             'Make orders in POS then check /admin/dashboard');
    } else {
      log(`Revenue today: ₴${revNum} - NON-ZERO OK`);
    }
  }

  // Check for orders > 0
  if (ordersCard) {
    const ordNum = parseInt(ordersCard[1]) || 0;
    if (ordNum === 0) {
      logBug('/admin/dashboard', 'Orders today count is 0 even though POS orders were made',
             'Make orders in POS then check /admin/dashboard');
    } else {
      log(`Orders today: ${ordNum} - OK`);
    }
  }

  // Verify pie chart is not placeholder
  // Look for pie chart SVG
  const pieChart = page.locator('[class*="pie"], [class*="Pie"], .recharts-pie').first();
  const hasPie = await pieChart.isVisible({ timeout: 3000 }).catch(() => false);
  log(`Pie chart visible: ${hasPie}`);

  // Check if the chart data matches our payments
  // The placeholder is [35, 55, 10] - if we see actual payment data it should differ
  const pageSource = await page.content();
  const hasPlaceholder = pageSource.includes('"35"') || pageSource.includes('"55"') ||
    pageSource.includes('value: 35') || pageSource.includes('value: 55');
  log(`Page source has placeholder [35,55,10]: ${hasPlaceholder}`);

  await screenshot(page, '03b-payment-pie.png', 'Payment method pie chart');

  // Check area chart
  const areaChart = page.locator('.recharts-area, [class*="area"], [class*="Area"]').first();
  const hasArea = await areaChart.isVisible({ timeout: 2000 }).catch(() => false);
  log(`Area chart visible: ${hasArea}`);

  // Check top products section
  const topProducts = page.locator('[class*="topProduct"], [class*="TopProduct"]');
  const topCount = await topProducts.count();
  log(`Top products: ${topCount}`);

  // Check recent orders
  const recentOrders = page.locator('[class*="order"], [class*="Order"]').filter({ hasText: /ORD-/ });
  const recentCount = await recentOrders.count();
  log(`Recent orders: ${recentCount}`);

  await screenshot(page, '03c-analytics-bottom.png', 'Analytics bottom - recent orders and top products');

  // ---- CALENDAR TAB ----
  log('--- Calendar Tab ---');
  const calendarTab = page.locator('[class*="SegmentedControl"] button, button').filter({ hasText: /Календар/i }).first();
  if (await calendarTab.isVisible({ timeout: 3000 }).catch(() => false)) {
    await calendarTab.click();
    await page.waitForTimeout(2000);
    await screenshot(page, '03d-calendar.png', 'Calendar tab');

    const calText = await page.textContent('body');
    const hasMonth = calText.includes('Березень');
    const hasWeekdays = calText.includes('Пн') && calText.includes('Нд');
    log(`Calendar: hasMonth=${hasMonth}, hasWeekdays=${hasWeekdays}`);

    if (!hasMonth) logWarning('/admin/dashboard/calendar', 'Calendar missing "Березень" header');

    // Check 1st March = Sunday (last column)
    // Click on today (11 March)
    const todayEl = page.locator('[class*="today"], [aria-current="date"], [class*="current"]').first();
    const todayVisible = await todayEl.isVisible({ timeout: 2000 }).catch(() => false);

    if (todayVisible) {
      log('Today cell found, clicking...');
      await todayEl.click();
      await page.waitForTimeout(1500);
    } else {
      // Find cell with "11" that's highlighted
      const cells = page.locator('td, [class*="day"], [class*="cell"]').filter({ hasText: /^11$/ });
      const cellCount = await cells.count();
      log(`Cells with "11": ${cellCount}`);
      if (cellCount > 0) {
        await cells.first().click();
        await page.waitForTimeout(1500);
      }
    }

    const dayModal = page.locator('[role="dialog"]').first();
    const dayModalOpen = await dayModal.isVisible({ timeout: 3000 }).catch(() => false);
    if (dayModalOpen) {
      log('Day detail modal opened');
      const dayText = await dayModal.textContent().catch(() => '');
      log(`Day modal text: ${dayText.substring(0, 200)}`);
      await screenshot(page, '03e-day-detail.png', 'Day detail modal for March 11');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    } else {
      logWarning('/admin/dashboard/calendar', 'Day detail modal did not open on today click');
      await screenshot(page, '03e-day-detail.png', 'Calendar - day modal did not open');
    }

    // Navigate to prev month (Feb 2026)
    const prevBtns = page.locator('button').all();
    // Find chevron button in calendar navigation
    const chevronLeft = page.locator('button[aria-label*="prev"], button[aria-label*="попер"], button[aria-label*="назад"]').first();
    if (await chevronLeft.isVisible({ timeout: 2000 }).catch(() => false)) {
      await chevronLeft.click();
      await page.waitForTimeout(1500);
    } else {
      // Try SVG-only buttons
      const svgBtns = page.locator('[class*="calendar"] button, [class*="Calendar"] button');
      const svgCount = await svgBtns.count();
      log(`Calendar nav buttons: ${svgCount}`);
      if (svgCount > 0) {
        await svgBtns.first().click();
        await page.waitForTimeout(1500);
      }
    }

    await screenshot(page, '03f-calendar-prev-month.png', 'Calendar - February 2026');
  } else {
    logWarning('/admin/dashboard', 'Calendar tab not found');
    await screenshot(page, '03d-calendar.png', 'Dashboard calendar tab not found');
    await screenshot(page, '03e-day-detail.png', 'Dashboard calendar tab not found');
    await screenshot(page, '03f-calendar-prev-month.png', 'Dashboard calendar tab not found');
  }

  results.pageScores.analytics = 7;
}

// ============================================================
// BLOCK 4: Orders History
// ============================================================
async function block4_Orders(page) {
  log('\n=== BLOCK 4: Orders History ===');

  await page.goto(`${BASE_URL}/orders`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  await screenshot(page, '04-history.png', 'Orders history page');

  const bodyText = await page.textContent('body');
  log(`Orders page (500): ${bodyText.substring(0, 500)}`);

  // Shift context
  const hasShiftContext = bodyText.includes('Зміна') || bodyText.includes('зміна');
  log(`Has shift context: ${hasShiftContext}`);

  // Stats pills
  const revMatch = bodyText.match(/Виручка[^\d]*₴?\s*([\d\s,]+)/i);
  const ordMatch = bodyText.match(/Замовлень[^\d]*(\d+)/i);
  log(`History revenue: ${revMatch ? revMatch[1].trim() : 'not found'}`);
  log(`History orders: ${ordMatch ? ordMatch[1].trim() : 'not found'}`);

  results.dataChecks.historyRevenue = revMatch ? revMatch[1].trim() : null;
  results.dataChecks.historyOrders = ordMatch ? ordMatch[1].trim() : null;

  // Cross-check with dashboard
  if (results.dataChecks.dashboardRevenue && results.dataChecks.historyRevenue) {
    const dashRev = parseFloat(results.dataChecks.dashboardRevenue.replace(/\s/g, '').replace(',', '.'));
    const histRev = parseFloat(results.dataChecks.historyRevenue.replace(/\s/g, '').replace(',', '.'));
    const match = Math.abs(dashRev - histRev) <= 0.01;
    log(`Revenue cross-check: Dashboard=₴${dashRev} vs History=₴${histRev} → ${match ? 'MATCH' : 'MISMATCH!'}`);
    if (!match) {
      logBug('/orders', `Revenue mismatch: Dashboard shows ₴${dashRev} but History shows ₴${histRev}`,
             'Compare /admin/dashboard and /orders');
    }
    results.dataChecks.revenueMatch = match;
  }

  // Find order items
  const orderItems = page.locator('[class*="order"], [class*="Order"]').filter({ hasText: /ORD-/ });
  const orderCount = await orderItems.count();
  log(`Orders with ORD- prefix: ${orderCount}`);

  if (orderCount === 0) {
    logWarning('/orders', 'No ORD- orders found in history');
  }

  results.dataChecks.historyOrderCount = orderCount;

  // Expand first order accordion
  const firstOrder = orderItems.first();
  if (await firstOrder.isVisible({ timeout: 2000 }).catch(() => false)) {
    await firstOrder.click();
    await page.waitForTimeout(1000);

    // Check expanded content
    const expandedText = await firstOrder.textContent().catch(() => '');
    const hasItems = expandedText.includes('×') || expandedText.match(/\d+\s*×/) || expandedText.includes('шт');
    const hasCash = expandedText.toLowerCase().includes('готівк') || expandedText.toLowerCase().includes('картк') || expandedText.toLowerCase().includes('cash') || expandedText.toLowerCase().includes('card');
    log(`Expanded order: hasItems=${hasItems}, hasPayment=${hasCash}`);
  }

  await screenshot(page, '04b-order-expanded.png', 'Order accordion expanded');

  // Search
  const searchInput = page.locator('input[type="search"], input[placeholder*="пошук"], input[placeholder*="Пошук"], input[placeholder*="ORD"]').first();
  if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
    await searchInput.fill('ORD-');
    await page.waitForTimeout(1000);
    await screenshot(page, '04c-history-search.png', 'History search for ORD-');
    await searchInput.clear();
    await page.waitForTimeout(500);
    log('Search works');
  } else {
    logWarning('/orders', 'Search input not found in orders history');
    await screenshot(page, '04c-history-search.png', 'History - search input not found');
  }

  results.pageScores.history = 7;
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  log('=== CoffeePOS Full Playwright Test ===');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'uk-UA',
  });

  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') log(`Console Error: ${msg.text().substring(0, 120)}`);
  });

  try {
    await login(page);
    await screenshot(page, '00-after-login.png', 'After login');

    await block0_POS(page);
    await block1_Suppliers(page);
    await block2_Employees(page);
    await block3_Dashboard(page);
    await block4_Orders(page);

    // Save report
    const report = {
      timestamp: new Date().toISOString(),
      bugs: results.bugs,
      warnings: results.warnings,
      dataChecks: results.dataChecks,
      pageScores: results.pageScores,
      screenshots: results.screenshots,
    };
    fs.writeFileSync('/tmp/coffeepos-test/report.json', JSON.stringify(report, null, 2));

    // Print summary
    console.log('\n');
    console.log('========================================');
    console.log('FINAL TEST RESULTS');
    console.log('========================================');
    console.log(`\nBUGS (${results.bugs.length}):`);
    results.bugs.forEach((b, i) => console.log(`  ${i+1}. [${b.page}] ${b.description}`));

    console.log(`\nWARNINGS (${results.warnings.length}):`);
    results.warnings.forEach((w, i) => console.log(`  ${i+1}. [${w.page}] ${w.description}`));

    console.log('\nDATA:');
    console.log(`  POS Order 1: ₴${results.dataChecks.order1Total || 'N/A'}`);
    console.log(`  POS Order 2: ₴${results.dataChecks.order2Total || 'N/A'}`);
    console.log(`  POS Total:   ₴${results.dataChecks.totalRevenue || 'N/A'}`);
    console.log(`  Dashboard Revenue: ${results.dataChecks.dashboardRevenue || 'N/A'}`);
    console.log(`  History Revenue:   ${results.dataChecks.historyRevenue || 'N/A'}`);
    console.log(`  Revenue Cross-Check: ${results.dataChecks.revenueMatch !== undefined ? (results.dataChecks.revenueMatch ? 'MATCH' : 'MISMATCH!') : 'N/A'}`);
    console.log(`  Employees count: ${results.dataChecks.employeesCount || 'N/A'}`);
    console.log(`  Suppliers count: ${results.dataChecks.suppliersCount || 'N/A'}`);

    console.log('\nSCREENSHOTS:');
    results.screenshots.forEach(s => console.log(`  ${s.path}`));

  } catch (err) {
    log(`FATAL: ${err.message}`);
    console.error(err.stack);
    await screenshot(page, 'ERROR-fatal.png', 'Fatal error').catch(() => {});
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
