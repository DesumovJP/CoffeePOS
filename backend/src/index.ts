import type { Core } from '@strapi/strapi';
import seed from './seed';
import { seedUsers } from './seed';
import { employees } from './seed/data';

// ============================================================
// Kyiv timezone helpers (UTC+2 winter / UTC+3 summer)
// ============================================================
const KYIV_TZ = 'Europe/Kiev';

function toKyivDate(isoString: string): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: KYIV_TZ }).format(new Date(isoString));
}

function kyivDayStartUTC(kyivDateStr: string): string {
  for (const offset of ['+02:00', '+03:00']) {
    const candidate = new Date(`${kyivDateStr}T00:00:00.000${offset}`);
    if (toKyivDate(candidate.toISOString()) !== kyivDateStr) continue;
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: KYIV_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' }).format(candidate),
      10
    );
    if (hour === 0) return candidate.toISOString();
  }
  return new Date(`${kyivDateStr}T00:00:00.000+02:00`).toISOString();
}

function kyivDayEndUTC(kyivDateStr: string): string {
  for (const offset of ['+02:00', '+03:00']) {
    const candidate = new Date(`${kyivDateStr}T23:59:59.999${offset}`);
    if (toKyivDate(candidate.toISOString()) !== kyivDateStr) continue;
    const hour = parseInt(
      new Intl.DateTimeFormat('en-US', { timeZone: KYIV_TZ, hour: 'numeric', hour12: false, hourCycle: 'h23' }).format(candidate),
      10
    );
    if (hour === 23) return candidate.toISOString();
  }
  return new Date(`${kyivDateStr}T23:59:59.999+02:00`).toISOString();
}

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Ensure permissions for all content types
    await ensurePermissions(strapi);

    // Migrate categories 8→4 (idempotent)
    await migrateCategoriesV2(strapi);

    // Check if we should seed the database
    const shouldSeed = process.env.SEED_DATABASE === 'true';

    if (shouldSeed) {
      const forceReseed = process.env.FORCE_RESEED === 'true';
      const productsCount = await strapi.db.query('api::product.product').count();

      if (productsCount === 0 || forceReseed) {
        strapi.log.info(forceReseed ? 'Force reseed requested...' : 'No products found, running full seed...');
        await seed({ strapi } as any);
        await seedUsers({ strapi });
      } else {
        strapi.log.info(`Database already has ${productsCount} products, skipping seed.`);
        await seedUsers({ strapi });
      }
    }

    // Seed employees if missing (runs always, has own guard)
    await ensureEmployees(strapi);

    // Auto-create closed shifts for every Kyiv day that has orders but no shift
    await ensureDailyShifts(strapi);
  },
};

/**
 * Migrate categories from 8 old slugs to 4 new ones.
 * Idempotent — no-op if old categories are already gone.
 *
 * Special case: 'pastry' slug is reused (Випічка → Кондитерка),
 * so it is updated in-place rather than delete+recreate.
 */
async function migrateCategoriesV2(strapi: Core.Strapi) {
  try {
    const catQuery = strapi.db.query('api::category.category');
    const productQuery = strapi.db.query('api::product.product');

    // These 7 old slugs will be deleted; 'pastry' is handled separately (rename in-place)
    const OLD_SLUGS_TO_DELETE = ['coffee', 'signature', 'tea', 'drinks', 'desserts', 'food', 'breakfast'];
    const OLD_SLUG_TO_NEW_SLUG: Record<string, string> = {
      coffee: 'hot', signature: 'hot', tea: 'hot',
      drinks: 'cold',
      desserts: 'pastry',
      food: 'grill', breakfast: 'grill',
    };

    const existingOld = await catQuery.findMany({ where: { slug: { $in: OLD_SLUGS_TO_DELETE } } });
    const existingPastry = await catQuery.findOne({ where: { slug: 'pastry' } }) as any;
    const pastryNeedsRename = existingPastry && existingPastry.name !== 'Кондитерка';

    if (existingOld.length === 0 && !pastryNeedsRename) return; // Already migrated

    // 1. Upsert/update all 4 new categories
    const newCatDefs = [
      { slug: 'hot',    name: 'Гарячі напої', icon: 'coffee',   color: '#C0392B', sortOrder: 1, isActive: true },
      { slug: 'cold',   name: 'Холодні',      icon: 'glass',    color: '#2980B9', sortOrder: 2, isActive: true },
      { slug: 'pastry', name: 'Кондитерка',   icon: 'cake',     color: '#E67E22', sortOrder: 3, isActive: true },
      { slug: 'grill',  name: 'Гріль',        icon: 'utensils', color: '#27AE60', sortOrder: 4, isActive: true },
    ];
    for (const def of newCatDefs) {
      const existing = await catQuery.findOne({ where: { slug: def.slug } }) as any;
      if (existing) {
        // Update in-place (renames old 'pastry' Випічка → Кондитерка; refreshes others if already created)
        await catQuery.update({ where: { id: existing.id }, data: { name: def.name, icon: def.icon, color: def.color, sortOrder: def.sortOrder } });
      } else {
        await catQuery.create({ data: def });
      }
    }

    // 2. For each deletable old category: move its products to the new target, then delete it
    for (const oldCat of existingOld as any[]) {
      const newSlug = OLD_SLUG_TO_NEW_SLUG[oldCat.slug];
      if (!newSlug) continue;
      const newCat = await catQuery.findOne({ where: { slug: newSlug } }) as any;
      if (!newCat) continue;
      const products = await productQuery.findMany({ where: { category: { id: oldCat.id } } }) as any[];
      for (const product of products) {
        await productQuery.update({ where: { id: product.id }, data: { category: newCat.id } });
      }
      await catQuery.delete({ where: { id: oldCat.id } });
    }
    // Note: old 'pastry' (Випічка) was renamed to 'Кондитерка' in step 1 — its products stay put.
    // Products from 'desserts' were moved to the updated 'pastry' (Кондитерка) record.

    strapi.log.info('[bootstrap] migrateCategoriesV2: migrated 8→4 categories');
  } catch (error) {
    strapi.log.error('Failed to migrate categories:');
    console.error(error);
  }
}

/**
 * Seed employees if the table is empty.
 */
async function ensureEmployees(strapi: Core.Strapi) {
  try {
    const empQuery = strapi.db.query('api::employee.employee');
    const count = await empQuery.count();

    if (count > 0) {
      strapi.log.info(`Employees: ${count} already exist, skipping seed.`);
      return;
    }

    // Get first cafe for relation
    const cafe = await strapi.db.query('api::cafe.cafe').findOne({ where: {} });
    const cafeId = cafe?.id;

    for (const emp of employees) {
      await empQuery.create({
        data: { ...emp, cafe: cafeId || undefined },
      });
      strapi.log.info(`  ✓ Created employee: ${emp.name} (${emp.role})`);
    }

    strapi.log.info(`Employees: seeded ${employees.length} employees`);
  } catch (error) {
    strapi.log.error('Failed to seed employees:');
    console.error(error);
  }
}

/**
 * Auto-create a closed "Автозміна" shift for every Kyiv calendar day that has
 * orders but no real shift record. Runs on every bootstrap; fully idempotent.
 *
 * Rules:
 *  - Skip today (the day might still be in progress).
 *  - Skip any day that already has at least one shift (opened during that Kyiv day).
 */
async function ensureDailyShifts(strapi: Core.Strapi) {
  try {
    const orderQuery = strapi.db.query('api::order.order') as any;
    const shiftQuery = strapi.db.query('api::shift.shift') as any;

    // All orders (just need createdAt + total + payment for aggregation)
    const orders = await orderQuery.findMany({
      populate: ['payment'],
      orderBy: { createdAt: 'asc' },
    });

    if (orders.length === 0) return;

    // Group orders by Kyiv date
    const ordersByDay = new Map<string, any[]>();
    for (const order of orders) {
      const kyivDate = toKyivDate(order.createdAt);
      if (!ordersByDay.has(kyivDate)) ordersByDay.set(kyivDate, []);
      ordersByDay.get(kyivDate)!.push(order);
    }

    const todayKyiv = toKyivDate(new Date().toISOString());
    let created = 0;

    for (const [kyivDate, dayOrders] of ordersByDay) {
      // Never auto-create for the current Kyiv day
      if (kyivDate >= todayKyiv) continue;

      const dayStart = kyivDayStartUTC(kyivDate);
      const dayEnd = kyivDayEndUTC(kyivDate);

      // Check if any shift was opened on this Kyiv day
      const existing = await shiftQuery.count({
        where: { openedAt: { $gte: dayStart, $lte: dayEnd } },
      });
      if (existing > 0) continue;

      // Calculate totals from completed orders
      const completed = dayOrders.filter((o: any) => o.status !== 'cancelled');
      const totalSales = completed.reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0);
      const cashSales = completed
        .filter((o: any) => o.payment?.method === 'cash')
        .reduce((s: number, o: any) => s + (parseFloat(o.total) || 0), 0);
      const cardSales = totalSales - cashSales;

      await shiftQuery.create({
        data: {
          openedAt: dayStart,
          closedAt: dayEnd,
          openedBy: 'Автозміна',
          closedBy: 'Автозміна',
          openingCash: 0,
          closingCash: 0,
          status: 'closed',
          totalSales,
          cashSales,
          cardSales,
          ordersCount: completed.length,
          writeOffsTotal: 0,
          suppliesTotal: 0,
        },
      });
      created++;
    }

    if (created > 0) {
      strapi.log.info(`[bootstrap] ensureDailyShifts: created ${created} auto-shift(s) for past days`);
    }
  } catch (error) {
    strapi.log.error('[bootstrap] ensureDailyShifts failed:');
    console.error(error);
  }
}

/**
 * Ensure all content type permissions are set for the Authenticated role.
 * Runs on every bootstrap to auto-configure new content types.
 */
async function ensurePermissions(strapi: Core.Strapi) {
  try {
    const roleQuery = strapi.db.query('plugin::users-permissions.role');
    const permQuery = strapi.db.query('plugin::users-permissions.permission');

    const authenticatedRole = await roleQuery.findOne({
      where: { type: 'authenticated' },
      populate: { permissions: true },
    });

    if (!authenticatedRole) return;

    const existingActions = new Set(
      ((authenticatedRole as any).permissions || []).map((p: any) => p.action)
    );

    // All content types that need full CRUD for authenticated users
    const contentTypes = [
      'api::employee.employee',
      'api::cafe-table.cafe-table',
      'api::write-off.write-off',
      'api::category.category',
      'api::product.product',
      'api::ingredient.ingredient',
      'api::ingredient-category.ingredient-category',
      'api::recipe.recipe',
      'api::order.order',
      'api::order-item.order-item',
      'api::payment.payment',
      'api::shift.shift',
      'api::supply.supply',
      'api::task.task',
      'api::modifier-group.modifier-group',
      'api::modifier.modifier',
      'api::cafe.cafe',
      'api::inventory-transaction.inventory-transaction',
      'api::report.report',
    ];

    const actions = ['find', 'findOne', 'create', 'update', 'delete'];
    let created = 0;

    for (const ct of contentTypes) {
      for (const action of actions) {
        const fullAction = `${ct}.${action}`;
        if (!existingActions.has(fullAction)) {
          await permQuery.create({
            data: {
              action: fullAction,
              role: authenticatedRole.id,
            },
          });
          created++;
        }
      }
    }

    // Also ensure custom route permissions
    const customActions = [
      'api::order.order.create',
      'api::shift.shift.current',
      'api::shift.shift.open',
      'api::shift.shift.close',
      'api::task.task.complete',
      'api::supply.supply.receive',
      'api::report.report.daily',
      'api::report.report.monthly',
      'api::report.report.xReport',
      'api::report.report.zReport',
      'api::report.report.productReport',
      'api::ingredient.ingredient.lowStock',
      'api::employee.employee.stats',
      'api::employee.employee.performance',
    ];

    for (const action of customActions) {
      if (!existingActions.has(action)) {
        await permQuery.create({
          data: {
            action,
            role: authenticatedRole.id,
          },
        });
        created++;
      }
    }

    if (created > 0) {
      strapi.log.info(`Permissions: granted ${created} new permissions to Authenticated role`);
    }
  } catch (error) {
    strapi.log.error('Failed to ensure permissions:');
    console.error(error);
  }
}
