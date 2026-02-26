/**
 * CoffeePOS - Seed Data
 *
 * Realistic production data for a Ukrainian coffee shop
 */

export const cafes = [
  {
    name: 'Paradise Coffee — Центр',
    address: 'вул. Хрещатик, 22, Київ',
    city: 'Київ',
    phone: '+380441234567',
    email: 'center@coffeepos.com',
    workingHours: {
      mon: { open: '08:00', close: '22:00' },
      tue: { open: '08:00', close: '22:00' },
      wed: { open: '08:00', close: '22:00' },
      thu: { open: '08:00', close: '22:00' },
      fri: { open: '08:00', close: '23:00' },
      sat: { open: '09:00', close: '23:00' },
      sun: { open: '09:00', close: '21:00' },
    },
    isActive: true,
  },
];

// ============================================
// CATEGORIES (4)
// ============================================

export const categories = [
  { name: 'Гарячі напої', slug: 'hot',    description: 'Кава, авторські напої та чай', icon: 'coffee',   color: '#C0392B', sortOrder: 1, isActive: true },
  { name: 'Холодні',      slug: 'cold',   description: 'Холодні напої, фреші, смузі',  icon: 'glass',    color: '#2980B9', sortOrder: 2, isActive: true },
  { name: 'Кондитерка',   slug: 'pastry', description: 'Десерти та свіжа випічка',     icon: 'cake',     color: '#E67E22', sortOrder: 3, isActive: true },
  { name: 'Гріль',        slug: 'grill',  description: 'Сендвічі, салати та сніданки', icon: 'utensils', color: '#27AE60', sortOrder: 4, isActive: true },
];

// ============================================
// MODIFIER GROUPS & MODIFIERS
// ============================================

export const modifierGroups = [
  { name: 'size', displayName: 'Розмір', description: 'Оберіть розмір напою', type: 'single' as const, isRequired: true, sortOrder: 1, isActive: true },
  { name: 'milk', displayName: 'Молоко', description: 'Тип молока', type: 'single' as const, isRequired: false, sortOrder: 2, isActive: true },
  { name: 'extras', displayName: 'Додатки', description: 'Додаткові інгредієнти', type: 'multiple' as const, isRequired: false, sortOrder: 3, isActive: true },
];

export const modifiers = {
  size: [
    { name: 'small', displayName: 'S (250мл)', price: 0, sortOrder: 1, isDefault: true },
    { name: 'medium', displayName: 'M (350мл)', price: 15, sortOrder: 2, isDefault: false },
    { name: 'large', displayName: 'L (450мл)', price: 25, sortOrder: 3, isDefault: false },
  ],
  milk: [
    { name: 'regular', displayName: 'Звичайне', price: 0, sortOrder: 1, isDefault: true },
    { name: 'oat', displayName: 'Вівсяне', price: 20, sortOrder: 2, isDefault: false },
    { name: 'almond', displayName: 'Мигдальне', price: 25, sortOrder: 3, isDefault: false },
    { name: 'coconut', displayName: 'Кокосове', price: 25, sortOrder: 4, isDefault: false },
    { name: 'lactose_free', displayName: 'Безлактозне', price: 15, sortOrder: 5, isDefault: false },
  ],
  extras: [
    { name: 'extra_shot', displayName: 'Додатковий шот', price: 20, sortOrder: 1, isDefault: false },
    { name: 'syrup', displayName: 'Сироп', price: 15, sortOrder: 2, isDefault: false },
    { name: 'whipped_cream', displayName: 'Збиті вершки', price: 20, sortOrder: 3, isDefault: false },
    { name: 'cinnamon', displayName: 'Кориця', price: 5, sortOrder: 4, isDefault: false },
    { name: 'marshmallow', displayName: 'Маршмелоу', price: 15, sortOrder: 5, isDefault: false },
  ],
};

// ============================================
// PRODUCTS (46)
// ============================================

export const products = [
  // ---- Кава (10) ----
  { name: 'Еспресо', slug: 'espresso', description: 'Класичний італійський еспресо', shortDescription: 'Класика', price: 45, costPrice: 12, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 1, preparationTime: 2, hasModifiers: true },
  { name: 'Допіо', slug: 'doppio', description: 'Подвійний еспресо для справжніх цінителів', shortDescription: 'Подвійний', price: 65, costPrice: 24, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 2, preparationTime: 2, hasModifiers: false },
  { name: 'Американо', slug: 'americano', description: 'Еспресо з гарячою водою', shortDescription: 'М\'який смак', price: 55, costPrice: 14, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 2, hasModifiers: true },
  { name: 'Капучіно', slug: 'cappuccino', description: 'Еспресо з молочною пінкою', shortDescription: 'Ніжна пінка', price: 65, costPrice: 18, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 4, preparationTime: 3, hasModifiers: true },
  { name: 'Латте', slug: 'latte', description: 'Еспресо з великою кількістю молока', shortDescription: 'Молочний', price: 70, costPrice: 20, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 5, preparationTime: 3, hasModifiers: true },
  { name: 'Флет Вайт', slug: 'flat-white', description: 'Подвійний еспресо з бархатистим молоком', shortDescription: 'Насичений', price: 75, costPrice: 22, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 6, preparationTime: 3, hasModifiers: true },
  { name: 'Кортадо', slug: 'cortado', description: 'Еспресо з невеликою кількістю теплого молока', shortDescription: 'Іспанський', price: 60, costPrice: 16, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 7, preparationTime: 2, hasModifiers: false },
  { name: 'Раф', slug: 'raf', description: 'Кава з вершками та ванільним цукром', shortDescription: 'Вершковий', price: 85, costPrice: 25, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 8, preparationTime: 4, hasModifiers: true },
  { name: 'Мокко', slug: 'mocha', description: 'Кава з шоколадом та молоком', shortDescription: 'Шоколадний', price: 80, costPrice: 24, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 9, preparationTime: 4, hasModifiers: true },
  { name: 'Айс Латте', slug: 'iced-latte', description: 'Холодний латте з льодом', shortDescription: 'Освіжаючий', price: 75, costPrice: 22, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 10, preparationTime: 3, hasModifiers: true },

  // ---- Авторські напої (6) ----
  { name: 'Лавандовий Латте', slug: 'lavender-latte', description: 'Латте з лавандовим сиропом та молочною пінкою', shortDescription: 'Квітковий', price: 95, costPrice: 28, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 1, preparationTime: 4, hasModifiers: true },
  { name: 'Бамбл', slug: 'bumble', description: 'Еспресо з апельсиновим соком та льодом', shortDescription: 'Цитрусовий', price: 90, costPrice: 32, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 2, preparationTime: 3, hasModifiers: false },
  { name: 'Карамель Макіато', slug: 'caramel-macchiato', description: 'Ванільний латте з карамельним соусом', shortDescription: 'Солодкий', price: 95, costPrice: 26, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 3, preparationTime: 4, hasModifiers: true },
  { name: 'Кокосовий Латте', slug: 'coconut-latte', description: 'Латте на кокосовому молоці з кокосовою стружкою', shortDescription: 'Тропічний', price: 90, costPrice: 30, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 4, hasModifiers: false },
  { name: 'Банановий Раф', slug: 'banana-raf', description: 'Раф з банановим пюре та карамеллю', shortDescription: 'Фруктовий', price: 95, costPrice: 30, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 5, preparationTime: 5, hasModifiers: true },
  { name: 'Фредо Еспресо', slug: 'freddo-espresso', description: 'Холодний збитий еспресо з кремовою пінкою', shortDescription: 'Грецький', price: 85, costPrice: 20, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 6, preparationTime: 3, hasModifiers: false },

  // ---- Чай (5) ----
  { name: 'Чорний чай', slug: 'black-tea', description: 'Класичний чорний чай', shortDescription: 'Класика', price: 40, costPrice: 8, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 1, preparationTime: 3, hasModifiers: false },
  { name: 'Зелений чай', slug: 'green-tea', description: 'Зелений чай з жасмином', shortDescription: 'Легкий', price: 45, costPrice: 10, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 2, preparationTime: 3, hasModifiers: false },
  { name: 'Матча Латте', slug: 'matcha-latte', description: 'Японський зелений чай з молоком', shortDescription: 'Японський', price: 85, costPrice: 30, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 3, preparationTime: 4, hasModifiers: true },
  { name: 'Трав\'яний чай', slug: 'herbal-tea', description: 'Суміш м\'яти, ромашки та чебрецю', shortDescription: 'Заспокійливий', price: 45, costPrice: 12, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 4, hasModifiers: false },
  { name: 'Чай Латте', slug: 'chai-latte', description: 'Індійський масала чай з молоком та спеціями', shortDescription: 'Пряний', price: 80, costPrice: 22, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 5, preparationTime: 5, hasModifiers: true },

  // ---- Десерти (6) ----
  { name: 'Чізкейк', slug: 'cheesecake', description: 'Класичний Нью-Йорк чізкейк', shortDescription: 'Класичний', price: 95, costPrice: 35, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 1, preparationTime: 1, hasModifiers: false },
  { name: 'Тірамісу', slug: 'tiramisu', description: 'Італійський десерт з маскарпоне та кавою', shortDescription: 'Італійський', price: 110, costPrice: 40, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 2, preparationTime: 1, hasModifiers: false },
  { name: 'Брауні', slug: 'brownie', description: 'Шоколадний брауні з горіхами', shortDescription: 'Шоколадний', price: 75, costPrice: 25, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 1, hasModifiers: false },
  { name: 'Панна Кота', slug: 'panna-cotta', description: 'Вершковий десерт з ягідним соусом', shortDescription: 'Вершковий', price: 85, costPrice: 30, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 1, hasModifiers: false },
  { name: 'Медовик', slug: 'medovik', description: 'Традиційний медовий торт', shortDescription: 'Медовий', price: 90, costPrice: 32, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 5, preparationTime: 1, hasModifiers: false },
  { name: 'Наполеон', slug: 'napoleon', description: 'Листкове тісто з кремом', shortDescription: 'Класичний', price: 85, costPrice: 28, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 6, preparationTime: 1, hasModifiers: false },

  // ---- Випічка (5) ----
  { name: 'Круасан', slug: 'croissant', description: 'Свіжий французький круасан', shortDescription: 'Свіжий', price: 55, costPrice: 18, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 1, preparationTime: 1, hasModifiers: false },
  { name: 'Круасан з шоколадом', slug: 'chocolate-croissant', description: 'Круасан з бельгійським шоколадом', shortDescription: 'З шоколадом', price: 65, costPrice: 22, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 2, preparationTime: 1, hasModifiers: false },
  { name: 'Маффін', slug: 'muffin', description: 'Шоколадний маффін з ягодами', shortDescription: 'Шоколадний', price: 45, costPrice: 15, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 1, trackInventory: true, stockQuantity: 12, lowStockThreshold: 5, hasModifiers: false },
  { name: 'Булочка з корицею', slug: 'cinnamon-roll', description: 'Тепла булочка з корицею та глазур\'ю', shortDescription: 'Тепла', price: 55, costPrice: 16, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 4, preparationTime: 2, hasModifiers: false },
  { name: 'Бейгл з вершковим сиром', slug: 'bagel', description: 'Бейгл з крем-сиром та зеленню', shortDescription: 'Поживний', price: 75, costPrice: 28, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 5, preparationTime: 2, hasModifiers: false },

  // ---- Сендвічі та салати (5) ----
  { name: 'Сендвіч з куркою', slug: 'chicken-sandwich', description: 'Сендвіч з курячим філе, руколою та соусом песто', shortDescription: 'З куркою', price: 120, costPrice: 45, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 1, preparationTime: 5, hasModifiers: false },
  { name: 'Сендвіч з лососем', slug: 'salmon-sandwich', description: 'Сендвіч зі слабосоленим лососем та крем-сиром', shortDescription: 'З лососем', price: 145, costPrice: 60, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 2, preparationTime: 5, hasModifiers: false },
  { name: 'Сендвіч Капрезе', slug: 'caprese-sandwich', description: 'Моцарелла, томати, базилік, бальзамік', shortDescription: 'Італійський', price: 115, costPrice: 42, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 4, hasModifiers: false },
  { name: 'Салат Цезар', slug: 'caesar-salad', description: 'Класичний салат Цезар з куркою та пармезаном', shortDescription: 'Класичний', price: 135, costPrice: 50, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 4, preparationTime: 7, hasModifiers: false },
  { name: 'Боул з тунцем', slug: 'tuna-bowl', description: 'Рис, тунець, авокадо, едамаме, соус понзу', shortDescription: 'Азійський', price: 155, costPrice: 65, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 5, preparationTime: 8, hasModifiers: false },

  // ---- Сніданки (4) ----
  { name: 'Тост з авокадо', slug: 'avocado-toast', description: 'Тост з авокадо, яйцем пашот та мікрогріном', shortDescription: 'Корисний', price: 125, costPrice: 48, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 1, preparationTime: 7, hasModifiers: false },
  { name: 'Гранола боул', slug: 'granola-bowl', description: 'Домашня гранола з йогуртом та сезонними фруктами', shortDescription: 'Фруктовий', price: 95, costPrice: 32, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 2, preparationTime: 3, hasModifiers: false },
  { name: 'Сирники', slug: 'syrnyky', description: 'Домашні сирники з сметаною та ягодами', shortDescription: 'Домашні', price: 110, costPrice: 38, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 3, preparationTime: 10, hasModifiers: false },
  { name: 'Омлет з овочами', slug: 'veggie-omelette', description: 'Пухкий омлет з грибами, перцем та сиром', shortDescription: 'Поживний', price: 115, costPrice: 35, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 8, hasModifiers: false },

  // ---- Напої (5) ----
  { name: 'Лимонад', slug: 'lemonade', description: 'Домашній лимонад з м\'ятою', shortDescription: 'Освіжаючий', price: 55, costPrice: 15, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 1, preparationTime: 3, hasModifiers: false },
  { name: 'Фреш апельсин', slug: 'orange-fresh', description: 'Свіжовичавлений апельсиновий сік', shortDescription: 'Свіжий', price: 75, costPrice: 30, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 2, preparationTime: 3, hasModifiers: false },
  { name: 'Фреш яблучний', slug: 'apple-fresh', description: 'Свіжовичавлений яблучний сік', shortDescription: 'Вітамінний', price: 70, costPrice: 25, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 3, hasModifiers: false },
  { name: 'Мохіто безалкогольний', slug: 'virgin-mojito', description: 'Лайм, м\'ята, содова та лід', shortDescription: 'Літній', price: 65, costPrice: 18, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 4, hasModifiers: false },
  { name: 'Смузі ягідний', slug: 'berry-smoothie', description: 'Мікс лісових ягід з йогуртом та бананом', shortDescription: 'Ягідний', price: 85, costPrice: 35, categorySlug: 'cold', isActive: true, isFeatured: true, sortOrder: 5, preparationTime: 4, hasModifiers: false },
];

// ============================================
// INGREDIENT CATEGORIES (8)
// ============================================

export const ingredientCategories = [
  { name: 'Молочні продукти', slug: 'dairy', sortOrder: 1, isActive: true },
  { name: 'Кава та какао', slug: 'coffee-beans', sortOrder: 2, isActive: true },
  { name: 'Чай', slug: 'tea-leaves', sortOrder: 3, isActive: true },
  { name: 'Сиропи та соуси', slug: 'syrups', sortOrder: 4, isActive: true },
  { name: 'Топінги', slug: 'toppings', sortOrder: 5, isActive: true },
  { name: 'Фрукти та ягоди', slug: 'fruits', sortOrder: 6, isActive: true },
  { name: 'Упаковка', slug: 'packaging', sortOrder: 7, isActive: true },
  { name: 'Інше', slug: 'other', sortOrder: 8, isActive: true },
];

// ============================================
// INGREDIENTS (35)
// ============================================

export interface SeedIngredient {
  name: string;
  slug: string;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'portion';
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  supplier?: string;
  categorySlug: string;
  isActive: boolean;
}

export const ingredients: SeedIngredient[] = [
  // Молочні продукти (6)
  { name: 'Молоко 2.5%', slug: 'milk-2-5', unit: 'ml', quantity: 10000, minQuantity: 3000, costPerUnit: 0.032, supplier: 'Молочна Ферма «Зоря»', categorySlug: 'dairy', isActive: true },
  { name: 'Вершки 33%', slug: 'cream-33', unit: 'ml', quantity: 2000, minQuantity: 1000, costPerUnit: 0.12, supplier: 'Молочна Ферма «Зоря»', categorySlug: 'dairy', isActive: true },
  { name: 'Молоко вівсяне', slug: 'oat-milk', unit: 'ml', quantity: 2000, minQuantity: 1000, costPerUnit: 0.08, supplier: 'Alpro', categorySlug: 'dairy', isActive: true },
  { name: 'Молоко мигдальне', slug: 'almond-milk', unit: 'ml', quantity: 1500, minQuantity: 800, costPerUnit: 0.10, supplier: 'Alpro', categorySlug: 'dairy', isActive: true },
  { name: 'Молоко кокосове', slug: 'coconut-milk', unit: 'ml', quantity: 1000, minQuantity: 500, costPerUnit: 0.12, supplier: 'Alpro', categorySlug: 'dairy', isActive: true },
  { name: 'Молоко безлактозне', slug: 'lactose-free-milk', unit: 'ml', quantity: 2000, minQuantity: 800, costPerUnit: 0.05, supplier: 'Молочна Ферма «Зоря»', categorySlug: 'dairy', isActive: true },

  // Кава та какао (3)
  { name: 'Кава Арабіка (зерно)', slug: 'arabica-beans', unit: 'g', quantity: 5000, minQuantity: 2000, costPerUnit: 0.85, supplier: 'Кава Україна', categorySlug: 'coffee-beans', isActive: true },
  { name: 'Кава Декаф (зерно)', slug: 'decaf-beans', unit: 'g', quantity: 1000, minQuantity: 500, costPerUnit: 0.95, supplier: 'Кава Україна', categorySlug: 'coffee-beans', isActive: true },
  { name: 'Какао порошок', slug: 'cocoa-powder', unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.25, supplier: 'Callebaut', categorySlug: 'coffee-beans', isActive: true },

  // Чай (4)
  { name: 'Чай чорний (листовий)', slug: 'black-tea', unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.45, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },
  { name: 'Чай зелений (листовий)', slug: 'green-tea', unit: 'g', quantity: 400, minQuantity: 200, costPerUnit: 0.55, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },
  { name: 'Матча преміум', slug: 'matcha', unit: 'g', quantity: 200, minQuantity: 100, costPerUnit: 2.50, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },
  { name: 'Чай трав\'яний (мікс)', slug: 'herbal-tea-mix', unit: 'g', quantity: 300, minQuantity: 150, costPerUnit: 0.65, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },

  // Сиропи та соуси (6)
  { name: 'Сироп ваніль', slug: 'vanilla-syrup', unit: 'ml', quantity: 750, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп карамель', slug: 'caramel-syrup', unit: 'ml', quantity: 750, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп лісовий горіх', slug: 'hazelnut-syrup', unit: 'ml', quantity: 500, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп кокос', slug: 'coconut-syrup', unit: 'ml', quantity: 500, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп лаванда', slug: 'lavender-syrup', unit: 'ml', quantity: 500, minQuantity: 200, costPerUnit: 0.12, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Соус карамельний', slug: 'caramel-sauce', unit: 'ml', quantity: 500, minQuantity: 200, costPerUnit: 0.10, supplier: 'Monin', categorySlug: 'syrups', isActive: true },

  // Топінги (3)
  { name: 'Шоколад темний', slug: 'dark-chocolate', unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.15, supplier: 'Callebaut', categorySlug: 'toppings', isActive: true },
  { name: 'Шоколад білий', slug: 'white-chocolate', unit: 'g', quantity: 300, minQuantity: 150, costPerUnit: 0.18, supplier: 'Callebaut', categorySlug: 'toppings', isActive: true },
  { name: 'Вершки збиті (балон)', slug: 'whipped-cream', unit: 'ml', quantity: 500, minQuantity: 200, costPerUnit: 0.10, supplier: 'Молочна Ферма «Зоря»', categorySlug: 'toppings', isActive: true },

  // Фрукти та ягоди (3)
  { name: 'Банан', slug: 'banana', unit: 'g', quantity: 2000, minQuantity: 500, costPerUnit: 0.04, supplier: 'Фреш Маркет', categorySlug: 'fruits', isActive: true },
  { name: 'Мікс лісових ягід (заморожені)', slug: 'berry-mix', unit: 'g', quantity: 1500, minQuantity: 500, costPerUnit: 0.18, supplier: 'Фреш Маркет', categorySlug: 'fruits', isActive: true },
  { name: 'Апельсин', slug: 'orange', unit: 'pcs', quantity: 30, minQuantity: 10, costPerUnit: 18, supplier: 'Фреш Маркет', categorySlug: 'fruits', isActive: true },

  // Упаковка (5)
  { name: 'Стакан паперовий 250мл', slug: 'cup-250', unit: 'pcs', quantity: 200, minQuantity: 100, costPerUnit: 2.50, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Стакан паперовий 350мл', slug: 'cup-350', unit: 'pcs', quantity: 200, minQuantity: 100, costPerUnit: 3.00, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Стакан паперовий 450мл', slug: 'cup-450', unit: 'pcs', quantity: 150, minQuantity: 100, costPerUnit: 3.50, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Кришка для стакану', slug: 'cup-lid', unit: 'pcs', quantity: 500, minQuantity: 200, costPerUnit: 0.80, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Трубочка паперова', slug: 'paper-straw', unit: 'pcs', quantity: 300, minQuantity: 150, costPerUnit: 0.50, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },

  // Інше (5)
  { name: 'Цукор', slug: 'sugar', unit: 'g', quantity: 5000, minQuantity: 2000, costPerUnit: 0.02, categorySlug: 'other', isActive: true },
  { name: 'Цукор тростинний', slug: 'brown-sugar', unit: 'g', quantity: 2000, minQuantity: 1000, costPerUnit: 0.04, categorySlug: 'other', isActive: true },
  { name: 'Лід', slug: 'ice', unit: 'g', quantity: 10000, minQuantity: 3000, costPerUnit: 0.005, categorySlug: 'other', isActive: true },
  { name: 'Маршмелоу', slug: 'marshmallow', unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.12, supplier: 'Солодкий Дім', categorySlug: 'other', isActive: true },
  { name: 'Кокосова стружка', slug: 'coconut-flakes', unit: 'g', quantity: 300, minQuantity: 100, costPerUnit: 0.15, categorySlug: 'other', isActive: true },
];

// ============================================
// EMPLOYEES (7)
// ============================================

export const employees = [
  { name: 'Іван Шевченко', email: 'owner@coffeepos.com', phone: '+380501234567', role: 'owner', position: 'Власник', isActive: true, hireDate: '2023-01-15', salary: 50000 },
  { name: 'Марія Коваленко', email: 'manager@coffeepos.com', phone: '+380502345678', role: 'manager', position: 'Старший менеджер', isActive: true, hireDate: '2023-03-01', salary: 35000 },
  { name: 'Олена Бондаренко', email: 'barista@coffeepos.com', phone: '+380503456789', role: 'barista', position: 'Старший бариста', isActive: true, hireDate: '2023-06-15', salary: 24000 },
  { name: 'Андрій Мельник', email: 'andriy@coffeepos.com', phone: '+380504567890', role: 'barista', position: 'Бариста', isActive: true, hireDate: '2023-09-01', salary: 20000 },
  { name: 'Софія Ткаченко', email: 'sofia@coffeepos.com', phone: '+380505678901', role: 'barista', position: 'Бариста', isActive: true, hireDate: '2024-01-10', salary: 20000 },
  { name: 'Дмитро Козлов', email: 'dmytro@coffeepos.com', phone: '+380506789012', role: 'barista', position: 'Бариста-стажер', isActive: true, hireDate: '2024-08-01', salary: 18000 },
  { name: 'Вікторія Литвин', email: 'vika@coffeepos.com', phone: '+380507890123', role: 'barista', position: 'Бариста (вихідні)', isActive: true, hireDate: '2024-10-15', salary: 16000 },
];

// ============================================
// CAFE TABLES (15)
// ============================================

export const cafeTables = [
  { number: 1, seats: 2, zone: 'Зал', isActive: true, sortOrder: 1 },
  { number: 2, seats: 2, zone: 'Зал', isActive: true, sortOrder: 2 },
  { number: 3, seats: 2, zone: 'Зал', isActive: true, sortOrder: 3 },
  { number: 4, seats: 4, zone: 'Зал', isActive: true, sortOrder: 4 },
  { number: 5, seats: 4, zone: 'Зал', isActive: true, sortOrder: 5 },
  { number: 6, seats: 6, zone: 'Зал', isActive: true, sortOrder: 6 },
  { number: 7, seats: 4, zone: 'Зал', isActive: true, sortOrder: 7 },
  { number: 8, seats: 2, zone: 'Тераса', isActive: true, sortOrder: 8 },
  { number: 9, seats: 2, zone: 'Тераса', isActive: true, sortOrder: 9 },
  { number: 10, seats: 4, zone: 'Тераса', isActive: true, sortOrder: 10 },
  { number: 11, seats: 4, zone: 'Тераса', isActive: true, sortOrder: 11 },
  { number: 12, seats: 6, zone: 'Тераса', isActive: true, sortOrder: 12 },
  { number: 13, seats: 8, zone: 'VIP', isActive: true, sortOrder: 13 },
  { number: 14, seats: 6, zone: 'VIP', isActive: true, sortOrder: 14 },
  { number: 15, seats: 1, zone: 'Барна стійка', isActive: true, sortOrder: 15 },
];

// ============================================
// RECIPES
// ============================================

export interface SeedRecipeIngredient {
  ingredientSlug: string;
  amount: number;
}

export interface SeedRecipe {
  productSlug: string;
  sizeId: string;
  sizeName: string;
  sizeVolume?: string;
  price: number;
  costPrice: number;
  isDefault: boolean;
  ingredients: SeedRecipeIngredient[];
}

export const recipes: SeedRecipe[] = [
  // Espresso
  { productSlug: 'espresso', sizeId: 'single', sizeName: 'Сінгл', price: 45, costPrice: 15.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }] },
  { productSlug: 'espresso', sizeId: 'double', sizeName: 'Допіо', price: 65, costPrice: 30.60, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }] },

  // Americano
  { productSlug: 'americano', sizeId: 's', sizeName: 'S', sizeVolume: '250 мл', price: 55, costPrice: 17.80, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cup-250', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'americano', sizeId: 'm', sizeName: 'M', sizeVolume: '350 мл', price: 65, costPrice: 18.80, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'americano', sizeId: 'l', sizeName: 'L', sizeVolume: '450 мл', price: 75, costPrice: 24.70, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 24 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Cappuccino
  { productSlug: 'cappuccino', sizeId: 's', sizeName: 'S', sizeVolume: '250 мл', price: 65, costPrice: 23.56, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 180 }, { ingredientSlug: 'cup-250', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'cappuccino', sizeId: 'm', sizeName: 'M', sizeVolume: '350 мл', price: 75, costPrice: 27.76, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 280 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'cappuccino', sizeId: 'l', sizeName: 'L', sizeVolume: '450 мл', price: 85, costPrice: 35.06, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 24 }, { ingredientSlug: 'milk-2-5', amount: 380 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Latte
  { productSlug: 'latte', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 70, costPrice: 26.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'latte', sizeId: 'm', sizeName: 'M', sizeVolume: '400 мл', price: 85, costPrice: 32.50, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'latte', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 95, costPrice: 38.10, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 24 }, { ingredientSlug: 'milk-2-5', amount: 450 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Flat White
  { productSlug: 'flat-white', sizeId: 'standard', sizeName: 'Стандарт', sizeVolume: '250 мл', price: 75, costPrice: 35.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'milk-2-5', amount: 150 }, { ingredientSlug: 'cup-250', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Raf
  { productSlug: 'raf', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 85, costPrice: 42.70, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cream-33', amount: 200 }, { ingredientSlug: 'vanilla-syrup', amount: 20 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'raf', sizeId: 'm', sizeName: 'M', sizeVolume: '400 мл', price: 100, costPrice: 57.10, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cream-33', amount: 300 }, { ingredientSlug: 'vanilla-syrup', amount: 30 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Mocha
  { productSlug: 'mocha', sizeId: 'standard', sizeName: 'Стандарт', sizeVolume: '350 мл', price: 80, costPrice: 32.10, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 200 }, { ingredientSlug: 'dark-chocolate', amount: 20 }, { ingredientSlug: 'whipped-cream', amount: 30 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Iced Latte
  { productSlug: 'iced-latte', sizeId: 'm', sizeName: 'M', sizeVolume: '400 мл', price: 75, costPrice: 41.10, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
  { productSlug: 'iced-latte', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 90, costPrice: 47.30, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'ice', amount: 150 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Lavender Latte
  { productSlug: 'lavender-latte', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 95, costPrice: 32.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'lavender-syrup', amount: 20 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Caramel Macchiato
  { productSlug: 'caramel-macchiato', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 95, costPrice: 30.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'vanilla-syrup', amount: 15 }, { ingredientSlug: 'caramel-sauce', amount: 15 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Banana Raf
  { productSlug: 'banana-raf', sizeId: 's', sizeName: 'S', sizeVolume: '350 мл', price: 95, costPrice: 38.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cream-33', amount: 200 }, { ingredientSlug: 'banana', amount: 80 }, { ingredientSlug: 'caramel-sauce', amount: 15 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Black Tea
  { productSlug: 'black-tea', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 40, costPrice: 4.85, isDefault: true,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'black-tea', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 55, costPrice: 6.25, isDefault: false,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 5 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Green Tea
  { productSlug: 'green-tea', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 45, costPrice: 5.15, isDefault: true,
    ingredients: [{ ingredientSlug: 'green-tea', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Matcha Latte
  { productSlug: 'matcha-latte', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 85, costPrice: 18.50, isDefault: true,
    ingredients: [{ ingredientSlug: 'matcha', amount: 3 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'matcha-latte', sizeId: 'm', sizeName: 'M', sizeVolume: '400 мл', price: 100, costPrice: 24.70, isDefault: false,
    ingredients: [{ ingredientSlug: 'matcha', amount: 4 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Chai Latte
  { productSlug: 'chai-latte', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 80, costPrice: 16.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 4 }, { ingredientSlug: 'milk-2-5', amount: 200 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Lemonade
  { productSlug: 'lemonade', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 55, costPrice: 12.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
  { productSlug: 'lemonade', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 75, costPrice: 16.00, isDefault: false,
    ingredients: [{ ingredientSlug: 'ice', amount: 150 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Berry Smoothie
  { productSlug: 'berry-smoothie', sizeId: 'standard', sizeName: 'Стандарт', sizeVolume: '400 мл', price: 85, costPrice: 38.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'berry-mix', amount: 100 }, { ingredientSlug: 'banana', amount: 60 }, { ingredientSlug: 'milk-2-5', amount: 150 }, { ingredientSlug: 'ice', amount: 80 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
];
