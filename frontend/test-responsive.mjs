/**
 * CoffeePOS — Responsive / Adaptive UX-UI Audit
 *
 * Тестує всі основні сторінки на:
 *  • iPhone SE        375×667  portrait  / 667×375 landscape
 *  • iPhone 14 Pro    393×852  portrait  / 852×393 landscape
 *  • iPad             768×1024 portrait  / 1024×768 landscape
 *  • Desktop          1440×900
 *
 * Для кожного пристрою/орієнтації:
 *  1. Скриншот
 *  2. Перевірка горизонтального overflow (елементи за межами viewport)
 *  3. Перевірка мінімальних tap-targets (≥ 40px) для кнопок
 *  4. Текст не обрізаний (no hidden overflow у text nodes)
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

// ──────────────────────────────────────────────────────────────────────────────
const OUT = '/Users/oleksandrsimcenko/CoffeePOS/frontend/task-test-screenshots/responsive';
const BASE = 'http://localhost:3000';

fs.mkdirSync(OUT, { recursive: true });
fs.readdirSync(OUT).forEach(f => fs.unlinkSync(path.join(OUT, f)));

// ──────────────────────────────────────────────────────────────────────────────
const DEVICES = [
  { name: 'iphone-se',       w: 375,  h: 667,  mobile: true,  ua: 'iPhone' },
  { name: 'iphone-se-land',  w: 667,  h: 375,  mobile: true,  ua: 'iPhone' },
  { name: 'iphone14',        w: 393,  h: 852,  mobile: true,  ua: 'iPhone' },
  { name: 'iphone14-land',   w: 852,  h: 393,  mobile: true,  ua: 'iPhone' },
  { name: 'ipad',            w: 768,  h: 1024, mobile: false, ua: 'iPad'   },
  { name: 'ipad-land',       w: 1024, h: 768,  mobile: false, ua: 'iPad'   },
  { name: 'desktop',         w: 1440, h: 900,  mobile: false, ua: null     },
];

// Pages to audit (path, label, needs auth, admin-only)
const PAGES = [
  { path: '/pos',               label: 'pos',        auth: true,  admin: false },
  { path: '/orders',            label: 'history',    auth: true,  admin: false },
  { path: '/tasks',             label: 'tasks',      auth: true,  admin: false },
  { path: '/kds',               label: 'kds',        auth: true,  admin: false },
  { path: '/admin/dashboard',   label: 'dashboard',  auth: true,  admin: true  },
  { path: '/admin/employees',   label: 'employees',  auth: true,  admin: true  },
  { path: '/admin/suppliers',   label: 'suppliers',  auth: true,  admin: true  },
  { path: '/profile',           label: 'profile',    auth: true,  admin: false },
];

// ──────────────────────────────────────────────────────────────────────────────
const issues = [];
const report = [];

let shotN = 0;
const shot = async (page, slug) => {
  const file = path.join(OUT, `${String(++shotN).padStart(3,'0')}-${slug}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
};

const flag = (device, page, issue) => {
  const entry = `[${device}] ${page}: ${issue}`;
  issues.push(entry);
  console.log(`  🐛 ${entry}`);
};

// Check for horizontal overflow
const checkOverflow = async (page, device, pageLabel) => {
  const overflowData = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const offenders = [];
    document.querySelectorAll('*').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.right > vw + 2) { // 2px tolerance
        const cls = (el.className || '').toString().substring(0, 60);
        const tag = el.tagName.toLowerCase();
        offenders.push({ tag, cls, right: Math.round(rect.right), vw });
      }
    });
    return offenders.slice(0, 5); // top 5
  });

  if (overflowData.length > 0) {
    overflowData.forEach(o => {
      flag(device, pageLabel, `Horizontal overflow: <${o.tag} class="${o.cls}"> right=${o.right}px (vw=${o.vw})`);
    });
  } else {
    console.log(`  ✅ No horizontal overflow`);
  }
  return overflowData.length;
};

// Check tap targets (buttons, links) — min 40px
const checkTapTargets = async (page, device, pageLabel) => {
  const small = await page.evaluate(() => {
    const MIN = 40;
    const results = [];
    const els = document.querySelectorAll('button, a, [role="button"]');
    els.forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.width < MIN || rect.height < MIN) {
        const text = (el.textContent || '').trim().substring(0, 30);
        const cls  = (el.className || '').toString().substring(0, 50);
        if (rect.width > 0 && rect.height > 0 && rect.width < MIN && rect.height < MIN) {
          results.push({ text, cls, w: Math.round(rect.width), h: Math.round(rect.height) });
        }
      }
    });
    return results.slice(0, 5);
  });

  if (small.length > 0) {
    small.forEach(s => {
      flag(device, pageLabel, `Small tap target: "${s.text}" ${s.w}×${s.h}px (min 40×40)`);
    });
  } else {
    console.log(`  ✅ Tap targets ok`);
  }
  return small.length;
};

// Check for text overflow / clipped text
const checkTextClip = async (page, device, pageLabel) => {
  const clipped = await page.evaluate(() => {
    const results = [];
    document.querySelectorAll('p, h1, h2, h3, span, label, button').forEach(el => {
      const style = window.getComputedStyle(el);
      const isHidden = style.overflow === 'hidden' && style.textOverflow === 'clip';
      const rect = el.getBoundingClientRect();
      if (isHidden && rect.width > 0 && el.scrollWidth > el.clientWidth + 2) {
        const text = (el.textContent || '').trim().substring(0, 40);
        results.push({ text, scrollW: el.scrollWidth, clientW: el.clientWidth });
      }
    });
    return results.slice(0, 3);
  });

  if (clipped.length > 0) {
    clipped.forEach(c => {
      console.log(`  ⚠️  Text clipped: "${c.text}" (scroll=${c.scrollW} client=${c.clientW})`);
    });
  }
};

// Check sidebar visibility on mobile
const checkSidebar = async (page, device, isMobile) => {
  if (!isMobile) return;
  const sidebar = await page.$('[class*="sidebar"], [class*="Sidebar"], nav[class*="nav"]');
  if (sidebar) {
    const box = await sidebar.boundingBox();
    if (box && box.width > 200) {
      flag(device, 'layout', `Sidebar visible and wide (${Math.round(box.width)}px) on mobile — should be hidden`);
    } else {
      console.log(`  ✅ Sidebar hidden/collapsed on mobile`);
    }
  }
};

// Check bottom nav on mobile
const checkBottomNav = async (page, device, isMobile) => {
  if (!isMobile) return;
  const bottomNav = await page.$('[class*="bottomNav"], [class*="bottom-nav"], [class*="tabBar"]');
  if (bottomNav) {
    const box = await bottomNav.boundingBox();
    console.log(`  ✅ Bottom nav found: ${Math.round(box?.width || 0)}×${Math.round(box?.height || 0)}px`);
  } else {
    console.log(`  ℹ️  No bottom nav found (check if AppShell has mobile nav)`);
  }
};

// ──────────────────────────────────────────────────────────────────────────────

async function login(page) {
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(400);
  await page.locator('input[type="text"], input[autocomplete="username"]').first().fill('owner');
  await page.locator('input[type="password"]').first().fill('owner123');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(url => !url.toString().includes('/login'), { timeout: 12000 });
  await page.waitForTimeout(800);
}

// ──────────────────────────────────────────────────────────────────────────────

async function auditDevice(browser, device) {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`📱 DEVICE: ${device.name}  (${device.w}×${device.h})`);
  console.log(`${'═'.repeat(70)}`);

  const ua = device.ua === 'iPhone'
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    : device.ua === 'iPad'
    ? 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15'
    : undefined;

  const ctx = await browser.newContext({
    viewport: { width: device.w, height: device.h },
    isMobile: device.mobile,
    hasTouch: device.mobile,
    ...(ua ? { userAgent: ua } : {}),
  });
  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); });

  // ── LOGIN ──────────────────────────────────────────────────────────────────
  await login(page);
  console.log(`  ✅ Logged in`);

  const deviceReport = { device: device.name, dims: `${device.w}×${device.h}`, pages: {} };

  for (const pg of PAGES) {
    console.log(`\n  ── ${pg.label} (${pg.path}) ──`);

    try {
      await page.goto(`${BASE}${pg.path}`, { waitUntil: 'domcontentloaded', timeout: 15000 });
      await page.waitForTimeout(1800);

      // Close any open modal
      const modalOpen = await page.locator('[role="dialog"]').first().isVisible().catch(() => false);
      if (modalOpen) {
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
      }

      const slug = `${device.name}_${pg.label}`;
      await shot(page, slug);

      const overflowCount = await checkOverflow(page, device.name, pg.label);
      await checkTapTargets(page, device.name, pg.label);
      await checkTextClip(page, device.name, pg.label);
      if (pg.label === 'pos' || pg.label === 'history' || pg.label === 'tasks') {
        await checkSidebar(page, device.name, device.mobile);
        await checkBottomNav(page, device.name, device.mobile);
      }

      // Page-specific checks
      if (pg.label === 'pos' && device.mobile) {
        // Check cart toggle button on mobile
        const cartBtn = page.locator('[class*="cartToggle"], [class*="handle"]').first();
        const cartVisible = await cartBtn.isVisible().catch(() => false);
        console.log(`  ${cartVisible ? '✅' : '⚠️ '} Cart toggle button: ${cartVisible ? 'found' : 'NOT found'}`);

        // Check if POS products fill the screen properly
        const productsArea = page.locator('[class*="products"]').first();
        const prodBox = await productsArea.boundingBox().catch(() => null);
        if (prodBox) {
          console.log(`  ✅ Products area: ${Math.round(prodBox.width)}×${Math.round(prodBox.height)}px`);
          if (prodBox.width < device.w * 0.6) {
            flag(device.name, 'pos', `Products area too narrow: ${Math.round(prodBox.width)}px (${Math.round(prodBox.width/device.w*100)}% of viewport)`);
          }
        }
      }

      if (pg.label === 'dashboard' && device.mobile) {
        // Check stat cards wrap properly
        const statCards = await page.locator('[class*="statCard"], [class*="overviewCard"]').count();
        console.log(`  ✅ Stat cards visible: ${statCards}`);
      }

      if (pg.label === 'employees' && device.mobile) {
        // Check if table is scrollable or reformatted
        const table = page.locator('[class*="tableWrapper"], table').first();
        const tBox = await table.boundingBox().catch(() => null);
        if (tBox && tBox.width > device.w + 5) {
          flag(device.name, 'employees', `Table wider than viewport: ${Math.round(tBox.width)}px > ${device.w}px`);
        } else {
          console.log(`  ✅ Table fits viewport or reformatted`);
        }
      }

      deviceReport.pages[pg.label] = { overflow: overflowCount };

    } catch (err) {
      console.log(`  ❌ Error: ${err.message.substring(0, 100)}`);
      deviceReport.pages[pg.label] = { error: err.message.substring(0, 80) };
    }
  }

  // ── Layout screenshot: login page ─────────────────────────────────────────
  await page.evaluate(() => { try { localStorage.clear(); } catch {} });
  await page.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  await shot(page, `${device.name}_login`);
  console.log(`\n  📸 Login page screenshot saved`);

  const relevantErrors = consoleErrors.filter(e =>
    !e.includes('favicon') && !e.includes('Warning') && !e.includes('hydration') && !e.includes('badge')
  );
  if (relevantErrors.length > 0) {
    console.log(`  ⚠️  Console errors: ${relevantErrors.length}`);
  }

  report.push(deviceReport);
  await ctx.close();
}

// ──────────────────────────────────────────────────────────────────────────────

async function main() {
  const browser = await chromium.launch({ headless: false, slowMo: 80 });

  for (const device of DEVICES) {
    await auditDevice(browser, device);
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log(`\n${'═'.repeat(70)}`);
  console.log('RESPONSIVE AUDIT SUMMARY');
  console.log(`${'═'.repeat(70)}`);

  if (issues.length === 0) {
    console.log('✅ No issues found across all devices/pages');
  } else {
    console.log(`🐛 ${issues.length} issue(s):\n`);
    issues.forEach((issue, i) => console.log(`  ${i+1}. ${issue}`));
  }

  const totalShots = fs.readdirSync(OUT).filter(f => f.endsWith('.png')).length;
  console.log(`\n📁 ${totalShots} screenshots → ${OUT}`);

  // Print per-device overflow table
  console.log('\n┌─────────────────────────────────────────────────────────────────────┐');
  console.log('│ Device               Overflows (by page)                            │');
  console.log('├─────────────────────────────────────────────────────────────────────┤');
  report.forEach(d => {
    const pagesSummary = Object.entries(d.pages)
      .map(([lbl, data]) => `${lbl}:${data.overflow ?? (data.error ? 'err' : '?')}`)
      .join(' ');
    console.log(`│ ${d.device.padEnd(22)} ${pagesSummary.substring(0, 46).padEnd(46)} │`);
  });
  console.log('└─────────────────────────────────────────────────────────────────────┘');

  await page.waitForTimeout?.(2000).catch(() => {});
  await browser.close();
}

// Graceful shutdown
process.on('unhandledRejection', err => {
  console.error('Unhandled:', err.message);
  process.exit(1);
});

main().catch(err => {
  console.error('\n💥 Fatal:', err.message);
  process.exit(1);
});
