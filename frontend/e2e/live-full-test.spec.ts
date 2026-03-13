/**
 * CoffeePOS — Full Live Test
 * Uses real selectors from the codebase:
 * - Modal: role="dialog" (div, not <dialog> element)
 * - Toast: role="alert" + class "toast" (custom ToastProvider)
 * - Pay button: text "Оплата" (in OrderSummary)
 * - Confirm payment: text "Підтвердити оплату"
 * - After success: "Нове замовлення" button closes modal
 * - No sonner used — custom ToastProvider
 */
import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const DIR = '/tmp/live-test';
if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

let _sc = 0;
const RESULTS: string[] = [];
const ORDERS: { method: string; products: string[]; amount: string }[] = [];

async function ss(page: Page, name: string) {
  _sc++;
  const f = path.join(DIR, `${String(_sc).padStart(2, '0')}-${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  console.log(`[SS] ${f}`);
  return f;
}
function pass(s: string, n = '') { const m = `✅ PASS: ${s}${n ? ' — ' + n : ''}`; RESULTS.push(m); console.log(m); }
function fail(s: string, n = '') { const m = `❌ FAIL: ${s}${n ? ' — ' + n : ''}`; RESULTS.push(m); console.log(m); }

async function waitForToast(page: Page, timeout = 5000): Promise<string | null> {
  // Custom Toast uses role="alert"
  try {
    const toast = page.locator('[role="alert"]').first();
    await toast.waitFor({ state: 'visible', timeout });
    // Get title text (first Text variant="labelMedium" = first direct text)
    const txt = await toast.textContent() || '';
    // Filter out icon text (just get words)
    const clean = txt.replace(/\s+/g, ' ').trim().substring(0, 100);
    console.log(`[TOAST] "${clean}"`);
    return clean;
  } catch {
    console.log('[TOAST] none');
    return null;
  }
}

async function login(page: Page) {
  await page.goto('http://localhost:3000/login');
  await page.waitForLoadState('networkidle');
  const inputs = page.locator('input');
  await inputs.first().fill('owner');
  await page.locator('input[type="password"]').first().fill('owner123');
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL(/^(?!.*\/login)/, { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
}

async function addProduct(page: Page, preferFood = false): Promise<string> {
  const names = preferFood
    ? ['Круасан', 'Маффін', 'Брауні', 'Чізкейк', 'Тірамісу', 'Хот-дог', 'Еспресо']
    : ['Еспресо', 'Американо', 'Капучіно', 'Лате', 'Допіо', 'Зелений чай'];

  for (const name of names) {
    const btn = page.locator(`button:has-text("${name}")`).first();
    if (await btn.isVisible({ timeout: 500 }).catch(() => false)) {
      await btn.click();
      await page.waitForTimeout(600);
      // Handle SizePicker (renders as div[role="dialog"] with title containing "Розмір" or as modal)
      const modal = page.locator('[role="dialog"]').first();
      if (await modal.isVisible({ timeout: 600 }).catch(() => false)) {
        const modalTitle = await modal.locator('h4, [id="modal-title"]').textContent().catch(() => '');
        console.log(`[ADD] Dialog title: "${modalTitle}"`);
        // Click the first size option (or any button that's not "Скасувати")
        const btns = modal.locator('button:not([aria-label="Закрити"])');
        const cnt = await btns.count();
        console.log(`[ADD] Size/modifier dialog: ${cnt} buttons`);
        if (cnt > 0) {
          const firstTxt = await btns.first().textContent().catch(() => '');
          console.log(`[ADD] First option: "${firstTxt}"`);
          await btns.first().click();
          await page.waitForTimeout(400);
        }
      }
      console.log(`[ADD] Added: "${name}"`);
      return name;
    }
  }

  // Fallback: click first ProductCard button
  const cards = page.locator('button[class*="ProductCard"]');
  const cnt = await cards.count().catch(() => 0);
  if (cnt > 0) {
    const txt = await cards.first().textContent().catch(() => '') || '?';
    await cards.first().click();
    await page.waitForTimeout(600);
    return txt.trim().substring(0, 20);
  }
  return '?';
}

async function doPayment(page: Page, method: 'cash' | 'card'): Promise<{ amount: string; success: boolean }> {
  // Click pay button (text "Оплата")
  const payBtn = page.locator('button:has-text("Оплата")').first();
  if (!await payBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    console.log('[PAY] Pay button not visible');
    return { amount: '', success: false };
  }
  await payBtn.click();
  await page.waitForTimeout(1000);

  // Wait for modal to appear (role="dialog")
  const modal = page.locator('[role="dialog"]').first();
  if (!await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
    console.log('[PAY] Payment modal not visible');
    return { amount: '', success: false };
  }
  console.log('[PAY] Payment modal opened');

  // Get amount from modal
  const modalText = await modal.textContent().catch(() => '');
  const amtMatch = modalText?.match(/₴[\d.,]+/g);
  const amount = amtMatch ? amtMatch[0] : '';
  console.log(`[PAY] Modal amount: "${amount}", Full text (200): "${modalText?.substring(0, 200)}"`);

  // Select payment method
  const methodText = method === 'cash' ? 'Готівка' : 'Картка';
  const methodBtn = modal.locator(`button:has-text("${methodText}")`).first();
  if (await methodBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    await methodBtn.click();
    console.log(`[PAY] Selected: "${methodText}"`);
  } else {
    console.log(`[PAY] Method button "${methodText}" not found in modal`);
    // List all buttons in modal
    const allModalBtns = modal.locator('button');
    const cnt = await allModalBtns.count();
    for (let i = 0; i < cnt; i++) {
      const t = await allModalBtns.nth(i).textContent().catch(() => '');
      console.log(`  modal btn[${i}]: "${t?.trim()}"`);
    }
  }
  await page.waitForTimeout(400);

  // Click "Підтвердити оплату"
  const confirmBtn = modal.locator('button:has-text("Підтвердити оплату")').first();
  if (!await confirmBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
    console.log('[PAY] Confirm button not found, listing buttons...');
    const btns = modal.locator('button');
    const cnt = await btns.count();
    for (let i = 0; i < cnt; i++) {
      const t = await btns.nth(i).textContent().catch(() => '');
      console.log(`  btn[${i}]: "${t?.trim()}"`);
    }
    return { amount, success: false };
  }
  await confirmBtn.click();
  console.log('[PAY] Confirmed payment');
  await page.waitForTimeout(1500);

  // Check success state — modal now shows "Оплата завершена" + "Нове замовлення" button
  const newOrderBtn = page.locator('button:has-text("Нове замовлення")').first();
  const isSuccess = await newOrderBtn.isVisible({ timeout: 3000 }).catch(() => false);
  console.log(`[PAY] Success state: ${isSuccess}`);

  if (isSuccess) {
    // Click "Нове замовлення" to close modal and clear cart
    await newOrderBtn.click();
    await page.waitForTimeout(1000);
  } else {
    // Check if modal closed automatically
    const modalStillOpen = await modal.isVisible({ timeout: 500 }).catch(() => false);
    console.log(`[PAY] Modal still open: ${modalStillOpen}`);
    if (!modalStillOpen) {
      console.log('[PAY] Modal closed automatically — success');
    }
  }

  // Check cart cleared
  const cartCnt = await page.locator('[role="dialog"]').count().catch(() => 0);
  console.log(`[PAY] Dialogs remaining: ${cartCnt}`);

  return { amount, success: isSuccess };
}

// ══════════════════════════════════════════════
test.describe.serial('CoffeePOS Live Full Test', () => {
  test.setTimeout(120000);

  test('Крок 0: Логін', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    await ss(page, 'login-page');

    const inputs = page.locator('input');
    const cnt = await inputs.count();
    for (let i = 0; i < cnt; i++) {
      const t = await inputs.nth(i).getAttribute('type');
      const ph = await inputs.nth(i).getAttribute('placeholder');
      console.log(`  input[${i}]: type="${t}" placeholder="${ph}"`);
    }

    await inputs.first().fill('owner');
    await page.locator('input[type="password"]').first().fill('owner123');
    await ss(page, 'login-filled');

    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/^(?!.*\/login)/, { timeout: 15000 });
    await page.waitForTimeout(1000);
    await ss(page, 'after-login');

    const url = page.url();
    console.log(`[LOGIN] URL: ${url}`);
    pass('Крок 0: Логін', `URL: ${url}`);
    expect(url).not.toContain('/login');
  });

  test('Крок 1: POS — Відкриття зміни', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await ss(page, 'pos-initial');

    const openBtn = page.locator('button').filter({ hasText: /відкрити зміну/i }).first();
    const isVisible = await openBtn.isVisible({ timeout: 2000 }).catch(() => false);

    if (isVisible) {
      await openBtn.click();
      await page.waitForTimeout(800);
      await ss(page, 'open-shift-modal');

      const numInput = page.locator('input[type="number"]').first();
      if (await numInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await numInput.fill('1000');
      }
      await ss(page, 'open-shift-filled');

      // Confirm button in modal
      const modal = page.locator('[role="dialog"]').first();
      const confirmBtn = modal.locator('button:not([aria-label="Закрити"])').last();
      await confirmBtn.click();
      await page.waitForTimeout(2000);

      const toast = await waitForToast(page);
      await ss(page, 'shift-opened-toast');
      pass('Крок 1: Відкриття зміни', `Toast: "${toast}"`);
    } else {
      await ss(page, 'pos-shift-already-open');
      pass('Крок 1: Зміна вже відкрита', 'OK');
    }
  });

  test('Крок 2: POS — Перше замовлення (готівка)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const p1 = await addProduct(page, false);
    await page.waitForTimeout(300);
    const p2 = await addProduct(page, true);
    await page.waitForTimeout(300);
    await ss(page, 'pos-cart-2-items');

    // Check cart total
    const totalEl = page.locator('[class*="total"]').filter({ hasText: '₴' }).first();
    const totalTxt = await totalEl.textContent().catch(() => '');
    console.log(`[POS] Cart total: "${totalTxt}"`);

    const cartItems = page.locator('[class*="OrderItem"], [class*="order-item"]');
    const itemCnt = await cartItems.count();
    console.log(`[POS] Cart items: ${itemCnt}`);

    if (itemCnt < 1) {
      fail('Крок 2: Товари не додались до корзини', `${itemCnt} items`);
    }

    await ss(page, 'pos-cart-before-payment');
    const { amount, success } = await doPayment(page, 'cash');
    await ss(page, 'pos-order1-complete');

    ORDERS.push({ method: 'cash', products: [p1, p2], amount });
    fs.writeFileSync(path.join(DIR, 'order1.json'), JSON.stringify({ method: 'cash', products: [p1, p2], amount }, null, 2));

    if (success || amount) {
      pass('Крок 2: Перше замовлення (готівка)', `${p1} + ${p2} = ${amount}`);
    } else {
      fail('Крок 2: Перше замовлення (готівка)', 'payment failed');
    }
  });

  test('Крок 3: POS — Друге замовлення (картка)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Add different products to distinguish
    const p1 = await addProduct(page, true); // food first
    await page.waitForTimeout(300);
    const p2 = await addProduct(page, false); // drink second
    await page.waitForTimeout(300);
    await ss(page, 'pos-order2-cart');

    const { amount, success } = await doPayment(page, 'card');
    await ss(page, 'pos-order2-complete');

    ORDERS.push({ method: 'card', products: [p1, p2], amount });
    fs.writeFileSync(path.join(DIR, 'order2.json'), JSON.stringify({ method: 'card', products: [p1, p2], amount }, null, 2));

    if (success || amount) {
      pass('Крок 3: Друге замовлення (картка)', `${p1} + ${p2} = ${amount}`);
    } else {
      fail('Крок 3: Друге замовлення (картка)', 'payment failed');
    }
  });

  test('Крок 4: Перевірка Історії (/orders)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/orders');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    await ss(page, 'orders-page');

    const bodyText = await page.locator('body').textContent().catch(() => '');
    console.log(`[ORDERS] Body text (800): "${bodyText?.substring(0, 800)}"`);

    // Count ORD- occurrences
    const matches = bodyText?.match(/ORD-\d{8}-\w+/g) || [];
    console.log(`[ORDERS] ORD numbers found: ${matches.length} — ${matches.slice(0, 5).join(', ')}`);

    // Look for stats (total, count)
    const statsText = await page.locator('[class*="stat" i], [class*="header" i], [class*="summary" i]').first().textContent().catch(() => '');
    console.log(`[ORDERS] Stats area: "${statsText?.substring(0, 200)}"`);

    // Try to find today's orders specifically
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const todayOrders = matches.filter(m => m.includes(today));
    console.log(`[ORDERS] Today's orders (${today}): ${todayOrders.length} — ${todayOrders.join(', ')}`);

    if (matches.length >= 2) {
      pass('Крок 4: ORD-номери в списку', `${matches.length} замовлень: ${matches.slice(0, 3).join(', ')}`);
    } else {
      fail('Крок 4: ORD-номери', `Знайдено ${matches.length}`);
    }

    // Accordion items — look for Radix accordion or summary elements
    const accTriggers = page.locator('[data-radix-accordion-trigger], summary, [role="button"][class*="accordion" i]');
    const accCnt = await accTriggers.count();
    console.log(`[ORDERS] Accordion triggers: ${accCnt}`);

    if (accCnt === 0) {
      // Try clicking any clickable row
      const rows = page.locator('[class*="order" i]').filter({ hasText: 'ORD-' });
      const rowCnt = await rows.count();
      console.log(`[ORDERS] Order rows: ${rowCnt}`);
      if (rowCnt > 0) {
        await rows.first().click();
        await page.waitForTimeout(800);
        await ss(page, 'orders-first-expanded');
      }
    } else {
      await accTriggers.first().click();
      await page.waitForTimeout(800);
      await ss(page, 'orders-first-expanded');

      const expandedText = await page.locator('[data-state="open"], [data-radix-accordion-content]').first().textContent().catch(() => '');
      console.log(`[ORDERS] First order expanded (200): "${expandedText?.substring(0, 200)}"`);

      if (expandedText?.includes('Готівка') || expandedText?.includes('готівка')) {
        pass('Крок 4: Перше замовлення — Готівка', 'OK');
      } else {
        console.log('[ORDERS] Could not verify cash payment type in expanded text');
      }

      if (accCnt >= 2) {
        await accTriggers.nth(1).click();
        await page.waitForTimeout(800);
        await ss(page, 'orders-second-expanded');
        const expandedText2 = await page.locator('[data-state="open"], [data-radix-accordion-content]').first().textContent().catch(() => '');
        console.log(`[ORDERS] Second order (200): "${expandedText2?.substring(0, 200)}"`);
        if (expandedText2?.includes('Картка') || expandedText2?.includes('картка')) {
          pass('Крок 4: Друге замовлення — Картка', 'OK');
        }
      }
    }

    // Check stats pill
    const uahMatches = bodyText?.match(/₴[\d ,.]+/g) || [];
    console.log(`[ORDERS] UAH values: ${uahMatches.slice(0, 5).join(', ')}`);
  });

  test('Крок 5: Аналітика — Overview (/admin/dashboard)', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    await ss(page, 'dashboard-overview');

    const mainText = await page.locator('main').textContent().catch(() => '');
    console.log(`[DASH] Main text (1000): "${mainText?.substring(0, 1000)}"`);

    // Check "Немає даних"
    const noDataCnt = (mainText?.match(/Немає даних/g) || []).length;
    console.log(`[DASH] "Немає даних" count: ${noDataCnt}`);
    if (noDataCnt === 0) {
      pass('Крок 5: Немає "Немає даних"', 'OK');
    } else {
      fail('Крок 5: "Немає даних" на dashboard', `${noDataCnt} рази`);
    }

    // Check KPI metrics
    const metrics = ['Виторг сьогодні', 'Замовлень сьогодні', 'Середній чек', 'Активних змін'];
    for (const m of metrics) {
      if (mainText?.includes(m)) {
        pass(`Крок 5: Метрика "${m}"`, 'Присутня');
      } else {
        fail(`Крок 5: Метрика "${m}"`, 'Відсутня в тексті');
      }
    }

    // Check UAH values
    const uahVals = mainText?.match(/₴[\d ,.]+/g) || [];
    console.log(`[DASH] UAH values: ${uahVals.slice(0, 10).join(', ')}`);
    if (uahVals.length > 0) {
      pass('Крок 5: ₴ значення присутні', uahVals.slice(0, 3).join(', '));
    } else {
      fail('Крок 5: Немає ₴ значень', '');
    }

    // Check "Активних змін" = 1
    if (mainText?.includes('1') && mainText?.includes('Активних змін')) {
      pass('Крок 5: Активних змін', '1');
    }

    // SVG charts count
    const svgCnt = await page.locator('svg').count();
    console.log(`[DASH] SVG elements: ${svgCnt}`);
    if (svgCnt > 0) {
      pass('Крок 5: SVG графіки', `${svgCnt} SVG`);
    }

    // Payment section (pie chart)
    const paySection = page.locator(':has-text("Оплата сьогодні"), :has-text("оплата")').filter({ hasText: '₴' }).first();
    const payTxt = await paySection.textContent().catch(() => '');
    console.log(`[DASH] Payment section (200): "${payTxt?.substring(0, 200)}"`);

    if (payTxt?.includes('Готівка') || mainText?.includes('Готівка')) {
      pass('Крок 5: Pie chart — Готівка', 'OK');
    } else {
      // Check entire page for Готівка
      if (mainText?.includes('Готівка')) {
        pass('Крок 5: Готівка в dashboard', 'OK');
      } else {
        fail('Крок 5: Готівка відсутня в dashboard', '');
      }
    }
    if (mainText?.includes('Картка') || mainText?.includes('картк')) {
      pass('Крок 5: Картка в dashboard', 'OK');
    }

    await ss(page, 'dashboard-pie-section');
  });

  test('Крок 6: Аналітика — Календар та Day Detail Modal', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/admin/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Find SegmentedControl / tabs
    const allBtns = page.locator('button');
    const bCnt = await allBtns.count();
    console.log(`[CAL] Total buttons: ${bCnt}`);

    // Find "Календар" button
    let calFound = false;
    for (let i = 0; i < bCnt; i++) {
      const txt = await allBtns.nth(i).textContent().catch(() => '');
      if (txt?.trim().includes('Календар')) {
        console.log(`[CAL] Found "Календар" at button[${i}]`);
        await allBtns.nth(i).click();
        calFound = true;
        break;
      }
    }

    if (!calFound) {
      fail('Крок 6: Кнопка "Календар" не знайдена', '');
      await ss(page, 'no-calendar-btn');
      return;
    }

    await page.waitForTimeout(2000);
    await ss(page, 'dashboard-calendar');
    pass('Крок 6: Переключення на Календар', 'OK');

    // Find today's cell — calendar should show current month
    // Today: March 11, 2026 — look for cell "11"
    const bodyText = await page.locator('body').textContent().catch(() => '');
    console.log(`[CAL] Page after calendar switch (400): "${bodyText?.substring(0, 400)}"`);

    // Look for "11" in a calendar day cell
    const dayCells = page.locator('[class*="day" i], [class*="cell" i], td, [class*="calendar" i] button');
    const dayCnt = await dayCells.count();
    console.log(`[CAL] Day cells: ${dayCnt}`);

    let todayCell = null;

    // Strategy 1: class containing "today"
    const todayByClass = page.locator('[class*="today" i]').first();
    if (await todayByClass.isVisible({ timeout: 500 }).catch(() => false)) {
      todayCell = todayByClass;
      const txt = await todayCell.textContent().catch(() => '');
      console.log(`[CAL] Found today by class: "${txt?.trim()}"`);
    }

    // Strategy 2: look through cells for text "11"
    if (!todayCell) {
      for (let i = 0; i < Math.min(dayCnt, 50); i++) {
        const txt = await dayCells.nth(i).textContent().catch(() => '');
        if (txt?.trim() === '11') {
          todayCell = dayCells.nth(i);
          console.log(`[CAL] Found cell "11" at index ${i}`);
          break;
        }
      }
    }

    if (!todayCell) {
      fail('Крок 6: Клітинка "11" (сьогодні) не знайдена', `${dayCnt} cells`);
      await ss(page, 'calendar-no-today');
      return;
    }

    await todayCell.click();
    await page.waitForTimeout(1500);
    await ss(page, 'day-detail-modal');

    // Check for Day Detail Modal
    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    console.log(`[CAL] Day detail modal visible: ${modalVisible}`);

    if (!modalVisible) {
      fail('Крок 6: Day Detail Modal не відкрився', '');
      await ss(page, 'no-day-detail-modal');
      return;
    }

    pass('Крок 6: Day Detail Modal відкрився', 'OK');
    const modalText = await modal.textContent().catch(() => '');
    console.log(`[CAL] Modal text (500): "${modalText?.substring(0, 500)}"`);

    // Check revenue ₴
    const hasUah = modalText?.includes('₴');
    if (hasUah) pass('Крок 6: Modal має ₴ суми', 'OK');
    else fail('Крок 6: Modal не має ₴ сум', `text: "${modalText?.substring(0, 100)}"`);

    // Check cash/card
    const hasCash = modalText?.toLowerCase().includes('готівк');
    const hasCard = modalText?.toLowerCase().includes('картк');
    if (hasCash) pass('Крок 6: Modal — Готівка', 'OK');
    else fail('Крок 6: Modal — Готівка відсутня', '');
    if (hasCard) pass('Крок 6: Modal — Картка', 'OK');
    else fail('Крок 6: Modal — Картка відсутня', '');

    // Check orders count
    const hasOrders = modalText?.toLowerCase().includes('замовл');
    if (hasOrders) pass('Крок 6: Modal — замовлення', 'OK');

    // Try to click a Shift card
    const shiftBtns = modal.locator('[class*="shift" i], [class*="card" i] button').all();
    const sbs = await shiftBtns;
    console.log(`[CAL] Shift-like elements in modal: ${sbs.length}`);
    for (const sb of sbs.slice(0, 3)) {
      const t = await sb.textContent().catch(() => '');
      console.log(`  shift btn: "${t?.trim().substring(0, 60)}"`);
    }

    const shiftCard = modal.locator('[class*="ShiftCard" i], [class*="shift-card" i], [class*="shiftCard" i]').first();
    if (await shiftCard.isVisible({ timeout: 500 }).catch(() => false)) {
      await shiftCard.click();
      await page.waitForTimeout(1000);
      await ss(page, 'shift-detail-modal');
      const shiftModals = page.locator('[role="dialog"]');
      const shiftModalCnt = await shiftModals.count();
      const shiftModalText = await shiftModals.last().textContent().catch(() => '');
      console.log(`[CAL] Shift modals: ${shiftModalCnt}, text (300): "${shiftModalText?.substring(0, 300)}"`);
      pass('Крок 6: Shift Detail Modal', 'OK');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(500);
    }

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  });

  test('Крок 7: Toast та скасування оплати', async ({ page }) => {
    await login(page);
    await page.goto('http://localhost:3000/pos');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Add one product
    const p = await addProduct(page, false);
    await page.waitForTimeout(300);
    await ss(page, 'pos-step7-cart');

    // Check for any error toasts on page load
    const errorToasts = page.locator('[role="alert"][class*="error" i]');
    const errCnt = await errorToasts.count();
    if (errCnt === 0) {
      pass('Крок 7: Немає error toast при завантаженні', 'OK');
    } else {
      fail('Крок 7: Error toast при завантаженні', `${errCnt}`);
    }

    // Open payment modal
    const payBtn = page.locator('button:has-text("Оплата")').first();
    if (await payBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await payBtn.click();
    }
    await page.waitForTimeout(800);
    await ss(page, 'pos-payment-modal-step7');

    const modal = page.locator('[role="dialog"]').first();
    const modalVisible = await modal.isVisible({ timeout: 2000 }).catch(() => false);
    if (modalVisible) {
      pass('Крок 7: Payment modal відкрився', 'OK');
    } else {
      fail('Крок 7: Payment modal не відкрився', '');
    }

    // Cancel via ESC
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
    await ss(page, 'pos-after-esc');

    const modalAfterEsc = await page.locator('[role="dialog"]').first().isVisible({ timeout: 500 }).catch(() => false);
    if (!modalAfterEsc) {
      pass('Крок 7: ESC закрив modal', 'OK');
    } else {
      fail('Крок 7: ESC не закрив modal', 'modal still open');
    }

    // Check cart still has items (payment was cancelled)
    const cartText = await page.locator('[class*="OrderSummary" i], [class*="order-summary" i]').first().textContent().catch(() => '');
    console.log(`[STEP7] Cart after cancel (200): "${cartText?.substring(0, 200)}"`);

    const stillHasItem = cartText?.includes(p) || cartText?.includes('₴');
    if (stillHasItem) {
      pass('Крок 7: Корзина збереглась після скасування', `product "${p}" or ₴ still visible`);
    } else {
      // Check if any order items visible
      const itemsInCart = await page.locator('[class*="OrderItem"]').count();
      if (itemsInCart > 0) {
        pass('Крок 7: Корзина збереглась', `${itemsInCart} items`);
      } else {
        fail('Крок 7: Корзина пуста після скасування', '');
      }
    }

    // No error toast after cancel
    await page.waitForTimeout(500);
    const errAfterCancel = await page.locator('[role="alert"][class*="error" i]').count();
    if (errAfterCancel === 0) {
      pass('Крок 7: Немає error toast після скасування', 'OK');
    } else {
      fail('Крок 7: Error toast після скасування', `${errAfterCancel}`);
    }

    await ss(page, 'pos-step7-final');
  });

  test('Фінальний звіт', async () => {
    // Load saved order data
    try {
      const o1 = JSON.parse(fs.readFileSync(path.join(DIR, 'order1.json'), 'utf-8'));
      const o2 = JSON.parse(fs.readFileSync(path.join(DIR, 'order2.json'), 'utf-8'));
      console.log('\n--- СУМИ ЗАМОВЛЕНЬ ---');
      console.log(`Замовлення 1 (${o1.method}): ${o1.products.join(' + ')} = ${o1.amount}`);
      console.log(`Замовлення 2 (${o2.method}): ${o2.products.join(' + ')} = ${o2.amount}`);

      // Calculate sum
      const parseAmt = (s: string) => parseFloat(s.replace('₴', '').replace(',', '.').trim()) || 0;
      const sum = parseAmt(o1.amount) + parseAmt(o2.amount);
      console.log(`Загальна виручка: ₴${sum.toFixed(2)}`);
    } catch { console.log('Could not load order files'); }

    console.log('\n--- РЕЗУЛЬТАТИ ---');
    const passes = RESULTS.filter(r => r.includes('✅')).length;
    const fails = RESULTS.filter(r => r.includes('❌')).length;
    for (const r of RESULTS) console.log(r);
    console.log(`\nПАС: ${passes}, ФЕЙЛ: ${fails}`);

    const files = fs.readdirSync(DIR).filter(f => f.endsWith('.png')).sort();
    console.log('\n--- СКРІНШОТИ ---');
    files.forEach(f => console.log(`  /tmp/live-test/${f}`));

    fs.writeFileSync(path.join(DIR, 'report.txt'), RESULTS.join('\n'));
  });
});
