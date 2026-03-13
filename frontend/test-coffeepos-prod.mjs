import { chromium } from 'playwright';
import { writeFileSync } from 'fs';

const BASE = 'https://coffee-pos-ten.vercel.app';
const SS_DIR = '/tmp/playwright-coffeepos/screenshots';
const results = [];

function log(label, passed, detail = '') {
  const status = passed ? 'PASS' : 'FAIL';
  results.push({ label, status, detail });
  console.log(`[${status}] ${label}${detail ? ' — ' + detail : ''}`);
}

async function screenshot(page, name) {
  const path = `${SS_DIR}/${name}.png`;
  await page.screenshot({ path, fullPage: true });
  console.log(`  Screenshot saved: ${path}`);
  return path;
}

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
  await screenshot(page, '00-login-page');
  const usernameInput = await page.$('input[name="username"]') ||
    await page.$('input[type="text"]') ||
    await page.$('input[placeholder*="логін"]') ||
    await page.$('input[placeholder*="ім"]') ||
    await page.$('input:not([type="password"])');
  if (!usernameInput) throw new Error('Username input not found');
  await usernameInput.fill('owner');
  await page.fill('input[type="password"]', 'owner123');
  await screenshot(page, '00-login-filled');
  await page.click('button[type="submit"]');
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 15000 });
  console.log('  Logged in, current URL:', page.url());
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  console.log('\n=== LOGIN ===');
  try {
    await login(page);
    log('Login as owner', true, page.url());
  } catch (e) {
    log('Login as owner', false, e.message);
    await screenshot(page, '00-login-fail');
    await browser.close();
    writeFileSync(`${SS_DIR}/../results.json`, JSON.stringify(results, null, 2));
    process.exit(1);
  }

  console.log('\n=== /profile ===');
  await page.goto(`${BASE}/profile`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, '01-profile-full');

  const avatar = await page.$('img[alt*="vatar"], .avatar, [class*="avatar"], [class*="Avatar"]');
  log('Profile: avatar visible', !!avatar, avatar ? 'found element' : 'no avatar element found');

  const nameEl = await page.$('h1, h2');
  const nameText = nameEl ? await nameEl.innerText() : '';
  log('Profile: employee name visible', nameText.trim().length > 0, '"' + nameText.trim().substring(0, 40) + '"');

  const roleBadge = await page.$('[class*="badge"], [class*="Badge"], [class*="role"], [class*="Role"]');
  const roleBadgeText = roleBadge ? await roleBadge.innerText() : '';
  log('Profile: role badge visible', !!roleBadge, '"' + roleBadgeText.trim() + '"');

  const bodyText = await page.innerText('body');
  const hasHireText = /найнят|дата найму|hired|з \d|від \d|hire/i.test(bodyText);
  log('Profile: hire date text present', hasHireText, hasHireText ? 'found hire date text' : 'no hire date text');

  const floatingHireCard = await page.$('[class*="hire-card"], [class*="hireCard"], [class*="hire_card"]');
  log('Profile: hire badge NOT a separate floating card', !floatingHireCard, floatingHireCard ? 'WARNING: separate hire card found' : 'no separate hire card (good)');

  const statsStrip = await page.$$eval('*', els => {
    return els.some(el => /всього змін|годин роботи/i.test(el.innerText || ''));
  });
  log('Profile: stats strip visible (Всього змін / Годин роботи)', statsStrip, statsStrip ? 'found stats text' : 'not found');

  const canvas = await page.$('canvas');
  const chartContainer = await page.$('[class*="chart"], [class*="Chart"]');
  log('Profile: charts section renders', !!(canvas || chartContainer), canvas ? 'canvas found' : chartContainer ? 'chart container found' : 'no chart element');

  const myShifts = await page.$$eval('*', els =>
    els.some(el => /мої зміни/i.test(el.innerText || ''))
  );
  log('Profile: "Мої зміни" table section visible', myShifts, myShifts ? 'found text' : 'not found');

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(500);
  await screenshot(page, '01-profile-bottom');

  console.log('\n=== /admin/employees ===');
  await page.goto(`${BASE}/admin/employees`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, '02-employees-list');

  const rows = await page.$$('tbody tr');
  log('Employees: table shows employee rows', rows.length > 0, rows.length + ' tbody rows found');

  const tableBadges = await page.$$('[class*="badge"], [class*="Badge"]');
  log('Employees: role/status badges visible', tableBadges.length > 0, tableBadges.length + ' badge elements');

  const empBodyText = await page.innerText('body');
  const hasStatus = /активний|неактивний|active|inactive/i.test(empBodyText);
  log('Employees: status badges text visible', hasStatus, hasStatus ? 'found status text' : 'not found');

  const analyticsTab = await page.$('button:has-text("Аналітика"), [role="tab"]:has-text("Аналітика"), a:has-text("Аналітика")');
  log('Employees: "Аналітика" tab button found', !!analyticsTab, analyticsTab ? 'tab found' : 'not found');

  if (analyticsTab) {
    await analyticsTab.click();
    await page.waitForTimeout(2000);
    await screenshot(page, '02-employees-analytics');

    const monthNavText = await page.$$eval('*', els =>
      els.some(el => /січень|лютий|березень|квітень|травень|червень|липень|серпень|вересень|жовтень|листопад|грудень/i.test(el.innerText || ''))
    );
    log('Employees Analytics: month navigation bar visible', monthNavText, monthNavText ? 'month name found' : 'not found');

    const chartCanvases = await page.$$('canvas');
    const chartDivs = await page.$$('[class*="chart"], [class*="Chart"]');
    log('Employees Analytics: chart cards render', chartCanvases.length >= 1 || chartDivs.length >= 1, chartCanvases.length + ' canvases, ' + chartDivs.length + ' chart divs');

    const analyticsBody = await page.innerText('body');
    const perfTable = /продуктивність|ефективність|performance|працівник/i.test(analyticsBody);
    log('Employees Analytics: performance table shows', perfTable, perfTable ? 'found relevant text' : 'not found');
  } else {
    const allTabs = await page.$$eval('[role="tab"], [class*="tab"], [class*="Tab"]', els =>
      els.map(el => el.innerText ? el.innerText.trim() : '').filter(Boolean)
    );
    console.log('  Available tab texts:', allTabs);
    log('Employees Analytics: month navigation bar visible', false, 'tab not found, skipped');
    log('Employees Analytics: chart cards render', false, 'tab not found, skipped');
    log('Employees Analytics: performance table shows', false, 'tab not found, skipped');
  }

  console.log('\n=== /orders ===');
  await page.goto(`${BASE}/orders`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await screenshot(page, '03-orders-initial');

  const ordersBody = await page.innerText('body');

  const hasShift = /зміна|shift/i.test(ordersBody);
  log('Orders: shift context line visible', hasShift, hasShift ? 'found shift text' : 'not found');

  const hasOrdersLabel = /замовлень/i.test(ordersBody);
  const hasRevenueLabel = /виручка/i.test(ordersBody);
  log('Orders: stats "Замовлень" label visible', hasOrdersLabel, hasOrdersLabel ? 'found' : 'not found');
  log('Orders: stats "Виручка" label visible', hasRevenueLabel, hasRevenueLabel ? 'found' : 'not found');

  const statsPillEl = await page.$('[class*="stat"], [class*="Stat"], [class*="pill"], [class*="Pill"]');
  log('Orders: stats pill element found', !!statsPillEl, statsPillEl ? 'found' : 'not found');

  const hasOrdersList = await page.$('table, [class*="orderList"], [class*="OrderList"], [class*="order-list"]');
  const hasEmptyState = /немає замовлень|порожньо|no orders|empty/i.test(ordersBody);
  log('Orders: orders list or empty state shows', !!(hasOrdersList || hasEmptyState), hasOrdersList ? 'list element found' : hasEmptyState ? 'empty state text' : 'neither found');

  const searchInput = await page.$('input[type="search"]') ||
    await page.$('input[placeholder*="пошук"]') ||
    await page.$('input[placeholder*="Пошук"]') ||
    await page.$('input[placeholder*="search"]') ||
    await page.$('input[placeholder*="Search"]');
  log('Orders: search input found', !!searchInput, searchInput ? 'found' : 'not found');

  if (searchInput) {
    await searchInput.fill('test');
    await page.waitForTimeout(800);
    await screenshot(page, '03-orders-search');
    log('Orders: search input accepts text', true, 'typed "test", page stable');
    await searchInput.fill('');
    await page.waitForTimeout(500);
    await screenshot(page, '03-orders-search-cleared');
    log('Orders: search cleared', true);
  } else {
    const inputs = await page.$$eval('input', els => els.map(el => 'type=' + el.type + ' placeholder="' + el.placeholder + '" name="' + el.name + '"'));
    console.log('  All inputs on orders page:', inputs);
    log('Orders: search typing test', false, 'search input not found');
    log('Orders: search cleared', false, 'search input not found');
  }

  await browser.close();

  writeFileSync(`${SS_DIR}/../results.json`, JSON.stringify(results, null, 2));

  console.log('\n=== SUMMARY ===');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  console.log('Total: ' + results.length + ' checks | PASS: ' + passed + ' | FAIL: ' + failed);
  if (failed > 0) {
    console.log('FAILED checks:');
    results.filter(r => r.status === 'FAIL').forEach(r => console.log('  - ' + r.label + ': ' + r.detail));
  }
})();
