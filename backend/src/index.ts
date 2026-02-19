import type { Core } from '@strapi/strapi';
import seed from './seed';
import { seedUsers } from './seed';
import { employees } from './seed/data';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Ensure permissions for all content types
    await ensurePermissions(strapi);

    // Check if we should seed the database
    const shouldSeed = process.env.SEED_DATABASE === 'true';

    if (shouldSeed) {
      const productsCount = await strapi.db.query('api::product.product').count();

      if (productsCount === 0) {
        strapi.log.info('No products found, running full seed...');
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
