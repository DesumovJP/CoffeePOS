import type { Core } from '@strapi/strapi';
import seed from './seed';
import { seedUsers } from './seed';

export default {
  /**
   * An asynchronous register function that runs before
   * your application is initialized.
   *
   * This gives you an opportunity to extend code.
   */
  register(/* { strapi }: { strapi: Core.Strapi } */) {},

  /**
   * An asynchronous bootstrap function that runs before
   * your application gets started.
   *
   * This gives you an opportunity to set up your data model,
   * run jobs, or perform some special logic.
   */
  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    // Check if we should seed the database
    const shouldSeed = process.env.SEED_DATABASE === 'true';

    if (shouldSeed) {
      // Check if database is empty
      const categoriesCount = await strapi.db.query('api::category.category').count();

      if (categoriesCount === 0) {
        strapi.log.info('Database is empty, running seed...');
        await seed({ strapi } as any);
        await seedUsers({ strapi });
      } else {
        strapi.log.info(`Database already has ${categoriesCount} categories, skipping seed.`);
        // Still seed users even if data exists (they check for duplicates)
        await seedUsers({ strapi });
      }
    }
  },
};
