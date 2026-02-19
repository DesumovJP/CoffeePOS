/**
 * CoffeePOS - Seed Data
 *
 * Test data for development
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

export const categories = [
  {
    name: 'Кава',
    slug: 'coffee',
    description: 'Ароматна кава різних видів',
    icon: 'coffee',
    color: '#8B4513',
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'Чай',
    slug: 'tea',
    description: 'Чай на будь-який смак',
    icon: 'tea',
    color: '#228B22',
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'Десерти',
    slug: 'desserts',
    description: 'Солодощі та випічка',
    icon: 'cake',
    color: '#FF69B4',
    sortOrder: 3,
    isActive: true,
  },
  {
    name: 'Їжа',
    slug: 'food',
    description: 'Сендвічі, салати та страви',
    icon: 'utensils',
    color: '#FF6347',
    sortOrder: 4,
    isActive: true,
  },
  {
    name: 'Напої',
    slug: 'drinks',
    description: 'Холодні напої та фреші',
    icon: 'glass',
    color: '#4169E1',
    sortOrder: 5,
    isActive: true,
  },
];

export const modifierGroups = [
  {
    name: 'size',
    displayName: 'Розмір',
    description: 'Оберіть розмір напою',
    type: 'single' as const,
    isRequired: true,
    sortOrder: 1,
    isActive: true,
  },
  {
    name: 'milk',
    displayName: 'Молоко',
    description: 'Тип молока',
    type: 'single' as const,
    isRequired: false,
    sortOrder: 2,
    isActive: true,
  },
  {
    name: 'extras',
    displayName: 'Додатки',
    description: 'Додаткові інгредієнти',
    type: 'multiple' as const,
    isRequired: false,
    sortOrder: 3,
    isActive: true,
  },
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
  ],
  extras: [
    { name: 'extra_shot', displayName: 'Додатковий шот', price: 20, sortOrder: 1, isDefault: false },
    { name: 'syrup', displayName: 'Сироп', price: 15, sortOrder: 2, isDefault: false },
    { name: 'whipped_cream', displayName: 'Збиті вершки', price: 20, sortOrder: 3, isDefault: false },
    { name: 'cinnamon', displayName: 'Кориця', price: 5, sortOrder: 4, isDefault: false },
  ],
};

export const products = [
  // Кава
  {
    name: 'Еспресо',
    slug: 'espresso',
    description: 'Класичний італійський еспресо',
    shortDescription: 'Класика',
    price: 45,
    costPrice: 12,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    preparationTime: 2,
    hasModifiers: true,
  },
  {
    name: 'Американо',
    slug: 'americano',
    description: 'Еспресо з гарячою водою',
    shortDescription: 'М\'який смак',
    price: 55,
    costPrice: 14,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: false,
    sortOrder: 2,
    preparationTime: 2,
    hasModifiers: true,
  },
  {
    name: 'Капучіно',
    slug: 'cappuccino',
    description: 'Еспресо з молочною пінкою',
    shortDescription: 'Ніжна пінка',
    price: 65,
    costPrice: 18,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: true,
    sortOrder: 3,
    preparationTime: 3,
    hasModifiers: true,
  },
  {
    name: 'Латте',
    slug: 'latte',
    description: 'Еспресо з великою кількістю молока',
    shortDescription: 'Молочний',
    price: 70,
    costPrice: 20,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: true,
    sortOrder: 4,
    preparationTime: 3,
    hasModifiers: true,
  },
  {
    name: 'Флет Вайт',
    slug: 'flat-white',
    description: 'Подвійний еспресо з молоком',
    shortDescription: 'Насичений',
    price: 75,
    costPrice: 22,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: false,
    sortOrder: 5,
    preparationTime: 3,
    hasModifiers: true,
  },
  {
    name: 'Раф',
    slug: 'raf',
    description: 'Кава з вершками та ванільним цукром',
    shortDescription: 'Вершковий',
    price: 85,
    costPrice: 25,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: true,
    sortOrder: 6,
    preparationTime: 4,
    hasModifiers: true,
  },
  {
    name: 'Мокко',
    slug: 'mocha',
    description: 'Кава з шоколадом та молоком',
    shortDescription: 'Шоколадний',
    price: 80,
    costPrice: 24,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: false,
    sortOrder: 7,
    preparationTime: 4,
    hasModifiers: true,
  },
  {
    name: 'Айс Латте',
    slug: 'iced-latte',
    description: 'Холодний латте з льодом',
    shortDescription: 'Освіжаючий',
    price: 75,
    costPrice: 22,
    categorySlug: 'coffee',
    isActive: true,
    isFeatured: false,
    sortOrder: 8,
    preparationTime: 3,
    hasModifiers: true,
  },

  // Чай
  {
    name: 'Чорний чай',
    slug: 'black-tea',
    description: 'Класичний чорний чай',
    shortDescription: 'Класика',
    price: 40,
    costPrice: 8,
    categorySlug: 'tea',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    preparationTime: 3,
    hasModifiers: false,
  },
  {
    name: 'Зелений чай',
    slug: 'green-tea',
    description: 'Зелений чай з жасмином',
    shortDescription: 'Легкий',
    price: 45,
    costPrice: 10,
    categorySlug: 'tea',
    isActive: true,
    isFeatured: false,
    sortOrder: 2,
    preparationTime: 3,
    hasModifiers: false,
  },
  {
    name: 'Матча Латте',
    slug: 'matcha-latte',
    description: 'Японський зелений чай з молоком',
    shortDescription: 'Японський',
    price: 85,
    costPrice: 30,
    categorySlug: 'tea',
    isActive: true,
    isFeatured: true,
    sortOrder: 3,
    preparationTime: 4,
    hasModifiers: true,
  },

  // Десерти
  {
    name: 'Чізкейк',
    slug: 'cheesecake',
    description: 'Класичний Нью-Йорк чізкейк',
    shortDescription: 'Класичний',
    price: 95,
    costPrice: 35,
    categorySlug: 'desserts',
    isActive: true,
    isFeatured: true,
    sortOrder: 1,
    preparationTime: 1,
    hasModifiers: false,
  },
  {
    name: 'Тірамісу',
    slug: 'tiramisu',
    description: 'Італійський десерт з маскарпоне',
    shortDescription: 'Італійський',
    price: 110,
    costPrice: 40,
    categorySlug: 'desserts',
    isActive: true,
    isFeatured: true,
    sortOrder: 2,
    preparationTime: 1,
    hasModifiers: false,
  },
  {
    name: 'Круасан',
    slug: 'croissant',
    description: 'Свіжий французький круасан',
    shortDescription: 'Свіжий',
    price: 55,
    costPrice: 18,
    categorySlug: 'desserts',
    isActive: true,
    isFeatured: false,
    sortOrder: 3,
    preparationTime: 1,
    hasModifiers: false,
  },
  {
    name: 'Маффін',
    slug: 'muffin',
    description: 'Шоколадний маффін',
    shortDescription: 'Шоколадний',
    price: 45,
    costPrice: 15,
    categorySlug: 'desserts',
    isActive: true,
    isFeatured: false,
    sortOrder: 4,
    preparationTime: 1,
    trackInventory: true,
    stockQuantity: 8,
    lowStockThreshold: 5,
    hasModifiers: false,
  },

  // Їжа
  {
    name: 'Сендвіч з куркою',
    slug: 'chicken-sandwich',
    description: 'Сендвіч з курячим філе та овочами',
    shortDescription: 'З куркою',
    price: 120,
    costPrice: 45,
    categorySlug: 'food',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    preparationTime: 5,
    hasModifiers: false,
  },
  {
    name: 'Сендвіч з лососем',
    slug: 'salmon-sandwich',
    description: 'Сендвіч зі слабосоленим лососем',
    shortDescription: 'З лососем',
    price: 145,
    costPrice: 60,
    categorySlug: 'food',
    isActive: false, // Out of stock
    isFeatured: false,
    sortOrder: 2,
    preparationTime: 5,
    hasModifiers: false,
  },
  {
    name: 'Салат Цезар',
    slug: 'caesar-salad',
    description: 'Класичний салат Цезар з куркою',
    shortDescription: 'Класичний',
    price: 135,
    costPrice: 50,
    categorySlug: 'food',
    isActive: true,
    isFeatured: true,
    sortOrder: 3,
    preparationTime: 7,
    hasModifiers: false,
  },

  // Напої
  {
    name: 'Лимонад',
    slug: 'lemonade',
    description: 'Домашній лимонад з м\'ятою',
    shortDescription: 'Освіжаючий',
    price: 55,
    costPrice: 15,
    categorySlug: 'drinks',
    isActive: true,
    isFeatured: false,
    sortOrder: 1,
    preparationTime: 3,
    hasModifiers: false,
  },
  {
    name: 'Фреш апельсин',
    slug: 'orange-fresh',
    description: 'Свіжовичавлений апельсиновий сік',
    shortDescription: 'Свіжий',
    price: 75,
    costPrice: 30,
    categorySlug: 'drinks',
    isActive: true,
    isFeatured: false,
    sortOrder: 2,
    preparationTime: 3,
    hasModifiers: false,
  },
];

// ============================================
// INGREDIENT CATEGORIES
// ============================================

export const ingredientCategories = [
  { name: 'Молочні продукти', slug: 'dairy', sortOrder: 1, isActive: true },
  { name: 'Кава', slug: 'coffee-beans', sortOrder: 2, isActive: true },
  { name: 'Чай', slug: 'tea-leaves', sortOrder: 3, isActive: true },
  { name: 'Сиропи', slug: 'syrups', sortOrder: 4, isActive: true },
  { name: 'Топінги', slug: 'toppings', sortOrder: 5, isActive: true },
  { name: 'Упаковка', slug: 'packaging', sortOrder: 6, isActive: true },
  { name: 'Інше', slug: 'other', sortOrder: 7, isActive: true },
];

// ============================================
// INGREDIENTS
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
  // Молочні продукти
  { name: 'Молоко 2.5%', slug: 'milk-2-5', unit: 'ml', quantity: 10000, minQuantity: 3000, costPerUnit: 0.032, supplier: 'Молочар', categorySlug: 'dairy', isActive: true },
  { name: 'Вершки 33%', slug: 'cream-33', unit: 'ml', quantity: 2000, minQuantity: 1000, costPerUnit: 0.12, supplier: 'Молочар', categorySlug: 'dairy', isActive: true },
  { name: 'Молоко вівсяне', slug: 'oat-milk', unit: 'ml', quantity: 2000, minQuantity: 1000, costPerUnit: 0.08, supplier: 'Alpro', categorySlug: 'dairy', isActive: true },
  { name: 'Молоко мигдальне', slug: 'almond-milk', unit: 'ml', quantity: 1500, minQuantity: 800, costPerUnit: 0.10, supplier: 'Alpro', categorySlug: 'dairy', isActive: true },

  // Кава
  { name: 'Кава Арабіка (зерно)', slug: 'arabica-beans', unit: 'g', quantity: 5000, minQuantity: 2000, costPerUnit: 0.85, supplier: 'CoffeePro', categorySlug: 'coffee-beans', isActive: true },
  { name: 'Кава Декаф (зерно)', slug: 'decaf-beans', unit: 'g', quantity: 1000, minQuantity: 500, costPerUnit: 0.95, supplier: 'CoffeePro', categorySlug: 'coffee-beans', isActive: true },

  // Чай
  { name: 'Чай чорний (листовий)', slug: 'black-tea', unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.45, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },
  { name: 'Чай зелений (листовий)', slug: 'green-tea', unit: 'g', quantity: 400, minQuantity: 200, costPerUnit: 0.55, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },
  { name: 'Матча преміум', slug: 'matcha', unit: 'g', quantity: 200, minQuantity: 100, costPerUnit: 2.50, supplier: 'TeaTime', categorySlug: 'tea-leaves', isActive: true },

  // Сиропи
  { name: 'Сироп ваніль', slug: 'vanilla-syrup', unit: 'ml', quantity: 750, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп карамель', slug: 'caramel-syrup', unit: 'ml', quantity: 750, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп лісовий горіх', slug: 'hazelnut-syrup', unit: 'ml', quantity: 500, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },
  { name: 'Сироп кокос', slug: 'coconut-syrup', unit: 'ml', quantity: 500, minQuantity: 300, costPerUnit: 0.08, supplier: 'Monin', categorySlug: 'syrups', isActive: true },

  // Топінги
  { name: 'Шоколад темний', slug: 'dark-chocolate', unit: 'g', quantity: 500, minQuantity: 200, costPerUnit: 0.15, supplier: 'Callebaut', categorySlug: 'toppings', isActive: true },
  { name: 'Шоколад білий', slug: 'white-chocolate', unit: 'g', quantity: 300, minQuantity: 150, costPerUnit: 0.18, supplier: 'Callebaut', categorySlug: 'toppings', isActive: true },
  { name: 'Вершки збиті (балон)', slug: 'whipped-cream', unit: 'ml', quantity: 500, minQuantity: 200, costPerUnit: 0.10, supplier: 'Молочар', categorySlug: 'toppings', isActive: true },

  // Упаковка
  { name: 'Стакан паперовий 250мл', slug: 'cup-250', unit: 'pcs', quantity: 200, minQuantity: 100, costPerUnit: 2.50, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Стакан паперовий 350мл', slug: 'cup-350', unit: 'pcs', quantity: 200, minQuantity: 100, costPerUnit: 3.00, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Стакан паперовий 450мл', slug: 'cup-450', unit: 'pcs', quantity: 150, minQuantity: 100, costPerUnit: 3.50, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Кришка для стакану', slug: 'cup-lid', unit: 'pcs', quantity: 500, minQuantity: 200, costPerUnit: 0.80, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },
  { name: 'Трубочка паперова', slug: 'paper-straw', unit: 'pcs', quantity: 300, minQuantity: 150, costPerUnit: 0.50, supplier: 'Пакувальник', categorySlug: 'packaging', isActive: true },

  // Інше
  { name: 'Цукор', slug: 'sugar', unit: 'g', quantity: 5000, minQuantity: 2000, costPerUnit: 0.02, categorySlug: 'other', isActive: true },
  { name: 'Цукор тростинний', slug: 'brown-sugar', unit: 'g', quantity: 2000, minQuantity: 1000, costPerUnit: 0.04, categorySlug: 'other', isActive: true },
  { name: 'Лід', slug: 'ice', unit: 'g', quantity: 10000, minQuantity: 3000, costPerUnit: 0.005, categorySlug: 'other', isActive: true },
];

// ============================================
// EMPLOYEES
// ============================================

export const employees = [
  {
    name: 'Іван Шевченко',
    email: 'owner@coffeepos.com',
    phone: '+380501234567',
    role: 'owner',
    position: 'Власник',
    isActive: true,
    hireDate: '2023-01-15',
    salary: 50000,
  },
  {
    name: 'Марія Коваленко',
    email: 'manager@coffeepos.com',
    phone: '+380502345678',
    role: 'manager',
    position: 'Старший менеджер',
    isActive: true,
    hireDate: '2023-03-01',
    salary: 35000,
  },
  {
    name: 'Олена Бондаренко',
    email: 'barista@coffeepos.com',
    phone: '+380503456789',
    role: 'barista',
    position: 'Бариста',
    isActive: true,
    hireDate: '2023-06-15',
    salary: 22000,
  },
  {
    name: 'Андрій Мельник',
    email: 'andriy@coffeepos.com',
    phone: '+380504567890',
    role: 'barista',
    position: 'Бариста',
    isActive: true,
    hireDate: '2023-09-01',
    salary: 20000,
  },
  {
    name: 'Софія Ткаченко',
    email: 'sofia@coffeepos.com',
    phone: '+380505678901',
    role: 'barista',
    position: 'Бариста-стажер',
    isActive: true,
    hireDate: '2024-01-10',
    salary: 18000,
  },
];

// ============================================
// CAFE TABLES
// ============================================

export const cafeTables = [
  { number: 1, seats: 2, zone: 'Зал', isActive: true, sortOrder: 1 },
  { number: 2, seats: 2, zone: 'Зал', isActive: true, sortOrder: 2 },
  { number: 3, seats: 4, zone: 'Зал', isActive: true, sortOrder: 3 },
  { number: 4, seats: 4, zone: 'Зал', isActive: true, sortOrder: 4 },
  { number: 5, seats: 6, zone: 'Зал', isActive: true, sortOrder: 5 },
  { number: 6, seats: 4, zone: 'Зал', isActive: true, sortOrder: 6 },
  { number: 7, seats: 2, zone: 'Тераса', isActive: true, sortOrder: 7 },
  { number: 8, seats: 2, zone: 'Тераса', isActive: true, sortOrder: 8 },
  { number: 9, seats: 4, zone: 'Тераса', isActive: true, sortOrder: 9 },
  { number: 10, seats: 6, zone: 'Тераса', isActive: true, sortOrder: 10 },
  { number: 11, seats: 8, zone: 'VIP', isActive: true, sortOrder: 11 },
  { number: 12, seats: 4, zone: 'VIP', isActive: true, sortOrder: 12 },
];

// ============================================
// RECIPES (product -> size -> ingredients)
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

  // Black Tea
  { productSlug: 'black-tea', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 40, costPrice: 4.85, isDefault: true,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'black-tea', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 55, costPrice: 6.25, isDefault: false,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 5 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Green Tea
  { productSlug: 'green-tea', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 45, costPrice: 5.15, isDefault: true,
    ingredients: [{ ingredientSlug: 'green-tea', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'green-tea', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 60, costPrice: 7.05, isDefault: false,
    ingredients: [{ ingredientSlug: 'green-tea', amount: 5 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Matcha Latte
  { productSlug: 'matcha-latte', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 85, costPrice: 18.50, isDefault: true,
    ingredients: [{ ingredientSlug: 'matcha', amount: 3 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'matcha-latte', sizeId: 'm', sizeName: 'M', sizeVolume: '400 мл', price: 100, costPrice: 24.70, isDefault: false,
    ingredients: [{ ingredientSlug: 'matcha', amount: 4 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Lemonade
  { productSlug: 'lemonade', sizeId: 's', sizeName: 'S', sizeVolume: '300 мл', price: 55, costPrice: 12.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
  { productSlug: 'lemonade', sizeId: 'l', sizeName: 'L', sizeVolume: '500 мл', price: 75, costPrice: 16.00, isDefault: false,
    ingredients: [{ ingredientSlug: 'ice', amount: 150 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
];
