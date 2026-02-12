/**
 * ParadisePOS - Database Seeder
 *
 * Run with: npm run seed
 */

import { categories, modifierGroups, modifiers, products, ingredientCategories, ingredients, recipes, cafeTables } from './data';

interface StrapiContext {
  strapi: {
    db: {
      query: (uid: string) => {
        findMany: (params?: object) => Promise<any[]>;
        findOne: (params?: object) => Promise<any>;
        create: (params: { data: object }) => Promise<any>;
        delete: (params: { where: object }) => Promise<any>;
        deleteMany: (params: { where: object }) => Promise<any>;
      };
    };
    log: {
      info: (message: string) => void;
      error: (message: string) => void;
    };
  };
}

export default async function seed({ strapi }: StrapiContext) {
  strapi.log.info('🌱 Starting database seed...');

  try {
    // Clear existing data (in reverse dependency order)
    strapi.log.info('Clearing existing data...');
    await strapi.db.query('api::inventory-transaction.inventory-transaction').deleteMany({ where: {} });
    await strapi.db.query('api::write-off.write-off').deleteMany({ where: {} });
    await strapi.db.query('api::supply.supply').deleteMany({ where: {} });
    await strapi.db.query('api::recipe.recipe').deleteMany({ where: {} });
    await strapi.db.query('api::order-item.order-item').deleteMany({ where: {} });
    await strapi.db.query('api::payment.payment').deleteMany({ where: {} });
    await strapi.db.query('api::order.order').deleteMany({ where: {} });
    await strapi.db.query('api::shift.shift').deleteMany({ where: {} });
    await strapi.db.query('api::modifier.modifier').deleteMany({ where: {} });
    await strapi.db.query('api::modifier-group.modifier-group').deleteMany({ where: {} });
    await strapi.db.query('api::product.product').deleteMany({ where: {} });
    await strapi.db.query('api::ingredient.ingredient').deleteMany({ where: {} });
    await strapi.db.query('api::ingredient-category.ingredient-category').deleteMany({ where: {} });
    await strapi.db.query('api::cafe-table.cafe-table').deleteMany({ where: {} });
    await strapi.db.query('api::category.category').deleteMany({ where: {} });

    // Seed cafe tables
    strapi.log.info('Seeding cafe tables...');
    for (const table of cafeTables) {
      await strapi.db.query('api::cafe-table.cafe-table').create({ data: table });
      strapi.log.info(`  ✓ Created table #${table.number}`);
    }

    // Seed categories
    strapi.log.info('Seeding categories...');
    const categoryMap: Record<string, number> = {};

    for (const category of categories) {
      const created = await strapi.db.query('api::category.category').create({
        data: category,
      });
      categoryMap[category.slug] = created.id;
      strapi.log.info(`  ✓ Created category: ${category.name}`);
    }

    // Seed modifier groups
    strapi.log.info('Seeding modifier groups...');
    const modifierGroupMap: Record<string, number> = {};

    for (const group of modifierGroups) {
      const created = await strapi.db.query('api::modifier-group.modifier-group').create({
        data: group,
      });
      modifierGroupMap[group.name] = created.id;
      strapi.log.info(`  ✓ Created modifier group: ${group.displayName}`);
    }

    // Seed modifiers
    strapi.log.info('Seeding modifiers...');
    for (const [groupName, groupModifiers] of Object.entries(modifiers)) {
      const groupId = modifierGroupMap[groupName];
      if (!groupId) continue;

      for (const modifier of groupModifiers) {
        await strapi.db.query('api::modifier.modifier').create({
          data: {
            ...modifier,
            modifierGroup: groupId,
            isActive: true,
          },
        });
        strapi.log.info(`  ✓ Created modifier: ${modifier.displayName}`);
      }
    }

    // Seed ingredient categories
    strapi.log.info('Seeding ingredient categories...');
    const ingredientCategoryMap: Record<string, number> = {};

    for (const ic of ingredientCategories) {
      const created = await strapi.db.query('api::ingredient-category.ingredient-category').create({
        data: ic,
      });
      ingredientCategoryMap[ic.slug] = created.id;
      strapi.log.info(`  ✓ Created ingredient category: ${ic.name}`);
    }

    // Seed ingredients
    strapi.log.info('Seeding ingredients...');
    const ingredientMap: Record<string, number> = {};

    for (const ing of ingredients) {
      const { categorySlug, ...ingredientData } = ing;
      const categoryId = ingredientCategoryMap[categorySlug];

      const created = await strapi.db.query('api::ingredient.ingredient').create({
        data: {
          ...ingredientData,
          category: categoryId || undefined,
        },
      });
      ingredientMap[ing.slug] = created.id;
      strapi.log.info(`  ✓ Created ingredient: ${ing.name}`);
    }

    // Seed products
    strapi.log.info('Seeding products...');
    const productMap: Record<string, number> = {};

    for (const product of products) {
      const { categorySlug, hasModifiers, ...productData } = product;
      const categoryId = categoryMap[categorySlug];

      const modifierGroupIds = hasModifiers
        ? [modifierGroupMap['size'], modifierGroupMap['milk'], modifierGroupMap['extras']].filter(Boolean)
        : [];

      const created = await strapi.db.query('api::product.product').create({
        data: {
          ...productData,
          category: categoryId,
          modifierGroups: modifierGroupIds,
          trackInventory: productData.trackInventory || false,
          stockQuantity: productData.stockQuantity || 0,
          lowStockThreshold: productData.lowStockThreshold || 5,
          publishedAt: new Date(),
        },
      });
      productMap[product.slug] = created.id;
      strapi.log.info(`  ✓ Created product: ${product.name}`);
    }

    // Seed recipes
    strapi.log.info('Seeding recipes...');
    let recipeCount = 0;

    for (const recipe of recipes) {
      const productId = productMap[recipe.productSlug];
      if (!productId) {
        strapi.log.error(`  ✗ Product not found for recipe: ${recipe.productSlug}`);
        continue;
      }

      // Convert ingredient slugs to IDs
      const recipeIngredients = recipe.ingredients.map((ri) => ({
        ingredientId: ingredientMap[ri.ingredientSlug] || 0,
        amount: ri.amount,
      })).filter((ri) => ri.ingredientId > 0);

      await strapi.db.query('api::recipe.recipe').create({
        data: {
          product: productId,
          sizeId: recipe.sizeId,
          sizeName: recipe.sizeName,
          sizeVolume: recipe.sizeVolume || null,
          price: recipe.price,
          costPrice: recipe.costPrice,
          isDefault: recipe.isDefault,
          ingredients: recipeIngredients,
        },
      });
      recipeCount++;
    }
    strapi.log.info(`  ✓ Created ${recipeCount} recipes`);

    strapi.log.info('✅ Database seed completed successfully!');
    strapi.log.info(`   - ${categories.length} categories`);
    strapi.log.info(`   - ${modifierGroups.length} modifier groups`);
    strapi.log.info(`   - ${Object.values(modifiers).flat().length} modifiers`);
    strapi.log.info(`   - ${ingredientCategories.length} ingredient categories`);
    strapi.log.info(`   - ${ingredients.length} ingredients`);
    strapi.log.info(`   - ${products.length} products`);
    strapi.log.info(`   - ${recipeCount} recipes`);
    strapi.log.info(`   - ${cafeTables.length} cafe tables`);

  } catch (error) {
    strapi.log.error('❌ Seed failed:');
    console.error(error);
    throw error;
  }
}
