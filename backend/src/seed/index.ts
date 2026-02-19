/**
 * CoffeePOS - Database Seeder
 *
 * Run with: npm run seed
 */

import { cafes, categories, modifierGroups, modifiers, products, ingredientCategories, ingredients, recipes, cafeTables, employees } from './data';

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
    await strapi.db.query('api::employee.employee').deleteMany({ where: {} });
    await strapi.db.query('api::cafe-table.cafe-table').deleteMany({ where: {} });
    await strapi.db.query('api::category.category').deleteMany({ where: {} });
    await strapi.db.query('api::cafe.cafe').deleteMany({ where: {} });

    // Seed cafes
    strapi.log.info('Seeding cafes...');
    const cafeMap: Record<string, number> = {};

    for (const cafe of cafes) {
      const created = await strapi.db.query('api::cafe.cafe').create({ data: cafe });
      cafeMap[cafe.name] = created.id;
      strapi.log.info(`  ✓ Created cafe: ${cafe.name}`);
    }

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

    // Seed employees
    strapi.log.info('Seeding employees...');
    await strapi.db.query('api::employee.employee').deleteMany({ where: {} });
    const cafeId = Object.values(cafeMap)[0];
    for (const emp of employees) {
      await strapi.db.query('api::employee.employee').create({
        data: { ...emp, cafe: cafeId },
      });
      strapi.log.info(`  ✓ Created employee: ${emp.name} (${emp.role})`);
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

      // Build modifier groups connect array for manyToMany
      const modifierGroupConnect = hasModifiers
        ? [modifierGroupMap['size'], modifierGroupMap['milk'], modifierGroupMap['extras']]
            .filter(Boolean)
            .map((id) => ({ id }))
        : [];

      const created = await strapi.db.query('api::product.product').create({
        data: {
          ...productData,
          category: categoryId,
          modifierGroups: modifierGroupConnect.length > 0 ? { connect: modifierGroupConnect } : undefined,
          trackInventory: productData.trackInventory || false,
          stockQuantity: productData.stockQuantity || 0,
          lowStockThreshold: productData.lowStockThreshold || 5,
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

    // ============================================
    // DEMO OPERATIONAL DATA
    // ============================================

    const now = new Date();
    const day = (d: number, h: number, m = 0) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + d);
      dt.setHours(h, m, 0, 0);
      return dt.toISOString();
    };

    // --- Shifts (5 closed + reference for orders) ---
    strapi.log.info('Seeding demo shifts...');
    const shiftsData = [
      { openedAt: day(-3, 8), closedAt: day(-3, 16), openedBy: 'Олена Коваленко', closedBy: 'Олена Коваленко', openingCash: 500, closingCash: 2870, status: 'closed' as const, cashSales: 2370, cardSales: 1080, totalSales: 3450, ordersCount: 15, writeOffsTotal: 45, suppliesTotal: 0 },
      { openedAt: day(-3, 16), closedAt: day(-3, 23), openedBy: 'Марія Петренко', closedBy: 'Марія Петренко', openingCash: 2870, closingCash: 6250, status: 'closed' as const, cashSales: 3380, cardSales: 2400, totalSales: 5780, ordersCount: 22, writeOffsTotal: 0, suppliesTotal: 1250 },
      { openedAt: day(-2, 8), closedAt: day(-2, 16), openedBy: 'Андрій Мельник', closedBy: 'Андрій Мельник', openingCash: 500, closingCash: 2650, status: 'closed' as const, cashSales: 2150, cardSales: 1970, totalSales: 4120, ordersCount: 18, writeOffsTotal: 120, suppliesTotal: 0 },
      { openedAt: day(-2, 16), closedAt: day(-2, 23), openedBy: 'Олена Коваленко', closedBy: 'Олена Коваленко', openingCash: 2650, closingCash: 5430, status: 'closed' as const, cashSales: 2780, cardSales: 2450, totalSales: 5230, ordersCount: 20, writeOffsTotal: 0, suppliesTotal: 890 },
      { openedAt: day(-1, 8), closedAt: day(-1, 16), openedBy: 'Софія Бондаренко', closedBy: 'Софія Бондаренко', openingCash: 500, closingCash: 1890, status: 'closed' as const, cashSales: 1390, cardSales: 1500, totalSales: 2890, ordersCount: 12, writeOffsTotal: 65, suppliesTotal: 0 },
    ];

    const shiftIds: number[] = [];
    for (const s of shiftsData) {
      const created = await strapi.db.query('api::shift.shift').create({ data: { ...s, cafe: cafeId } });
      shiftIds.push(created.id);
    }
    strapi.log.info(`  ✓ Created ${shiftIds.length} demo shifts`);

    // --- Orders (12 completed orders across shifts) ---
    strapi.log.info('Seeding demo orders...');
    const espressoId = productMap['espresso'];
    const americanoId = productMap['americano'];
    const cappuccinoId = productMap['cappuccino'];
    const latteId = productMap['latte'];
    const cheesecakeId = productMap['cheesecake'];
    const croissantId = productMap['croissant'];
    const blackTeaId = productMap['black-tea'];
    const lemonadeId = productMap['lemonade'];

    const ordersData = [
      { num: 'P-1001', shift: 0, time: day(-3, 8, 25), items: [{ pid: espressoId, name: 'Еспресо', qty: 2, price: 45 }, { pid: croissantId, name: 'Круасан', qty: 1, price: 55 }], method: 'cash' as const, received: 200 },
      { num: 'P-1002', shift: 0, time: day(-3, 9, 10), items: [{ pid: cappuccinoId, name: 'Капучіно', qty: 1, price: 75 }, { pid: cheesecakeId, name: 'Чізкейк', qty: 1, price: 95 }], method: 'card' as const },
      { num: 'P-1003', shift: 0, time: day(-3, 10, 45), items: [{ pid: latteId, name: 'Латте', qty: 2, price: 85 }], method: 'cash' as const, received: 200 },
      { num: 'P-1004', shift: 1, time: day(-3, 17, 30), items: [{ pid: americanoId, name: 'Американо', qty: 3, price: 55 }, { pid: croissantId, name: 'Круасан', qty: 2, price: 55 }], method: 'card' as const },
      { num: 'P-1005', shift: 1, time: day(-3, 19, 15), items: [{ pid: blackTeaId, name: 'Чорний чай', qty: 2, price: 45 }, { pid: cheesecakeId, name: 'Чізкейк', qty: 1, price: 95 }], method: 'cash' as const, received: 200 },
      { num: 'P-1006', shift: 2, time: day(-2, 8, 40), items: [{ pid: espressoId, name: 'Еспресо', qty: 1, price: 45 }, { pid: americanoId, name: 'Американо', qty: 1, price: 55 }], method: 'cash' as const, received: 100 },
      { num: 'P-1007', shift: 2, time: day(-2, 11, 20), items: [{ pid: cappuccinoId, name: 'Капучіно', qty: 2, price: 75 }, { pid: lemonadeId, name: 'Лимонад', qty: 1, price: 65 }], method: 'card' as const },
      { num: 'P-1008', shift: 3, time: day(-2, 17, 50), items: [{ pid: latteId, name: 'Латте', qty: 1, price: 85 }, { pid: croissantId, name: 'Круасан', qty: 2, price: 55 }], method: 'cash' as const, received: 200 },
      { num: 'P-1009', shift: 3, time: day(-2, 20, 5), items: [{ pid: cappuccinoId, name: 'Капучіно', qty: 1, price: 75 }, { pid: cheesecakeId, name: 'Чізкейк', qty: 2, price: 95 }], method: 'card' as const },
      { num: 'P-1010', shift: 4, time: day(-1, 9, 0), items: [{ pid: espressoId, name: 'Еспресо', qty: 3, price: 45 }], method: 'cash' as const, received: 150 },
      { num: 'P-1011', shift: 4, time: day(-1, 12, 30), items: [{ pid: latteId, name: 'Латте', qty: 2, price: 85 }, { pid: cheesecakeId, name: 'Чізкейк', qty: 1, price: 95 }], method: 'card' as const },
      { num: 'P-1012', shift: 4, time: day(-1, 14, 45), items: [{ pid: americanoId, name: 'Американо', qty: 2, price: 55 }, { pid: croissantId, name: 'Круасан', qty: 1, price: 55 }], method: 'cash' as const, received: 200 },
    ];

    let orderCount = 0;
    for (const o of ordersData) {
      const subtotal = o.items.reduce((s, i) => s + i.qty * i.price, 0);
      const order = await strapi.db.query('api::order.order').create({
        data: {
          orderNumber: o.num,
          status: 'completed',
          type: 'dine_in',
          subtotal,
          discountAmount: 0,
          total: subtotal,
          completedAt: o.time,
          shift: shiftIds[o.shift],
          cafe: cafeId,
        },
      });

      for (const item of o.items) {
        await strapi.db.query('api::order-item.order-item').create({
          data: {
            order: order.id,
            product: item.pid,
            productName: item.name,
            quantity: item.qty,
            unitPrice: item.price,
            totalPrice: item.qty * item.price,
            status: 'served',
          },
        });
      }

      const changeAmount = o.received ? o.received - subtotal : 0;
      await strapi.db.query('api::payment.payment').create({
        data: {
          order: order.id,
          method: o.method,
          status: 'completed',
          amount: subtotal,
          receivedAmount: o.received || subtotal,
          changeAmount: changeAmount > 0 ? changeAmount : 0,
          processedAt: o.time,
        },
      });
      orderCount++;
    }
    strapi.log.info(`  ✓ Created ${orderCount} demo orders with items & payments`);

    // --- Supplies (4) ---
    strapi.log.info('Seeding demo supplies...');
    const suppliesData = [
      {
        supplierName: 'Кава Україна',
        status: 'received' as const,
        items: [
          { name: 'Арабіка Ефіопія 1кг', quantity: 5, unitCost: 480, totalCost: 2400 },
          { name: 'Робуста Уганда 1кг', quantity: 3, unitCost: 320, totalCost: 960 },
        ],
        totalCost: 3360,
        orderedAt: day(-4, 10),
        shippedAt: day(-3, 14),
        receivedAt: day(-3, 17, 30),
        createdBy_barista: 'Марія Петренко',
        receivedBy: 'Марія Петренко',
        shift: shiftIds[1],
      },
      {
        supplierName: 'Молочна Ферма «Зоря»',
        status: 'received' as const,
        items: [
          { name: 'Молоко 2.5% 10л', quantity: 2, unitCost: 145, totalCost: 290 },
          { name: 'Вершки 33% 1л', quantity: 5, unitCost: 98, totalCost: 490 },
          { name: 'Молоко вівсяне 1л', quantity: 4, unitCost: 75, totalCost: 300 },
        ],
        totalCost: 1080,
        orderedAt: day(-3, 9),
        shippedAt: day(-2, 8),
        receivedAt: day(-2, 17, 15),
        createdBy_barista: 'Олена Коваленко',
        receivedBy: 'Олена Коваленко',
        shift: shiftIds[3],
      },
      {
        supplierName: 'Пекарня «Добра»',
        status: 'shipped' as const,
        items: [
          { name: 'Круасан масляний (10шт)', quantity: 3, unitCost: 180, totalCost: 540 },
          { name: 'Маффін шоколадний (6шт)', quantity: 2, unitCost: 150, totalCost: 300 },
        ],
        totalCost: 840,
        orderedAt: day(-1, 11),
        shippedAt: day(0, 7),
        createdBy_barista: 'Андрій Мельник',
      },
      {
        supplierName: 'Фреш Маркет',
        status: 'ordered' as const,
        items: [
          { name: 'Лимон 1кг', quantity: 3, unitCost: 65, totalCost: 195 },
          { name: 'Апельсин 1кг', quantity: 5, unitCost: 58, totalCost: 290 },
          { name: "М'ята свіжа (пучок)", quantity: 10, unitCost: 25, totalCost: 250 },
        ],
        totalCost: 735,
        orderedAt: day(0, 9),
        createdBy_barista: 'Софія Бондаренко',
      },
    ];

    for (const sup of suppliesData) {
      await strapi.db.query('api::supply.supply').create({ data: { ...sup, cafe: cafeId } });
    }
    strapi.log.info(`  ✓ Created ${suppliesData.length} demo supplies`);

    // --- Write-offs (3) ---
    strapi.log.info('Seeding demo write-offs...');
    const writeoffsData = [
      {
        type: 'expired' as const,
        items: [
          { name: 'Молоко 2.5%', quantity: 2, unit: 'л', costPerUnit: 29, totalCost: 58 },
          { name: 'Вершки 33%', quantity: 0.5, unit: 'л', costPerUnit: 98, totalCost: 49 },
        ],
        totalCost: 107,
        reason: 'Закінчився термін придатності (перевірка холодильника)',
        performedBy: 'Олена Коваленко',
        shift: shiftIds[0],
      },
      {
        type: 'damaged' as const,
        items: [
          { name: 'Стакан паперовий 350мл', quantity: 15, unit: 'шт', costPerUnit: 3.5, totalCost: 52.5 },
          { name: 'Кришка для стакану', quantity: 15, unit: 'шт', costPerUnit: 1.2, totalCost: 18 },
        ],
        totalCost: 70.5,
        reason: 'Пошкоджена упаковка при розвантаженні',
        performedBy: 'Андрій Мельник',
        shift: shiftIds[2],
      },
      {
        type: 'other' as const,
        items: [
          { name: 'Круасан масляний', quantity: 3, unit: 'шт', costPerUnit: 18, totalCost: 54 },
          { name: 'Маффін шоколадний', quantity: 2, unit: 'шт', costPerUnit: 25, totalCost: 50 },
        ],
        totalCost: 104,
        reason: 'Залишки з вітрини на кінець дня (не продано)',
        performedBy: 'Софія Бондаренко',
        shift: shiftIds[4],
      },
    ];

    for (const wo of writeoffsData) {
      await strapi.db.query('api::write-off.write-off').create({ data: { ...wo, cafe: cafeId } });
    }
    strapi.log.info(`  ✓ Created ${writeoffsData.length} demo write-offs`);

    // ============================================

    strapi.log.info('✅ Database seed completed successfully!');
    strapi.log.info(`   - ${cafes.length} cafes`);
    strapi.log.info(`   - ${categories.length} categories`);
    strapi.log.info(`   - ${modifierGroups.length} modifier groups`);
    strapi.log.info(`   - ${Object.values(modifiers).flat().length} modifiers`);
    strapi.log.info(`   - ${ingredientCategories.length} ingredient categories`);
    strapi.log.info(`   - ${ingredients.length} ingredients`);
    strapi.log.info(`   - ${products.length} products`);
    strapi.log.info(`   - ${recipeCount} recipes`);
    strapi.log.info(`   - ${cafeTables.length} cafe tables`);
    strapi.log.info(`   - ${employees.length} employees`);
    strapi.log.info(`   - ${shiftIds.length} shifts`);
    strapi.log.info(`   - ${orderCount} orders`);
    strapi.log.info(`   - ${suppliesData.length} supplies`);
    strapi.log.info(`   - ${writeoffsData.length} write-offs`);

  } catch (error) {
    strapi.log.error('❌ Seed failed:');
    console.error(error);
    throw error;
  }
}

const defaultUsers = [
  { username: 'owner', email: 'owner@coffeepos.com', password: 'CoffeePOS2026!' },
  { username: 'manager', email: 'manager@coffeepos.com', password: 'CoffeePOS2026!' },
  { username: 'barista', email: 'barista@coffeepos.com', password: 'CoffeePOS2026!' },
];

export async function seedUsers({ strapi }: { strapi: any }) {
  strapi.log.info('Seeding default users...');

  try {
    // Find the default "Authenticated" role
    const authenticatedRole = await strapi.query('plugin::users-permissions.role').findOne({
      where: { type: 'authenticated' },
    });

    if (!authenticatedRole) {
      strapi.log.error('Authenticated role not found. Users & Permissions plugin may not be initialized yet.');
      return;
    }

    for (const user of defaultUsers) {
      // Check if user already exists
      const existing = await strapi.query('plugin::users-permissions.user').findOne({
        where: { email: user.email },
      });

      if (existing) {
        strapi.log.info(`  User ${user.username} already exists, skipping.`);
        continue;
      }

      await strapi.service('plugin::users-permissions.user').add({
        username: user.username,
        email: user.email,
        password: user.password,
        confirmed: true,
        blocked: false,
        role: authenticatedRole.id,
        provider: 'local',
      });

      strapi.log.info(`  Created user: ${user.username} (${user.email})`);
    }

    strapi.log.info('Users seeded successfully!');
  } catch (error) {
    strapi.log.error('User seed failed:');
    console.error(error);
    throw error;
  }
}
