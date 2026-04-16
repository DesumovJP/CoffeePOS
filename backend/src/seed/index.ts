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

    // Build supplier name → id map for ingredient linking
    const supplierNameMap: Record<string, number> = {};

    for (const ing of ingredients) {
      const { categorySlug, supplierNames, ...ingredientData } = ing;
      const categoryId = ingredientCategoryMap[categorySlug];

      const created = await strapi.db.query('api::ingredient.ingredient').create({
        data: {
          ...ingredientData,
          category: categoryId || undefined,
        },
      });
      ingredientMap[ing.slug] = created.id;

      // Link ingredient to suppliers via manyToMany
      if (supplierNames && supplierNames.length > 0) {
        const supplierIds: number[] = [];
        for (const sName of supplierNames) {
          if (!supplierNameMap[sName]) {
            // Create or find supplier
            let existing = await strapi.db.query('api::supplier.supplier').findOne({ where: { name: sName } });
            if (!existing) {
              existing = await strapi.db.query('api::supplier.supplier').create({
                data: { name: sName, isActive: true, cafe: cafeId },
              });
              strapi.log.info(`  ✓ Created supplier: ${sName}`);
            }
            supplierNameMap[sName] = existing.id;
          }
          supplierIds.push(supplierNameMap[sName]);
        }
        // Connect manyToMany
        await (strapi.db.query('api::ingredient.ingredient') as any).update({
          where: { id: created.id },
          data: { suppliers: { connect: supplierIds.map(id => ({ id })) } },
        });
      }

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

      // Store slug (stable) + numeric id (for display/audit).
      // deductInventory prefers slug so re-seeding never breaks lookups.
      const recipeIngredients = recipe.ingredients
        .filter((ri) => ingredientMap[ri.ingredientSlug])
        .map((ri) => ({
          ingredientSlug: ri.ingredientSlug,
          ingredientId:   ingredientMap[ri.ingredientSlug],
          amount:         ri.amount,
        }));

      await strapi.db.query('api::recipe.recipe').create({
        data: {
          product: productId,
          variantId: recipe.variantId,
          variantName: recipe.variantName,
          variantDescription: recipe.variantDescription || null,
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
    // DEMO OPERATIONAL DATA (14 days)
    // ============================================

    const now = new Date();
    const day = (d: number, h: number, m = 0) => {
      const dt = new Date(now);
      dt.setDate(dt.getDate() + d);
      dt.setHours(h, m, 0, 0);
      return dt.toISOString();
    };

    const baristas = ['Олена Бондаренко', 'Андрій Мельник', 'Софія Ткаченко', 'Дмитро Козлов', 'Вікторія Литвин'];

    // --- Shifts (26 closed over 14 days) ---
    strapi.log.info('Seeding demo shifts (14 days)...');
    const shiftsData: any[] = [];
    for (let d = -14; d <= -1; d++) {
      const morningBarista = baristas[(d + 14) % baristas.length];
      const eveningBarista = baristas[(d + 15) % baristas.length];
      const isWeekend = [0, 6].includes(new Date(now.getTime() + d * 86400000).getDay());
      const mOrders = isWeekend ? 18 + Math.floor(Math.abs(d * 3) % 8) : 12 + Math.floor(Math.abs(d * 7) % 6);
      const eOrders = isWeekend ? 22 + Math.floor(Math.abs(d * 5) % 10) : 15 + Math.floor(Math.abs(d * 3) % 8);
      const mCash = 1200 + mOrders * 85 + (Math.abs(d * 37) % 400);
      const mCard = 800 + mOrders * 65 + (Math.abs(d * 23) % 300);
      const eCash = 1500 + eOrders * 90 + (Math.abs(d * 41) % 500);
      const eCard = 1200 + eOrders * 75 + (Math.abs(d * 19) % 400);
      const mWo = d % 3 === 0 ? 45 + (Math.abs(d * 13) % 80) : 0;
      const eWo = d % 4 === 0 ? 60 + (Math.abs(d * 11) % 100) : 0;

      shiftsData.push({
        openedAt: day(d, isWeekend ? 9 : 8), closedAt: day(d, 16),
        openedBy: morningBarista, closedBy: morningBarista,
        openingCash: 500, closingCash: 500 + mCash, status: 'closed',
        cashSales: mCash, cardSales: mCard, totalSales: mCash + mCard,
        ordersCount: mOrders, writeOffsTotal: mWo, suppliesTotal: 0,
      });
      shiftsData.push({
        openedAt: day(d, 16), closedAt: day(d, isWeekend ? 23 : 22),
        openedBy: eveningBarista, closedBy: eveningBarista,
        openingCash: 500 + mCash, closingCash: 500 + mCash + eCash, status: 'closed',
        cashSales: eCash, cardSales: eCard, totalSales: eCash + eCard,
        ordersCount: eOrders, writeOffsTotal: eWo, suppliesTotal: 0,
      });
    }

    const shiftIds: number[] = [];
    for (const s of shiftsData) {
      const created = await strapi.db.query('api::shift.shift').create({ data: { ...s, cafe: cafeId } });
      shiftIds.push(created.id);
    }
    strapi.log.info(`  ✓ Created ${shiftIds.length} demo shifts`);

    // --- Orders (72 completed across last 14 days) ---
    strapi.log.info('Seeding demo orders...');

    // Menu items pool for order generation
    const menu = [
      { slug: 'espresso', name: 'Еспресо', price: 45 },
      { slug: 'doppio', name: 'Допіо', price: 65 },
      { slug: 'americano', name: 'Американо', price: 55 },
      { slug: 'cappuccino', name: 'Капучіно', price: 75 },
      { slug: 'latte', name: 'Латте', price: 85 },
      { slug: 'flat-white', name: 'Флет Вайт', price: 75 },
      { slug: 'raf', name: 'Раф', price: 100 },
      { slug: 'mocha', name: 'Мокко', price: 80 },
      { slug: 'iced-latte', name: 'Айс Латте', price: 75 },
      { slug: 'lavender-latte', name: 'Лавандовий Латте', price: 95 },
      { slug: 'bumble', name: 'Бамбл', price: 90 },
      { slug: 'caramel-macchiato', name: 'Карамель Макіато', price: 95 },
      { slug: 'black-tea', name: 'Чорний чай', price: 40 },
      { slug: 'matcha-latte', name: 'Матча Латте', price: 85 },
      { slug: 'chai-latte', name: 'Чай Латте', price: 80 },
      { slug: 'cheesecake', name: 'Чізкейк', price: 95 },
      { slug: 'tiramisu', name: 'Тірамісу', price: 110 },
      { slug: 'brownie', name: 'Брауні', price: 75 },
      { slug: 'medovik', name: 'Медовик', price: 90 },
      { slug: 'croissant', name: 'Круасан', price: 55 },
      { slug: 'chocolate-croissant', name: 'Круасан з шоколадом', price: 65 },
      { slug: 'muffin', name: 'Маффін', price: 45 },
      { slug: 'cinnamon-roll', name: 'Булочка з корицею', price: 55 },
      { slug: 'bagel', name: 'Бейгл з вершковим сиром', price: 75 },
      { slug: 'chicken-sandwich', name: 'Сендвіч з куркою', price: 120 },
      { slug: 'salmon-sandwich', name: 'Сендвіч з лососем', price: 145 },
      { slug: 'caesar-salad', name: 'Салат Цезар', price: 135 },
      { slug: 'avocado-toast', name: 'Тост з авокадо', price: 125 },
      { slug: 'granola-bowl', name: 'Гранола боул', price: 95 },
      { slug: 'syrnyky', name: 'Сирники', price: 110 },
      { slug: 'lemonade', name: 'Лимонад', price: 55 },
      { slug: 'orange-fresh', name: 'Фреш апельсин', price: 75 },
      { slug: 'berry-smoothie', name: 'Смузі ягідний', price: 85 },
      { slug: 'virgin-mojito', name: 'Мохіто безалк.', price: 65 },
      { slug: 'chicken-shawarma', name: 'Шаурма з куркою', price: 135 },
      { slug: 'beef-shawarma', name: 'Шаурма з яловичиною', price: 155 },
      { slug: 'doner-kebab', name: 'Донер кебаб', price: 165 },
      { slug: 'falafel-pita', name: 'Фалафель у піті', price: 125 },
      { slug: 'chicken-taco', name: 'Тако з куркою', price: 120 },
      { slug: 'beef-taco', name: 'Тако з яловичиною', price: 130 },
      { slug: 'chicken-burrito', name: 'Буріто з куркою', price: 155 },
      { slug: 'vanilla-ice-cream', name: 'Морозиво ванільне', price: 65 },
      { slug: 'pistachio-ice-cream', name: 'Морозиво фісташкове', price: 80 },
      { slug: 'affogato', name: 'Афогато', price: 95 },
      { slug: 'pepsi-500', name: 'Pepsi 0.5л', price: 45 },
      { slug: '7up-500', name: '7UP 0.5л', price: 45 },
      { slug: 'mineral-water', name: 'Вода 0.5л', price: 30 },
    ];

    // Generate 72 orders across all shifts
    const types = ['dine_in', 'dine_in', 'dine_in', 'takeaway', 'takeaway'] as const;
    const methods = ['cash', 'cash', 'card', 'card', 'card', 'qr'] as const;
    let orderCount = 0;

    for (let si = 0; si < shiftIds.length; si++) {
      const isEvening = si % 2 === 1;
      const ordersInShift = isEvening ? 3 : 2; // ~2-3 orders per shift seeded as examples

      for (let oi = 0; oi < ordersInShift; oi++) {
        const shiftDay = Math.floor(si / 2);
        const h = isEvening ? 17 + oi * 2 : 8 + oi * 2;
        const m = 10 + (si * 7 + oi * 13) % 50;

        // Pick 2-4 items from menu
        const numItems = 2 + ((si + oi) % 3);
        const orderItems: { pid: number | undefined; name: string; qty: number; price: number }[] = [];
        for (let ii = 0; ii < numItems; ii++) {
          const mi = (si * 5 + oi * 7 + ii * 11) % menu.length;
          const item = menu[mi];
          const qty = ii === 0 ? 1 + ((si + oi) % 2) : 1;
          orderItems.push({ pid: productMap[item.slug], name: item.name, qty, price: item.price });
        }

        const subtotal = orderItems.reduce((s, i) => s + i.qty * i.price, 0);
        const method = methods[(si + oi) % methods.length];
        const orderType = types[(si + oi) % types.length];
        const orderNum = `P-${1001 + orderCount}`;
        const orderTime = day(-14 + shiftDay, h, m);

        const order = await strapi.db.query('api::order.order').create({
          data: {
            orderNumber: orderNum, status: 'completed', type: orderType,
            subtotal, discountAmount: 0, total: subtotal, completedAt: orderTime,
            shift: shiftIds[si], cafe: cafeId,
          },
        });

        for (const item of orderItems) {
          await strapi.db.query('api::order-item.order-item').create({
            data: {
              order: order.id, product: item.pid || undefined,
              productName: item.name, quantity: item.qty,
              unitPrice: item.price, totalPrice: item.qty * item.price, status: 'served',
            },
          });
        }

        const received = method === 'cash' ? Math.ceil(subtotal / 50) * 50 : subtotal;
        await strapi.db.query('api::payment.payment').create({
          data: {
            order: order.id, method, status: 'completed', amount: subtotal,
            receivedAmount: received, changeAmount: Math.max(0, received - subtotal),
            processedAt: orderTime,
          },
        });
        orderCount++;
      }
    }
    strapi.log.info(`  ✓ Created ${orderCount} demo orders with items & payments`);

    // --- Supplies (12) ---
    strapi.log.info('Seeding demo supplies...');
    const suppliesData = [
      { supplierName: 'Кава Україна', status: 'received', items: [{ ingredientName: 'Арабіка Ефіопія 1кг', quantity: 5, unitCost: 480, totalCost: 2400 }, { ingredientName: 'Декаф 0.5кг', quantity: 2, unitCost: 520, totalCost: 1040 }], totalCost: 3440, orderedAt: day(-14, 10), shippedAt: day(-13, 9), receivedAt: day(-13, 16), createdBy_barista: 'Марія Коваленко', receivedBy: 'Олена Бондаренко' },
      { supplierName: 'Молочна Ферма «Зоря»', status: 'received', items: [{ ingredientName: 'Молоко 2.5% 10л', quantity: 3, unitCost: 145, totalCost: 435 }, { ingredientName: 'Вершки 33% 1л', quantity: 6, unitCost: 98, totalCost: 588 }, { ingredientName: 'Безлактозне 1л', quantity: 4, unitCost: 62, totalCost: 248 }], totalCost: 1271, orderedAt: day(-13, 9), shippedAt: day(-12, 7), receivedAt: day(-12, 8, 30), createdBy_barista: 'Олена Бондаренко', receivedBy: 'Андрій Мельник' },
      { supplierName: 'Alpro', status: 'received', items: [{ ingredientName: 'Молоко вівсяне 1л', quantity: 8, unitCost: 75, totalCost: 600 }, { ingredientName: 'Молоко мигдальне 1л', quantity: 4, unitCost: 89, totalCost: 356 }, { ingredientName: 'Молоко кокосове 1л', quantity: 4, unitCost: 95, totalCost: 380 }], totalCost: 1336, orderedAt: day(-12, 11), shippedAt: day(-11, 10), receivedAt: day(-10, 9), createdBy_barista: 'Марія Коваленко', receivedBy: 'Софія Ткаченко' },
      { supplierName: 'Пекарня «Добра»', status: 'received', items: [{ ingredientName: 'Круасан масляний (10шт)', quantity: 4, unitCost: 180, totalCost: 720 }, { ingredientName: 'Круасан шоколадний (10шт)', quantity: 3, unitCost: 210, totalCost: 630 }, { ingredientName: 'Маффін шоколадний (6шт)', quantity: 3, unitCost: 150, totalCost: 450 }, { ingredientName: 'Булочка з корицею (6шт)', quantity: 2, unitCost: 140, totalCost: 280 }], totalCost: 2080, orderedAt: day(-11, 14), shippedAt: day(-10, 6), receivedAt: day(-10, 8), createdBy_barista: 'Андрій Мельник', receivedBy: 'Андрій Мельник' },
      { supplierName: 'Monin', status: 'received', items: [{ ingredientName: 'Сироп ваніль 0.7л', quantity: 3, unitCost: 285, totalCost: 855 }, { ingredientName: 'Сироп карамель 0.7л', quantity: 3, unitCost: 285, totalCost: 855 }, { ingredientName: 'Сироп лаванда 0.7л', quantity: 2, unitCost: 310, totalCost: 620 }, { ingredientName: 'Соус карамельний 0.5л', quantity: 2, unitCost: 245, totalCost: 490 }], totalCost: 2820, orderedAt: day(-10, 10), shippedAt: day(-8, 12), receivedAt: day(-8, 17), createdBy_barista: 'Марія Коваленко', receivedBy: 'Дмитро Козлов' },
      { supplierName: 'Фреш Маркет', status: 'received', items: [{ ingredientName: 'Апельсин 1кг', quantity: 8, unitCost: 58, totalCost: 464 }, { ingredientName: 'Банан 1кг', quantity: 5, unitCost: 42, totalCost: 210 }, { ingredientName: 'Мікс ягід заморож. 0.5кг', quantity: 6, unitCost: 125, totalCost: 750 }], totalCost: 1424, orderedAt: day(-9, 8), shippedAt: day(-8, 7), receivedAt: day(-8, 8, 15), createdBy_barista: 'Олена Бондаренко', receivedBy: 'Олена Бондаренко' },
      { supplierName: 'Callebaut', status: 'received', items: [{ ingredientName: 'Шоколад темний 1кг', quantity: 2, unitCost: 420, totalCost: 840 }, { ingredientName: 'Шоколад білий 0.5кг', quantity: 2, unitCost: 380, totalCost: 760 }], totalCost: 1600, orderedAt: day(-7, 10), shippedAt: day(-5, 11), receivedAt: day(-5, 16), createdBy_barista: 'Марія Коваленко', receivedBy: 'Вікторія Литвин' },
      { supplierName: 'Пакувальник', status: 'received', items: [{ ingredientName: 'Стакан 250мл (100шт)', quantity: 3, unitCost: 250, totalCost: 750 }, { ingredientName: 'Стакан 350мл (100шт)', quantity: 3, unitCost: 300, totalCost: 900 }, { ingredientName: 'Стакан 450мл (100шт)', quantity: 2, unitCost: 350, totalCost: 700 }, { ingredientName: 'Кришка (200шт)', quantity: 3, unitCost: 160, totalCost: 480 }, { ingredientName: 'Трубочка (200шт)', quantity: 2, unitCost: 100, totalCost: 200 }], totalCost: 3030, orderedAt: day(-6, 9), shippedAt: day(-4, 8), receivedAt: day(-4, 9, 30), createdBy_barista: 'Софія Ткаченко', receivedBy: 'Андрій Мельник' },
      { supplierName: 'Кава Україна', status: 'received', items: [{ ingredientName: 'Арабіка Колумбія 1кг', quantity: 4, unitCost: 510, totalCost: 2040 }], totalCost: 2040, orderedAt: day(-5, 10), shippedAt: day(-3, 11), receivedAt: day(-3, 16), createdBy_barista: 'Марія Коваленко', receivedBy: 'Олена Бондаренко' },
      { supplierName: 'Молочна Ферма «Зоря»', status: 'received', items: [{ ingredientName: 'Молоко 2.5% 10л', quantity: 2, unitCost: 145, totalCost: 290 }, { ingredientName: 'Вершки 33% 1л', quantity: 4, unitCost: 98, totalCost: 392 }], totalCost: 682, orderedAt: day(-3, 8), shippedAt: day(-2, 7), receivedAt: day(-2, 8, 20), createdBy_barista: 'Андрій Мельник', receivedBy: 'Дмитро Козлов' },
      { supplierName: 'Пекарня «Добра»', status: 'shipped', items: [{ ingredientName: 'Круасан масляний (10шт)', quantity: 3, unitCost: 180, totalCost: 540 }, { ingredientName: 'Круасан шоколадний (10шт)', quantity: 3, unitCost: 210, totalCost: 630 }, { ingredientName: 'Бейгл (10шт)', quantity: 2, unitCost: 200, totalCost: 400 }], totalCost: 1570, orderedAt: day(-1, 11), shippedAt: day(0, 6), createdBy_barista: 'Софія Ткаченко' },
      { supplierName: 'Фреш Маркет', status: 'ordered', items: [{ ingredientName: 'Апельсин 1кг', quantity: 10, unitCost: 58, totalCost: 580 }, { ingredientName: 'Лимон 1кг', quantity: 3, unitCost: 65, totalCost: 195 }, { ingredientName: "М'ята свіжа (пучок)", quantity: 10, unitCost: 25, totalCost: 250 }], totalCost: 1025, orderedAt: day(0, 9), createdBy_barista: 'Олена Бондаренко' },
      { supplierName: "М'ясний Двір", status: 'received', items: [{ ingredientName: 'Куряче філе 1кг', quantity: 5, unitCost: 180, totalCost: 900 }, { ingredientName: 'Яловичина (фарш) 1кг', quantity: 3, unitCost: 280, totalCost: 840 }, { ingredientName: 'Баранина для донера 1кг', quantity: 2, unitCost: 350, totalCost: 700 }], totalCost: 2440, orderedAt: day(-4, 8), shippedAt: day(-3, 7), receivedAt: day(-3, 8, 30), createdBy_barista: 'Марія Коваленко', receivedBy: 'Андрій Мельник' },
      { supplierName: 'PepsiCo Україна', status: 'received', items: [{ ingredientName: 'Pepsi 0.5л (уп. 24шт)', quantity: 2, unitCost: 528, totalCost: 1056 }, { ingredientName: 'Pepsi Max 0.5л (уп. 24шт)', quantity: 1, unitCost: 528, totalCost: 528 }, { ingredientName: '7UP 0.5л (уп. 24шт)', quantity: 1, unitCost: 528, totalCost: 528 }, { ingredientName: 'Lipton Ice Tea 0.5л (уп. 24шт)', quantity: 1, unitCost: 480, totalCost: 480 }], totalCost: 2592, orderedAt: day(-5, 10), shippedAt: day(-4, 9), receivedAt: day(-4, 10), createdBy_barista: 'Софія Ткаченко', receivedBy: 'Дмитро Козлов' },
    ];

    for (const sup of suppliesData) {
      await strapi.db.query('api::supply.supply').create({ data: { ...sup, cafe: cafeId } });
    }
    strapi.log.info(`  ✓ Created ${suppliesData.length} demo supplies`);

    // --- Write-offs (8) ---
    strapi.log.info('Seeding demo write-offs...');
    const writeoffsData = [
      { type: 'expired', items: [{ name: 'Молоко 2.5%', quantity: 1.5, unit: 'л', costPerUnit: 32, totalCost: 48 }, { name: 'Вершки 33%', quantity: 0.3, unit: 'л', costPerUnit: 120, totalCost: 36 }], totalCost: 84, reason: 'Закінчився термін придатності', performedBy: 'Олена Бондаренко', shift: shiftIds[0] },
      { type: 'other', items: [{ name: 'Круасан масляний', quantity: 4, unit: 'шт', costPerUnit: 18, totalCost: 72 }, { name: 'Маффін', quantity: 2, unit: 'шт', costPerUnit: 25, totalCost: 50 }], totalCost: 122, reason: 'Залишки з вітрини (кінець дня)', performedBy: 'Андрій Мельник', shift: shiftIds[3] },
      { type: 'damaged', items: [{ name: 'Стакан 350мл', quantity: 20, unit: 'шт', costPerUnit: 3, totalCost: 60 }, { name: 'Кришка', quantity: 20, unit: 'шт', costPerUnit: 0.8, totalCost: 16 }], totalCost: 76, reason: 'Пом\'ята коробка при доставці', performedBy: 'Софія Ткаченко', shift: shiftIds[6] },
      { type: 'expired', items: [{ name: 'Молоко вівсяне', quantity: 1, unit: 'л', costPerUnit: 80, totalCost: 80 }, { name: 'Молоко мигдальне', quantity: 0.5, unit: 'л', costPerUnit: 100, totalCost: 50 }], totalCost: 130, reason: 'Прострочено — перевірка запасів', performedBy: 'Дмитро Козлов', shift: shiftIds[10] },
      { type: 'other', items: [{ name: 'Булочка з корицею', quantity: 3, unit: 'шт', costPerUnit: 16, totalCost: 48 }, { name: 'Круасан з шоколадом', quantity: 2, unit: 'шт', costPerUnit: 22, totalCost: 44 }, { name: 'Бейгл', quantity: 1, unit: 'шт', costPerUnit: 28, totalCost: 28 }], totalCost: 120, reason: 'Непродана випічка за день', performedBy: 'Вікторія Литвин', shift: shiftIds[15] },
      { type: 'damaged', items: [{ name: 'Сироп ваніль', quantity: 1, unit: 'пляшка', costPerUnit: 285, totalCost: 285 }], totalCost: 285, reason: 'Розбита пляшка при переміщенні', performedBy: 'Андрій Мельник', shift: shiftIds[18] },
      { type: 'expired', items: [{ name: 'Молоко 2.5%', quantity: 2, unit: 'л', costPerUnit: 32, totalCost: 64 }, { name: 'Вершки 33%', quantity: 0.5, unit: 'л', costPerUnit: 120, totalCost: 60 }], totalCost: 124, reason: 'Протерміноване (понеділкова інвентаризація)', performedBy: 'Олена Бондаренко', shift: shiftIds[22] },
      { type: 'other', items: [{ name: 'Круасан масляний', quantity: 5, unit: 'шт', costPerUnit: 18, totalCost: 90 }, { name: 'Маффін', quantity: 3, unit: 'шт', costPerUnit: 25, totalCost: 75 }], totalCost: 165, reason: 'Вечірні залишки вітрини', performedBy: 'Софія Ткаченко', shift: shiftIds[25] },
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
