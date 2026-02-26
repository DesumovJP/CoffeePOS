import type { Core } from '@strapi/strapi';
import seed from './seed';
import { seedUsers } from './seed';
import { employees } from './seed/data';

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
