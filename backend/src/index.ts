import type { Core } from '@strapi/strapi';
import seed from './seed';
import { seedUsers } from './seed';

export default {
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Ensure permissions for all content types
    await ensurePermissions(strapi);

    // Check if we should seed the database
    const shouldSeed = process.env.SEED_DATABASE === 'true';

    if (shouldSeed) {
      const categoriesCount = await strapi.db.query('api::category.category').count();

      if (categoriesCount === 0) {
        strapi.log.info('Database is empty, running seed...');
        await seed({ strapi } as any);
        await seedUsers({ strapi });
      } else {
        strapi.log.info(`Database already has ${categoriesCount} categories, skipping seed.`);
        await seedUsers({ strapi });
      }
    }
  },
};

/**
 * Ensure all content type permissions are set for the Authenticated role.
 * Runs on every bootstrap to auto-configure new content types.
 */
async function ensurePermissions(strapi: Core.Strapi) {
  try {
    const authenticatedRole = await (strapi as any).query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
      populate: ['permissions'],
    });

    if (!authenticatedRole) return;

    const existingActions = new Set(
      (authenticatedRole.permissions || []).map((p: any) => p.action)
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
          await (strapi as any).query('plugin::users-permissions.permission').create({
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
        await (strapi as any).query('plugin::users-permissions.permission').create({
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
