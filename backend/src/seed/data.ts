/**
 * ParadisePOS — Seed Data
 *
 * Universal menu for a modern Ukrainian cafe:
 * coffee, tea, signature drinks, pastry, ice cream, shawarma, tacos,
 * sandwiches, salads, breakfasts, bottled drinks.
 *
 * Every assembled-in-house product has a recipe with correct costPrice
 * calculated from ingredient costs. Pre-made pastries have no recipes
 * (tracked via simple inventory).
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
// PRODUCT CATEGORIES (4)
// ============================================

export const categories = [
  { name: 'Гарячі напої', slug: 'hot',    description: 'Кава, авторські напої та чай',                     icon: 'coffee',   color: '#C0392B', sortOrder: 1, isActive: true },
  { name: 'Холодні',      slug: 'cold',   description: 'Холодні напої, фреші, смузі та напої з холодильника', icon: 'glass',    color: '#2980B9', sortOrder: 2, isActive: true },
  { name: 'Кондитерка',   slug: 'pastry', description: 'Десерти, випічка та морозиво',                      icon: 'cake',     color: '#E67E22', sortOrder: 3, isActive: true },
  { name: 'Їжа',          slug: 'grill',  description: 'Шаурма, сендвічі, тако, салати та сніданки',        icon: 'utensils', color: '#27AE60', sortOrder: 4, isActive: true },
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
    { name: 'extra_shot', displayName: 'Додатковий шот', price: 20, sortOrder: 1, isDefault: false,
      ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }] },
    { name: 'syrup', displayName: 'Сироп', price: 15, sortOrder: 2, isDefault: false,
      ingredients: [{ ingredientSlug: 'vanilla-syrup', amount: 15 }] },
    { name: 'whipped_cream', displayName: 'Збиті вершки', price: 20, sortOrder: 3, isDefault: false,
      ingredients: [{ ingredientSlug: 'whipped-cream', amount: 20 }] },
    { name: 'cinnamon', displayName: 'Кориця', price: 5, sortOrder: 4, isDefault: false },
    { name: 'marshmallow', displayName: 'Маршмелоу', price: 15, sortOrder: 5, isDefault: false },
  ],
};

// ============================================
// PRODUCTS (65)
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
  { name: 'Лавандовий Латте', slug: 'lavender-latte', description: 'Латте з лавандовим сиропом та молочною пінкою', shortDescription: 'Квітковий', price: 95, costPrice: 28, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 11, preparationTime: 4, hasModifiers: true },
  { name: 'Бамбл', slug: 'bumble', description: 'Еспресо з апельсиновим соком та льодом', shortDescription: 'Цитрусовий', price: 90, costPrice: 32, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 12, preparationTime: 3, hasModifiers: false },
  { name: 'Карамель Макіато', slug: 'caramel-macchiato', description: 'Ванільний латте з карамельним соусом', shortDescription: 'Солодкий', price: 95, costPrice: 26, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 13, preparationTime: 4, hasModifiers: true },
  { name: 'Кокосовий Латте', slug: 'coconut-latte', description: 'Латте на кокосовому молоці з кокосовою стружкою', shortDescription: 'Тропічний', price: 90, costPrice: 30, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 14, preparationTime: 4, hasModifiers: false },
  { name: 'Банановий Раф', slug: 'banana-raf', description: 'Раф з банановим пюре та карамеллю', shortDescription: 'Фруктовий', price: 95, costPrice: 30, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 15, preparationTime: 5, hasModifiers: true },
  { name: 'Фредо Еспресо', slug: 'freddo-espresso', description: 'Холодний збитий еспресо з кремовою пінкою', shortDescription: 'Грецький', price: 85, costPrice: 20, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 16, preparationTime: 3, hasModifiers: false },

  // ---- Чай (5) ----
  { name: 'Чорний чай', slug: 'black-tea', description: 'Класичний чорний чай', shortDescription: 'Класика', price: 40, costPrice: 8, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 17, preparationTime: 3, hasModifiers: false },
  { name: 'Зелений чай', slug: 'green-tea', description: 'Зелений чай з жасмином', shortDescription: 'Легкий', price: 45, costPrice: 10, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 18, preparationTime: 3, hasModifiers: false },
  { name: 'Матча Латте', slug: 'matcha-latte', description: 'Японський зелений чай з молоком', shortDescription: 'Японський', price: 85, costPrice: 30, categorySlug: 'hot', isActive: true, isFeatured: true, sortOrder: 19, preparationTime: 4, hasModifiers: true },
  { name: 'Трав\'яний чай', slug: 'herbal-tea', description: 'Суміш м\'яти, ромашки та чебрецю', shortDescription: 'Заспокійливий', price: 45, costPrice: 12, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 20, preparationTime: 4, hasModifiers: false },
  { name: 'Чай Латте', slug: 'chai-latte', description: 'Індійський масала чай з молоком та спеціями', shortDescription: 'Пряний', price: 80, costPrice: 22, categorySlug: 'hot', isActive: true, isFeatured: false, sortOrder: 21, preparationTime: 5, hasModifiers: true },

  // ---- Десерти (6) — pre-made, no recipe ----
  { name: 'Чізкейк', slug: 'cheesecake', description: 'Класичний Нью-Йорк чізкейк', shortDescription: 'Класичний', price: 95, costPrice: 35, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 1, preparationTime: 1, hasModifiers: false },
  { name: 'Тірамісу', slug: 'tiramisu', description: 'Італійський десерт з маскарпоне та кавою', shortDescription: 'Італійський', price: 110, costPrice: 40, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 2, preparationTime: 1, hasModifiers: false },
  { name: 'Брауні', slug: 'brownie', description: 'Шоколадний брауні з горіхами', shortDescription: 'Шоколадний', price: 75, costPrice: 25, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 1, hasModifiers: false },
  { name: 'Панна Кота', slug: 'panna-cotta', description: 'Вершковий десерт з ягідним соусом', shortDescription: 'Вершковий', price: 85, costPrice: 30, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 1, hasModifiers: false },
  { name: 'Медовик', slug: 'medovik', description: 'Традиційний медовий торт', shortDescription: 'Медовий', price: 90, costPrice: 32, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 5, preparationTime: 1, hasModifiers: false },
  { name: 'Наполеон', slug: 'napoleon', description: 'Листкове тісто з кремом', shortDescription: 'Класичний', price: 85, costPrice: 28, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 6, preparationTime: 1, hasModifiers: false },

  // ---- Випічка (5) — pre-made, no recipe ----
  { name: 'Круасан', slug: 'croissant', description: 'Свіжий французький круасан', shortDescription: 'Свіжий', price: 55, costPrice: 18, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 7, preparationTime: 1, hasModifiers: false },
  { name: 'Круасан з шоколадом', slug: 'chocolate-croissant', description: 'Круасан з бельгійським шоколадом', shortDescription: 'З шоколадом', price: 65, costPrice: 22, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 8, preparationTime: 1, hasModifiers: false },
  { name: 'Маффін', slug: 'muffin', description: 'Шоколадний маффін з ягодами', shortDescription: 'Шоколадний', price: 45, costPrice: 15, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 9, preparationTime: 1, trackInventory: true, stockQuantity: 12, lowStockThreshold: 5, hasModifiers: false },
  { name: 'Булочка з корицею', slug: 'cinnamon-roll', description: 'Тепла булочка з корицею та глазур\'ю', shortDescription: 'Тепла', price: 55, costPrice: 16, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 10, preparationTime: 2, hasModifiers: false },
  { name: 'Бейгл з вершковим сиром', slug: 'bagel', description: 'Бейгл з крем-сиром та зеленню', shortDescription: 'Поживний', price: 75, costPrice: 28, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 11, preparationTime: 2, hasModifiers: false },

  // ---- Морозиво (4) ----
  { name: 'Морозиво ванільне', slug: 'vanilla-ice-cream', description: 'Класичне ванільне морозиво (2 кульки)', shortDescription: 'Класичне', price: 65, costPrice: 18, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 12, preparationTime: 1, hasModifiers: false },
  { name: 'Морозиво шоколадне', slug: 'chocolate-ice-cream', description: 'Шоколадне морозиво з бельгійського какао (2 кульки)', shortDescription: 'Шоколадне', price: 70, costPrice: 20, categorySlug: 'pastry', isActive: true, isFeatured: false, sortOrder: 13, preparationTime: 1, hasModifiers: false },
  { name: 'Морозиво фісташкове', slug: 'pistachio-ice-cream', description: 'Фісташкове морозиво преміум (2 кульки)', shortDescription: 'Фісташкове', price: 80, costPrice: 28, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 14, preparationTime: 1, hasModifiers: false },
  { name: 'Афогато', slug: 'affogato', description: 'Ванільне морозиво з гарячим еспресо', shortDescription: 'Кава+морозиво', price: 95, costPrice: 30, categorySlug: 'pastry', isActive: true, isFeatured: true, sortOrder: 15, preparationTime: 2, hasModifiers: false },

  // ---- Сендвічі та салати (5) ----
  { name: 'Сендвіч з куркою', slug: 'chicken-sandwich', description: 'Сендвіч з курячим філе, руколою та соусом песто', shortDescription: 'З куркою', price: 120, costPrice: 45, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 1, preparationTime: 5, hasModifiers: false },
  { name: 'Сендвіч з лососем', slug: 'salmon-sandwich', description: 'Сендвіч зі слабосоленим лососем та крем-сиром', shortDescription: 'З лососем', price: 145, costPrice: 60, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 2, preparationTime: 5, hasModifiers: false },
  { name: 'Сендвіч Капрезе', slug: 'caprese-sandwich', description: 'Моцарелла, томати, базилік, бальзамік', shortDescription: 'Італійський', price: 115, costPrice: 42, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 4, hasModifiers: false },
  { name: 'Салат Цезар', slug: 'caesar-salad', description: 'Класичний салат Цезар з куркою та пармезаном', shortDescription: 'Класичний', price: 135, costPrice: 50, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 4, preparationTime: 7, hasModifiers: false },
  { name: 'Боул з тунцем', slug: 'tuna-bowl', description: 'Рис, тунець, авокадо, едамаме, соус понзу', shortDescription: 'Азійський', price: 155, costPrice: 65, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 5, preparationTime: 8, hasModifiers: false },

  // ---- Сніданки (4) ----
  { name: 'Тост з авокадо', slug: 'avocado-toast', description: 'Тост з авокадо, яйцем пашот та мікрогріном', shortDescription: 'Корисний', price: 125, costPrice: 48, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 6, preparationTime: 7, hasModifiers: false },
  { name: 'Гранола боул', slug: 'granola-bowl', description: 'Домашня гранола з йогуртом та сезонними фруктами', shortDescription: 'Фруктовий', price: 95, costPrice: 32, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 7, preparationTime: 3, hasModifiers: false },
  { name: 'Сирники', slug: 'syrnyky', description: 'Домашні сирники з сметаною та ягодами', shortDescription: 'Домашні', price: 110, costPrice: 38, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 8, preparationTime: 10, hasModifiers: false },
  { name: 'Омлет з овочами', slug: 'veggie-omelette', description: 'Пухкий омлет з грибами, перцем та сиром', shortDescription: 'Поживний', price: 115, costPrice: 35, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 9, preparationTime: 8, hasModifiers: false },

  // ---- Шаурма та донери (5) ----
  { name: 'Шаурма з куркою', slug: 'chicken-shawarma', description: 'Класична шаурма з курячим філе, овочами та часниковим соусом у лаваші', shortDescription: 'Класична', price: 135, costPrice: 45, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 10, preparationTime: 7, hasModifiers: false },
  { name: 'Шаурма з яловичиною', slug: 'beef-shawarma', description: 'Шаурма з яловичиною, свіжими овочами та гострим соусом', shortDescription: 'З яловичиною', price: 155, costPrice: 55, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 11, preparationTime: 8, hasModifiers: false },
  { name: 'Донер кебаб', slug: 'doner-kebab', description: 'Донер з бараниною в піті з овочами, тахіні та зеленню', shortDescription: 'Турецький', price: 175, costPrice: 60, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 12, preparationTime: 8, hasModifiers: false },
  { name: 'Фалафель у піті', slug: 'falafel-pita', description: 'Хрусткий фалафель у піті з овочами, тахіні та петрушкою', shortDescription: 'Вегетаріанський', price: 125, costPrice: 40, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 13, preparationTime: 6, hasModifiers: false },
  { name: 'Шаурма з креветками', slug: 'shrimp-shawarma', description: 'Шаурма з тигровими креветками, авокадо та гострим соусом', shortDescription: 'Преміум', price: 195, costPrice: 75, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 14, preparationTime: 9, hasModifiers: false },

  // ---- Тако та буріто (4) ----
  { name: 'Тако з куркою', slug: 'chicken-taco', description: 'Дві тортильї з курячим філе, сальсою, халапеньо та кінзою', shortDescription: 'Мексиканські', price: 125, costPrice: 38, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 15, preparationTime: 6, hasModifiers: false },
  { name: 'Тако з яловичиною', slug: 'beef-taco', description: 'Дві тортильї з яловичим фаршем, сальсою, гуакамоле та сметаною', shortDescription: 'Класичні', price: 135, costPrice: 42, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 16, preparationTime: 7, hasModifiers: false },
  { name: 'Начос з м\'ясом', slug: 'nachos-supreme', description: 'Начос з яловичим фаршем, сиром, сальсою, гуакамоле та сметаною', shortDescription: 'Максі', price: 145, costPrice: 48, categorySlug: 'grill', isActive: true, isFeatured: false, sortOrder: 17, preparationTime: 8, hasModifiers: false },
  { name: 'Буріто з куркою', slug: 'chicken-burrito', description: 'Велика тортилья з куркою, рисом, квасолею, сальсою та сиром', shortDescription: 'Ситний', price: 155, costPrice: 50, categorySlug: 'grill', isActive: true, isFeatured: true, sortOrder: 18, preparationTime: 8, hasModifiers: false },

  // ---- Домашні напої (5) ----
  { name: 'Лимонад', slug: 'lemonade', description: 'Домашній лимонад з м\'ятою', shortDescription: 'Освіжаючий', price: 55, costPrice: 15, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 1, preparationTime: 3, hasModifiers: false },
  { name: 'Фреш апельсин', slug: 'orange-fresh', description: 'Свіжовичавлений апельсиновий сік', shortDescription: 'Свіжий', price: 85, costPrice: 30, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 2, preparationTime: 3, hasModifiers: false },
  { name: 'Фреш яблучний', slug: 'apple-fresh', description: 'Свіжовичавлений яблучний сік', shortDescription: 'Вітамінний', price: 75, costPrice: 25, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 3, preparationTime: 3, hasModifiers: false },
  { name: 'Мохіто безалкогольний', slug: 'virgin-mojito', description: 'Лайм, м\'ята, содова та лід', shortDescription: 'Літній', price: 75, costPrice: 18, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 4, preparationTime: 4, hasModifiers: false },
  { name: 'Смузі ягідний', slug: 'berry-smoothie', description: 'Мікс лісових ягід з йогуртом та бананом', shortDescription: 'Ягідний', price: 85, costPrice: 35, categorySlug: 'cold', isActive: true, isFeatured: true, sortOrder: 5, preparationTime: 4, hasModifiers: false },

  // ---- Холодні напої з холодильника (6) ----
  { name: 'Pepsi 0.5л', slug: 'pepsi-500', description: 'Pepsi в пляшці 0.5л', shortDescription: 'Газована', price: 45, costPrice: 22, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 6, preparationTime: 0, hasModifiers: false },
  { name: 'Pepsi Max 0.5л', slug: 'pepsi-max-500', description: 'Pepsi Max без цукру 0.5л', shortDescription: 'Без цукру', price: 45, costPrice: 22, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 7, preparationTime: 0, hasModifiers: false },
  { name: '7UP 0.5л', slug: '7up-500', description: '7UP лимон-лайм 0.5л', shortDescription: 'Лимон-лайм', price: 45, costPrice: 22, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 8, preparationTime: 0, hasModifiers: false },
  { name: 'Lipton Ice Tea 0.5л', slug: 'lipton-ice-tea', description: 'Lipton холодний чай лимон 0.5л', shortDescription: 'Холодний чай', price: 45, costPrice: 20, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 9, preparationTime: 0, hasModifiers: false },
  { name: 'Вода мінеральна 0.5л', slug: 'mineral-water', description: 'Моршинська негазована 0.5л', shortDescription: 'Негазована', price: 30, costPrice: 12, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 10, preparationTime: 0, hasModifiers: false },
  { name: 'Вода газована 0.5л', slug: 'sparkling-water', description: 'Моршинська газована 0.5л', shortDescription: 'Газована', price: 30, costPrice: 12, categorySlug: 'cold', isActive: true, isFeatured: false, sortOrder: 11, preparationTime: 0, hasModifiers: false },
];

// ============================================
// INGREDIENT CATEGORIES (12)
// ============================================

export const ingredientCategories = [
  { name: 'Молочні продукти', slug: 'dairy',      sortOrder: 1,  isActive: true },
  { name: 'Кава та какао',    slug: 'coffee-beans', sortOrder: 2,  isActive: true },
  { name: 'Чай',              slug: 'tea-leaves',  sortOrder: 3,  isActive: true },
  { name: 'Сиропи',           slug: 'syrups',      sortOrder: 4,  isActive: true },
  { name: 'Топінги',          slug: 'toppings',    sortOrder: 5,  isActive: true },
  { name: 'Фрукти та ягоди',  slug: 'fruits',      sortOrder: 6,  isActive: true },
  { name: "М'ясо та риба",    slug: 'meat',        sortOrder: 7,  isActive: true },
  { name: 'Овочі та зелень',  slug: 'vegetables',  sortOrder: 8,  isActive: true },
  { name: 'Хліб та тісто',    slug: 'bread',       sortOrder: 9,  isActive: true },
  { name: 'Соуси',            slug: 'sauces',      sortOrder: 10, isActive: true },
  { name: 'Упаковка',         slug: 'packaging',   sortOrder: 11, isActive: true },
  { name: 'Інше',             slug: 'other',       sortOrder: 12, isActive: true },
];

// ============================================
// INGREDIENTS (99)
// ============================================

export interface SeedIngredient {
  name: string;
  slug: string;
  unit: 'g' | 'kg' | 'ml' | 'l' | 'pcs' | 'portion';
  quantity: number;
  minQuantity: number;
  costPerUnit: number;
  supplierNames?: string[];
  categorySlug: string;
  isActive: boolean;
}

export const ingredients: SeedIngredient[] = [
  // ── Молочні продукти (10) ──
  { name: 'Молоко 2.5%',              slug: 'milk-2-5',           unit: 'ml',  quantity: 10000, minQuantity: 3000, costPerUnit: 0.032,  supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },
  { name: 'Вершки 33%',               slug: 'cream-33',           unit: 'ml',  quantity: 2000,  minQuantity: 1000, costPerUnit: 0.12,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },
  { name: 'Молоко вівсяне',           slug: 'oat-milk',           unit: 'ml',  quantity: 2000,  minQuantity: 1000, costPerUnit: 0.08,   supplierNames: ['Alpro'], categorySlug: 'dairy', isActive: true },
  { name: 'Молоко мигдальне',         slug: 'almond-milk',        unit: 'ml',  quantity: 1500,  minQuantity: 800,  costPerUnit: 0.10,   supplierNames: ['Alpro'], categorySlug: 'dairy', isActive: true },
  { name: 'Молоко кокосове',          slug: 'coconut-milk',       unit: 'ml',  quantity: 1000,  minQuantity: 500,  costPerUnit: 0.12,   supplierNames: ['Alpro'], categorySlug: 'dairy', isActive: true },
  { name: 'Молоко безлактозне',       slug: 'lactose-free-milk',  unit: 'ml',  quantity: 2000,  minQuantity: 800,  costPerUnit: 0.05,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },
  { name: 'Крем-сир',                 slug: 'cream-cheese',       unit: 'g',   quantity: 1000,  minQuantity: 300,  costPerUnit: 0.12,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },
  { name: 'Моцарелла',                slug: 'mozzarella',         unit: 'g',   quantity: 1000,  minQuantity: 400,  costPerUnit: 0.20,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },
  { name: 'Пармезан',                 slug: 'parmesan',           unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.45,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },
  { name: 'Сир кисломолочний',        slug: 'cottage-cheese',     unit: 'g',   quantity: 2000,  minQuantity: 500,  costPerUnit: 0.07,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'dairy', isActive: true },

  // ── Кава та какао (3) ──
  { name: 'Кава Арабіка (зерно)',     slug: 'arabica-beans',      unit: 'g',   quantity: 5000,  minQuantity: 2000, costPerUnit: 0.85,   supplierNames: ['Кава Україна'], categorySlug: 'coffee-beans', isActive: true },
  { name: 'Кава Декаф (зерно)',       slug: 'decaf-beans',        unit: 'g',   quantity: 1000,  minQuantity: 500,  costPerUnit: 0.95,   supplierNames: ['Кава Україна'], categorySlug: 'coffee-beans', isActive: true },
  { name: 'Какао порошок',            slug: 'cocoa-powder',       unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.25,   supplierNames: ['Callebaut'], categorySlug: 'coffee-beans', isActive: true },

  // ── Чай (4) ──
  { name: 'Чай чорний (листовий)',    slug: 'black-tea',          unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.45,   supplierNames: ['TeaTime'], categorySlug: 'tea-leaves', isActive: true },
  { name: 'Чай зелений (листовий)',   slug: 'green-tea',          unit: 'g',   quantity: 400,   minQuantity: 200,  costPerUnit: 0.55,   supplierNames: ['TeaTime'], categorySlug: 'tea-leaves', isActive: true },
  { name: 'Матча преміум',            slug: 'matcha',             unit: 'g',   quantity: 200,   minQuantity: 100,  costPerUnit: 2.50,   supplierNames: ['TeaTime'], categorySlug: 'tea-leaves', isActive: true },
  { name: 'Чай трав\'яний (мікс)',    slug: 'herbal-tea-mix',     unit: 'g',   quantity: 300,   minQuantity: 150,  costPerUnit: 0.65,   supplierNames: ['TeaTime'], categorySlug: 'tea-leaves', isActive: true },

  // ── Сиропи (6) ──
  { name: 'Сироп ваніль',             slug: 'vanilla-syrup',      unit: 'ml',  quantity: 750,   minQuantity: 300,  costPerUnit: 0.08,   supplierNames: ['Monin'], categorySlug: 'syrups', isActive: true },
  { name: 'Сироп карамель',           slug: 'caramel-syrup',      unit: 'ml',  quantity: 750,   minQuantity: 300,  costPerUnit: 0.08,   supplierNames: ['Monin'], categorySlug: 'syrups', isActive: true },
  { name: 'Сироп лісовий горіх',      slug: 'hazelnut-syrup',     unit: 'ml',  quantity: 500,   minQuantity: 300,  costPerUnit: 0.08,   supplierNames: ['Monin'], categorySlug: 'syrups', isActive: true },
  { name: 'Сироп кокос',              slug: 'coconut-syrup',      unit: 'ml',  quantity: 500,   minQuantity: 300,  costPerUnit: 0.08,   supplierNames: ['Monin'], categorySlug: 'syrups', isActive: true },
  { name: 'Сироп лаванда',            slug: 'lavender-syrup',     unit: 'ml',  quantity: 500,   minQuantity: 200,  costPerUnit: 0.12,   supplierNames: ['Monin'], categorySlug: 'syrups', isActive: true },
  { name: 'Соус карамельний',         slug: 'caramel-sauce',      unit: 'ml',  quantity: 500,   minQuantity: 200,  costPerUnit: 0.10,   supplierNames: ['Monin'], categorySlug: 'syrups', isActive: true },

  // ── Топінги (3) ──
  { name: 'Шоколад темний',           slug: 'dark-chocolate',     unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.15,   supplierNames: ['Callebaut'], categorySlug: 'toppings', isActive: true },
  { name: 'Шоколад білий',            slug: 'white-chocolate',    unit: 'g',   quantity: 300,   minQuantity: 150,  costPerUnit: 0.18,   supplierNames: ['Callebaut'], categorySlug: 'toppings', isActive: true },
  { name: 'Вершки збиті (балон)',     slug: 'whipped-cream',      unit: 'ml',  quantity: 500,   minQuantity: 200,  costPerUnit: 0.10,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'toppings', isActive: true },

  // ── Фрукти та ягоди (7) ──
  { name: 'Банан',                     slug: 'banana',             unit: 'g',   quantity: 2000,  minQuantity: 500,  costPerUnit: 0.04,   supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },
  { name: 'Мікс лісових ягід (замор.)', slug: 'berry-mix',        unit: 'g',   quantity: 1500,  minQuantity: 500,  costPerUnit: 0.18,   supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },
  { name: 'Апельсин',                 slug: 'orange',             unit: 'pcs', quantity: 30,    minQuantity: 10,   costPerUnit: 18,     supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },
  { name: 'Яблуко',                   slug: 'apple',              unit: 'pcs', quantity: 30,    minQuantity: 10,   costPerUnit: 10,     supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },
  { name: 'Лимон',                    slug: 'lemon',              unit: 'pcs', quantity: 20,    minQuantity: 8,    costPerUnit: 15,     supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },
  { name: 'Лайм',                     slug: 'lime',               unit: 'pcs', quantity: 15,    minQuantity: 5,    costPerUnit: 20,     supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },
  { name: 'М\'ята свіжа',             slug: 'fresh-mint',         unit: 'g',   quantity: 200,   minQuantity: 80,   costPerUnit: 0.30,   supplierNames: ['Фреш Маркет'], categorySlug: 'fruits', isActive: true },

  // ── М'ясо та риба (6) ──
  { name: 'Куряче філе',              slug: 'chicken-breast',     unit: 'g',   quantity: 5000,  minQuantity: 2000, costPerUnit: 0.18,   supplierNames: ['М\'ясний Двір'], categorySlug: 'meat', isActive: true },
  { name: 'Яловичина (фарш)',         slug: 'beef-mince',         unit: 'g',   quantity: 3000,  minQuantity: 1000, costPerUnit: 0.28,   supplierNames: ['М\'ясний Двір'], categorySlug: 'meat', isActive: true },
  { name: 'Баранина (для донера)',     slug: 'lamb-doner',         unit: 'g',   quantity: 3000,  minQuantity: 1000, costPerUnit: 0.35,   supplierNames: ['М\'ясний Двір'], categorySlug: 'meat', isActive: true },
  { name: 'Креветки',                 slug: 'shrimp',             unit: 'g',   quantity: 1500,  minQuantity: 500,  costPerUnit: 0.55,   supplierNames: ['М\'ясний Двір'], categorySlug: 'meat', isActive: true },
  { name: 'Лосось слабосолений',      slug: 'smoked-salmon',      unit: 'g',   quantity: 1000,  minQuantity: 300,  costPerUnit: 0.85,   supplierNames: ['М\'ясний Двір'], categorySlug: 'meat', isActive: true },
  { name: 'Тунець (консервований)',    slug: 'canned-tuna',        unit: 'g',   quantity: 1000,  minQuantity: 300,  costPerUnit: 0.35,   supplierNames: ['Фреш Маркет'], categorySlug: 'meat', isActive: true },

  // ── Овочі та зелень (14) ──
  { name: 'Помідор',                   slug: 'tomato',             unit: 'g',   quantity: 3000,  minQuantity: 1000, costPerUnit: 0.06,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Огірок',                    slug: 'cucumber',           unit: 'g',   quantity: 2000,  minQuantity: 800,  costPerUnit: 0.05,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Цибуля червона',           slug: 'red-onion',          unit: 'g',   quantity: 2000,  minQuantity: 500,  costPerUnit: 0.03,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Салат айсберг',            slug: 'iceberg-lettuce',    unit: 'g',   quantity: 1500,  minQuantity: 500,  costPerUnit: 0.08,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Капуста пекінська',        slug: 'napa-cabbage',       unit: 'g',   quantity: 2000,  minQuantity: 500,  costPerUnit: 0.05,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Перець болгарський',       slug: 'bell-pepper',        unit: 'g',   quantity: 1500,  minQuantity: 500,  costPerUnit: 0.10,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Халапеньо',                slug: 'jalapeno',           unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.20,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Кінза',                    slug: 'cilantro',           unit: 'g',   quantity: 300,   minQuantity: 100,  costPerUnit: 0.25,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Петрушка',                 slug: 'parsley',            unit: 'g',   quantity: 300,   minQuantity: 100,  costPerUnit: 0.20,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Руколa',                   slug: 'arugula',            unit: 'g',   quantity: 300,   minQuantity: 100,  costPerUnit: 0.15,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Базилік свіжий',           slug: 'fresh-basil',        unit: 'g',   quantity: 200,   minQuantity: 80,   costPerUnit: 0.35,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Авокадо',                  slug: 'avocado',            unit: 'g',   quantity: 4000,  minQuantity: 1600, costPerUnit: 0.225,  supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Гриби шампіньйони',       slug: 'mushrooms',          unit: 'g',   quantity: 1500,  minQuantity: 500,  costPerUnit: 0.08,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },
  { name: 'Мікрогрін',                slug: 'microgreens',        unit: 'g',   quantity: 200,   minQuantity: 80,   costPerUnit: 0.50,   supplierNames: ['Фреш Маркет'], categorySlug: 'vegetables', isActive: true },

  // ── Хліб та тісто (7) ──
  { name: 'Лаваш тонкий',            slug: 'lavash',             unit: 'pcs', quantity: 50,    minQuantity: 20,   costPerUnit: 12,     supplierNames: ['Пекарня «Добра»'], categorySlug: 'bread', isActive: true },
  { name: 'Піта',                     slug: 'pita',               unit: 'pcs', quantity: 40,    minQuantity: 15,   costPerUnit: 15,     supplierNames: ['Пекарня «Добра»'], categorySlug: 'bread', isActive: true },
  { name: 'Тортилья пшенична',       slug: 'tortilla',           unit: 'pcs', quantity: 40,    minQuantity: 15,   costPerUnit: 14,     supplierNames: ['Пекарня «Добра»'], categorySlug: 'bread', isActive: true },
  { name: 'Хліб для сендвіча',       slug: 'sandwich-bread',     unit: 'pcs', quantity: 40,    minQuantity: 15,   costPerUnit: 8,      supplierNames: ['Пекарня «Добра»'], categorySlug: 'bread', isActive: true },
  { name: 'Хліб тостовий (скибка)',  slug: 'toast-bread',        unit: 'pcs', quantity: 60,    minQuantity: 20,   costPerUnit: 5,      supplierNames: ['Пекарня «Добра»'], categorySlug: 'bread', isActive: true },
  { name: 'Начос (чіпси)',           slug: 'nachos-chips',       unit: 'g',   quantity: 2000,  minQuantity: 500,  costPerUnit: 0.12,   supplierNames: ['Фреш Маркет'], categorySlug: 'bread', isActive: true },
  { name: 'Сухарики (крутони)',      slug: 'croutons',           unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.06,   supplierNames: ['Пекарня «Добра»'], categorySlug: 'bread', isActive: true },

  // ── Соуси (10) ──
  { name: 'Соус часниковий',          slug: 'garlic-sauce',       unit: 'ml',  quantity: 2000,  minQuantity: 500,  costPerUnit: 0.06,   supplierNames: ['Monin'], categorySlug: 'sauces', isActive: true },
  { name: 'Соус гострий (чілі)',     slug: 'chili-sauce',        unit: 'ml',  quantity: 1500,  minQuantity: 500,  costPerUnit: 0.08,   supplierNames: ['Monin'], categorySlug: 'sauces', isActive: true },
  { name: 'Тахіні',                   slug: 'tahini',             unit: 'ml',  quantity: 1000,  minQuantity: 300,  costPerUnit: 0.14,   supplierNames: ['Фреш Маркет'], categorySlug: 'sauces', isActive: true },
  { name: 'Сальса',                   slug: 'salsa',              unit: 'ml',  quantity: 1000,  minQuantity: 300,  costPerUnit: 0.10,   supplierNames: ['Фреш Маркет'], categorySlug: 'sauces', isActive: true },
  { name: 'Гуакамоле',               slug: 'guacamole',          unit: 'g',   quantity: 800,   minQuantity: 300,  costPerUnit: 0.18,   supplierNames: ['Фреш Маркет'], categorySlug: 'sauces', isActive: true },
  { name: 'Сметана',                  slug: 'sour-cream',         unit: 'ml',  quantity: 2000,  minQuantity: 500,  costPerUnit: 0.04,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'sauces', isActive: true },
  { name: 'Сир фета',                slug: 'feta-cheese',        unit: 'g',   quantity: 1000,  minQuantity: 300,  costPerUnit: 0.22,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'sauces', isActive: true },
  { name: 'Соус песто',              slug: 'pesto',              unit: 'ml',  quantity: 500,   minQuantity: 150,  costPerUnit: 0.20,   supplierNames: ['Фреш Маркет'], categorySlug: 'sauces', isActive: true },
  { name: 'Оцет бальзамічний',      slug: 'balsamic',           unit: 'ml',  quantity: 500,   minQuantity: 150,  costPerUnit: 0.15,   supplierNames: ['Фреш Маркет'], categorySlug: 'sauces', isActive: true },
  { name: 'Соус Цезар',             slug: 'caesar-dressing',    unit: 'ml',  quantity: 1000,  minQuantity: 300,  costPerUnit: 0.12,   supplierNames: ['Фреш Маркет'], categorySlug: 'sauces', isActive: true },

  // ── Упаковка (5) ──
  { name: 'Стакан паперовий 250мл',  slug: 'cup-250',            unit: 'pcs', quantity: 200,   minQuantity: 100,  costPerUnit: 2.50,   supplierNames: ['Пакувальник'], categorySlug: 'packaging', isActive: true },
  { name: 'Стакан паперовий 350мл',  slug: 'cup-350',            unit: 'pcs', quantity: 200,   minQuantity: 100,  costPerUnit: 3.00,   supplierNames: ['Пакувальник'], categorySlug: 'packaging', isActive: true },
  { name: 'Стакан паперовий 450мл',  slug: 'cup-450',            unit: 'pcs', quantity: 150,   minQuantity: 100,  costPerUnit: 3.50,   supplierNames: ['Пакувальник'], categorySlug: 'packaging', isActive: true },
  { name: 'Кришка для стакану',      slug: 'cup-lid',            unit: 'pcs', quantity: 500,   minQuantity: 200,  costPerUnit: 0.80,   supplierNames: ['Пакувальник'], categorySlug: 'packaging', isActive: true },
  { name: 'Трубочка паперова',       slug: 'paper-straw',        unit: 'pcs', quantity: 300,   minQuantity: 150,  costPerUnit: 0.50,   supplierNames: ['Пакувальник'], categorySlug: 'packaging', isActive: true },

  // ── Напої в пляшках (6) ──
  { name: 'Pepsi 0.5л (пляшка)',     slug: 'pepsi-bottle',       unit: 'pcs', quantity: 24,    minQuantity: 12,   costPerUnit: 22,     supplierNames: ['PepsiCo Україна'], categorySlug: 'packaging', isActive: true },
  { name: 'Pepsi Max 0.5л (пляшка)', slug: 'pepsi-max-bottle',   unit: 'pcs', quantity: 24,    minQuantity: 12,   costPerUnit: 22,     supplierNames: ['PepsiCo Україна'], categorySlug: 'packaging', isActive: true },
  { name: '7UP 0.5л (пляшка)',       slug: '7up-bottle',         unit: 'pcs', quantity: 24,    minQuantity: 12,   costPerUnit: 22,     supplierNames: ['PepsiCo Україна'], categorySlug: 'packaging', isActive: true },
  { name: 'Lipton Ice Tea 0.5л',     slug: 'lipton-bottle',      unit: 'pcs', quantity: 24,    minQuantity: 12,   costPerUnit: 20,     supplierNames: ['PepsiCo Україна'], categorySlug: 'packaging', isActive: true },
  { name: 'Моршинська 0.5л (негаз.)', slug: 'water-still-bottle', unit: 'pcs', quantity: 48,   minQuantity: 24,   costPerUnit: 12,     supplierNames: ['Фреш Маркет'], categorySlug: 'packaging', isActive: true },
  { name: 'Моршинська 0.5л (газ.)',  slug: 'water-sparkling-bottle', unit: 'pcs', quantity: 48, minQuantity: 24,  costPerUnit: 12,     supplierNames: ['Фреш Маркет'], categorySlug: 'packaging', isActive: true },

  // ── Морозиво (3) ──
  { name: 'Морозиво ванільне (порц.)', slug: 'ice-cream-vanilla',  unit: 'g',  quantity: 3000,  minQuantity: 1000, costPerUnit: 0.12,   supplierNames: ['Солодкий Дім'], categorySlug: 'dairy', isActive: true },
  { name: 'Морозиво шоколадне (порц.)', slug: 'ice-cream-chocolate', unit: 'g', quantity: 2000,  minQuantity: 800,  costPerUnit: 0.14,   supplierNames: ['Солодкий Дім'], categorySlug: 'dairy', isActive: true },
  { name: 'Морозиво фісташкове (порц.)', slug: 'ice-cream-pistachio', unit: 'g', quantity: 1500, minQuantity: 500, costPerUnit: 0.22,   supplierNames: ['Солодкий Дім'], categorySlug: 'dairy', isActive: true },

  // ── Інше (12) ──
  { name: 'Цукор',                    slug: 'sugar',              unit: 'g',   quantity: 5000,  minQuantity: 2000, costPerUnit: 0.02,   categorySlug: 'other', isActive: true },
  { name: 'Цукор тростинний',        slug: 'brown-sugar',        unit: 'g',   quantity: 2000,  minQuantity: 1000, costPerUnit: 0.04,   categorySlug: 'other', isActive: true },
  { name: 'Лід',                      slug: 'ice',                unit: 'g',   quantity: 10000, minQuantity: 3000, costPerUnit: 0.005,  categorySlug: 'other', isActive: true },
  { name: 'Маршмелоу',               slug: 'marshmallow',        unit: 'g',   quantity: 500,   minQuantity: 200,  costPerUnit: 0.12,   supplierNames: ['Солодкий Дім'], categorySlug: 'other', isActive: true },
  { name: 'Кокосова стружка',        slug: 'coconut-flakes',     unit: 'g',   quantity: 300,   minQuantity: 100,  costPerUnit: 0.15,   categorySlug: 'other', isActive: true },
  { name: 'Содова (вода)',            slug: 'soda-water',         unit: 'ml',  quantity: 5000,  minQuantity: 2000, costPerUnit: 0.01,   categorySlug: 'other', isActive: true },
  { name: 'Фалафель (заготовки)',    slug: 'falafel-balls',      unit: 'pcs', quantity: 100,   minQuantity: 30,   costPerUnit: 5,      supplierNames: ['Фреш Маркет'], categorySlug: 'other', isActive: true },
  { name: 'Яйця',                    slug: 'eggs',               unit: 'pcs', quantity: 60,    minQuantity: 20,   costPerUnit: 5.50,   supplierNames: ['Фреш Маркет'], categorySlug: 'other', isActive: true },
  { name: 'Рис',                      slug: 'rice',               unit: 'g',   quantity: 5000,  minQuantity: 1000, costPerUnit: 0.025,  categorySlug: 'other', isActive: true },
  { name: 'Гранола (домашня)',        slug: 'granola',            unit: 'g',   quantity: 2000,  minQuantity: 500,  costPerUnit: 0.08,   categorySlug: 'other', isActive: true },
  { name: 'Йогурт натуральний',      slug: 'yogurt',             unit: 'ml',  quantity: 3000,  minQuantity: 1000, costPerUnit: 0.05,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'other', isActive: true },
  { name: 'Сир твердий',             slug: 'hard-cheese',        unit: 'g',   quantity: 1000,  minQuantity: 300,  costPerUnit: 0.25,   supplierNames: ['Молочна Ферма «Зоря»'], categorySlug: 'other', isActive: true },
  { name: 'Едамаме (заморожені)',    slug: 'edamame',            unit: 'g',   quantity: 1000,  minQuantity: 300,  costPerUnit: 0.15,   supplierNames: ['Фреш Маркет'], categorySlug: 'other', isActive: true },
  { name: 'Соус понзу',             slug: 'ponzu',              unit: 'ml',  quantity: 500,   minQuantity: 150,  costPerUnit: 0.18,   supplierNames: ['Фреш Маркет'], categorySlug: 'other', isActive: true },
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
// RECIPES (68)
//
// costPrice = SUM(ingredient.costPerUnit × amount) — verified by audit script.
// Lifecycle hook recalculates on save, but seed values match.
// Pre-made pastries (11 items) intentionally have NO recipe.
// ============================================

export interface SeedRecipeIngredient {
  ingredientSlug: string;
  amount: number;
}

export interface SeedRecipe {
  productSlug: string;
  variantId: string;
  variantName: string;
  variantDescription?: string;
  price: number;
  costPrice: number;
  isDefault: boolean;
  ingredients: SeedRecipeIngredient[];
}

export const recipes: SeedRecipe[] = [
  // ═══ КАВА ═══

  // Espresso — 18g/36g beans
  { productSlug: 'espresso', variantId: 'single', variantName: 'Сінгл', price: 45, costPrice: 15.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }] },
  { productSlug: 'espresso', variantId: 'double', variantName: 'Допіо', price: 65, costPrice: 30.60, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }] },

  // Doppio — standalone double (no cup, ceramic)
  { productSlug: 'doppio', variantId: 'standard', variantName: 'Стандарт', price: 65, costPrice: 30.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }] },

  // Americano — 18g/24g beans + water + cup
  { productSlug: 'americano', variantId: 's', variantName: 'S', variantDescription: '250 мл', price: 55, costPrice: 18.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cup-250', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'americano', variantId: 'm', variantName: 'M', variantDescription: '350 мл', price: 65, costPrice: 19.10, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'americano', variantId: 'l', variantName: 'L', variantDescription: '450 мл', price: 75, costPrice: 24.70, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 24 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Cappuccino
  { productSlug: 'cappuccino', variantId: 's', variantName: 'S', variantDescription: '250 мл', price: 65, costPrice: 24.36, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 180 }, { ingredientSlug: 'cup-250', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'cappuccino', variantId: 'm', variantName: 'M', variantDescription: '350 мл', price: 75, costPrice: 28.06, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 280 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'cappuccino', variantId: 'l', variantName: 'L', variantDescription: '450 мл', price: 85, costPrice: 36.86, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 24 }, { ingredientSlug: 'milk-2-5', amount: 380 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Latte
  { productSlug: 'latte', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 70, costPrice: 27.10, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'latte', variantId: 'm', variantName: 'M', variantDescription: '400 мл', price: 85, costPrice: 30.80, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'latte', variantId: 'l', variantName: 'L', variantDescription: '500 мл', price: 95, costPrice: 39.10, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 24 }, { ingredientSlug: 'milk-2-5', amount: 450 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Flat White — double shot, less milk
  { productSlug: 'flat-white', variantId: 'standard', variantName: 'Стандарт', variantDescription: '250 мл', price: 75, costPrice: 38.70, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'milk-2-5', amount: 150 }, { ingredientSlug: 'cup-250', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Cortado — espresso + splash of milk (ceramic, no cup)
  { productSlug: 'cortado', variantId: 'standard', variantName: 'Стандарт', price: 60, costPrice: 17.22, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 60 }] },

  // Raf — cream-based
  { productSlug: 'raf', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 85, costPrice: 44.70, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cream-33', amount: 200 }, { ingredientSlug: 'vanilla-syrup', amount: 20 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'raf', variantId: 'm', variantName: 'M', variantDescription: '400 мл', price: 100, costPrice: 58.00, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cream-33', amount: 300 }, { ingredientSlug: 'vanilla-syrup', amount: 30 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Mocha — coffee + chocolate + milk + whipped cream
  { productSlug: 'mocha', variantId: 'standard', variantName: 'Стандарт', variantDescription: '350 мл', price: 80, costPrice: 31.50, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 200 }, { ingredientSlug: 'dark-chocolate', amount: 20 }, { ingredientSlug: 'whipped-cream', amount: 30 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Iced Latte — double shot + cold milk + ice
  { productSlug: 'iced-latte', variantId: 'm', variantName: 'M', variantDescription: '400 мл', price: 75, costPrice: 43.90, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
  { productSlug: 'iced-latte', variantId: 'l', variantName: 'L', variantDescription: '500 мл', price: 90, costPrice: 47.35, isDefault: false,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'ice', amount: 150 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // ═══ АВТОРСЬКІ НАПОЇ ═══

  // Lavender Latte
  { productSlug: 'lavender-latte', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 95, costPrice: 29.50, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'lavender-syrup', amount: 20 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Bumble — espresso + OJ + ice
  { productSlug: 'bumble', variantId: 'standard', variantName: 'Стандарт', variantDescription: '400 мл', price: 90, costPrice: 56.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'orange', amount: 2 }, { ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Caramel Macchiato
  { productSlug: 'caramel-macchiato', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 95, costPrice: 29.80, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'vanilla-syrup', amount: 15 }, { ingredientSlug: 'caramel-sauce', amount: 15 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Coconut Latte
  { productSlug: 'coconut-latte', variantId: 'standard', variantName: 'Стандарт', variantDescription: '350 мл', price: 90, costPrice: 50.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'coconut-milk', amount: 250 }, { ingredientSlug: 'coconut-flakes', amount: 10 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Banana Raf
  { productSlug: 'banana-raf', variantId: 's', variantName: 'S', variantDescription: '350 мл', price: 95, costPrice: 47.80, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 18 }, { ingredientSlug: 'cream-33', amount: 200 }, { ingredientSlug: 'banana', amount: 80 }, { ingredientSlug: 'caramel-sauce', amount: 15 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Freddo Espresso — double shot shaken with ice
  { productSlug: 'freddo-espresso', variantId: 'standard', variantName: 'Стандарт', variantDescription: '350 мл', price: 85, costPrice: 35.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'arabica-beans', amount: 36 }, { ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // ═══ ЧАЙ ═══

  // Black Tea
  { productSlug: 'black-tea', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 40, costPrice: 5.15, isDefault: true,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'black-tea', variantId: 'l', variantName: 'L', variantDescription: '500 мл', price: 55, costPrice: 6.55, isDefault: false,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 5 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Green Tea
  { productSlug: 'green-tea', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 45, costPrice: 5.45, isDefault: true,
    ingredients: [{ ingredientSlug: 'green-tea', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Matcha Latte
  { productSlug: 'matcha-latte', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 85, costPrice: 19.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'matcha', amount: 3 }, { ingredientSlug: 'milk-2-5', amount: 250 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },
  { productSlug: 'matcha-latte', variantId: 'm', variantName: 'M', variantDescription: '400 мл', price: 100, costPrice: 25.50, isDefault: false,
    ingredients: [{ ingredientSlug: 'matcha', amount: 4 }, { ingredientSlug: 'milk-2-5', amount: 350 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Herbal Tea
  { productSlug: 'herbal-tea', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 45, costPrice: 6.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'herbal-tea-mix', amount: 4 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // Chai Latte
  { productSlug: 'chai-latte', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 80, costPrice: 12.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'black-tea', amount: 4 }, { ingredientSlug: 'milk-2-5', amount: 200 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }] },

  // ═══ ХОЛОДНІ НАПОЇ ═══

  // Lemonade — lemon + mint + sugar + ice
  { productSlug: 'lemonade', variantId: 's', variantName: 'S', variantDescription: '300 мл', price: 55, costPrice: 21.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'lemon', amount: 1 }, { ingredientSlug: 'fresh-mint', amount: 5 }, { ingredientSlug: 'sugar', amount: 15 }, { ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },
  { productSlug: 'lemonade', variantId: 'l', variantName: 'L', variantDescription: '500 мл', price: 75, costPrice: 23.35, isDefault: false,
    ingredients: [{ ingredientSlug: 'lemon', amount: 1 }, { ingredientSlug: 'fresh-mint', amount: 8 }, { ingredientSlug: 'sugar', amount: 20 }, { ingredientSlug: 'ice', amount: 150 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Orange Fresh — 2 oranges → ~250ml juice
  { productSlug: 'orange-fresh', variantId: 'standard', variantName: 'Стандарт', variantDescription: '250 мл', price: 85, costPrice: 40.80, isDefault: true,
    ingredients: [{ ingredientSlug: 'orange', amount: 2 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Apple Fresh — 3 apples → ~250ml juice
  { productSlug: 'apple-fresh', variantId: 'standard', variantName: 'Стандарт', variantDescription: '250 мл', price: 75, costPrice: 34.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'apple', amount: 3 }, { ingredientSlug: 'cup-350', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Virgin Mojito — lime + mint + soda + ice
  { productSlug: 'virgin-mojito', variantId: 'standard', variantName: 'Стандарт', variantDescription: '400 мл', price: 75, costPrice: 29.80, isDefault: true,
    ingredients: [{ ingredientSlug: 'lime', amount: 1 }, { ingredientSlug: 'fresh-mint', amount: 10 }, { ingredientSlug: 'soda-water', amount: 150 }, { ingredientSlug: 'sugar', amount: 10 }, { ingredientSlug: 'ice', amount: 100 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // Berry Smoothie
  { productSlug: 'berry-smoothie', variantId: 'standard', variantName: 'Стандарт', variantDescription: '400 мл', price: 85, costPrice: 30.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'berry-mix', amount: 100 }, { ingredientSlug: 'banana', amount: 60 }, { ingredientSlug: 'milk-2-5', amount: 150 }, { ingredientSlug: 'ice', amount: 80 }, { ingredientSlug: 'cup-450', amount: 1 }, { ingredientSlug: 'cup-lid', amount: 1 }, { ingredientSlug: 'paper-straw', amount: 1 }] },

  // ═══ НАПОЇ З ХОЛОДИЛЬНИКА ═══

  { productSlug: 'pepsi-500', variantId: 'standard', variantName: '0.5л', price: 45, costPrice: 22.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'pepsi-bottle', amount: 1 }] },
  { productSlug: 'pepsi-max-500', variantId: 'standard', variantName: '0.5л', price: 45, costPrice: 22.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'pepsi-max-bottle', amount: 1 }] },
  { productSlug: '7up-500', variantId: 'standard', variantName: '0.5л', price: 45, costPrice: 22.00, isDefault: true,
    ingredients: [{ ingredientSlug: '7up-bottle', amount: 1 }] },
  { productSlug: 'lipton-ice-tea', variantId: 'standard', variantName: '0.5л', price: 45, costPrice: 20.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'lipton-bottle', amount: 1 }] },
  { productSlug: 'mineral-water', variantId: 'standard', variantName: '0.5л', price: 30, costPrice: 12.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'water-still-bottle', amount: 1 }] },
  { productSlug: 'sparkling-water', variantId: 'standard', variantName: '0.5л', price: 30, costPrice: 12.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'water-sparkling-bottle', amount: 1 }] },

  // ═══ МОРОЗИВО ═══

  { productSlug: 'vanilla-ice-cream', variantId: 'standard', variantName: '2 кульки', variantDescription: '150 г', price: 65, costPrice: 18.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'ice-cream-vanilla', amount: 150 }] },
  { productSlug: 'chocolate-ice-cream', variantId: 'standard', variantName: '2 кульки', variantDescription: '150 г', price: 70, costPrice: 21.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'ice-cream-chocolate', amount: 150 }] },
  { productSlug: 'pistachio-ice-cream', variantId: 'standard', variantName: '2 кульки', variantDescription: '150 г', price: 80, costPrice: 33.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'ice-cream-pistachio', amount: 150 }] },
  { productSlug: 'affogato', variantId: 'standard', variantName: 'Стандарт', price: 95, costPrice: 27.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'ice-cream-vanilla', amount: 100 }, { ingredientSlug: 'arabica-beans', amount: 18 }] },

  // ═══ СЕНДВІЧІ та САЛАТИ ═══

  // Chicken Sandwich — bread + chicken + arugula + pesto + tomato
  { productSlug: 'chicken-sandwich', variantId: 'standard', variantName: 'Стандарт', price: 120, costPrice: 38.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'sandwich-bread', amount: 1 }, { ingredientSlug: 'chicken-breast', amount: 120 }, { ingredientSlug: 'arugula', amount: 20 }, { ingredientSlug: 'pesto', amount: 20 }, { ingredientSlug: 'tomato', amount: 30 }] },

  // Salmon Sandwich — bread + salmon + cream cheese + arugula + cucumber
  { productSlug: 'salmon-sandwich', variantId: 'standard', variantName: 'Стандарт', price: 145, costPrice: 65.85, isDefault: true,
    ingredients: [{ ingredientSlug: 'sandwich-bread', amount: 1 }, { ingredientSlug: 'smoked-salmon', amount: 60 }, { ingredientSlug: 'cream-cheese', amount: 30 }, { ingredientSlug: 'arugula', amount: 15 }, { ingredientSlug: 'cucumber', amount: 20 }] },

  // Caprese Sandwich — bread + mozzarella + tomato + basil + balsamic + pesto
  { productSlug: 'caprese-sandwich', variantId: 'standard', variantName: 'Стандарт', price: 115, costPrice: 33.85, isDefault: true,
    ingredients: [{ ingredientSlug: 'sandwich-bread', amount: 1 }, { ingredientSlug: 'mozzarella', amount: 80 }, { ingredientSlug: 'tomato', amount: 60 }, { ingredientSlug: 'fresh-basil', amount: 5 }, { ingredientSlug: 'balsamic', amount: 10 }, { ingredientSlug: 'pesto', amount: 15 }] },

  // Caesar Salad — lettuce + chicken + parmesan + croutons + caesar dressing
  { productSlug: 'caesar-salad', variantId: 'standard', variantName: 'Стандарт', price: 135, costPrice: 43.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'iceberg-lettuce', amount: 100 }, { ingredientSlug: 'chicken-breast', amount: 120 }, { ingredientSlug: 'parmesan', amount: 20 }, { ingredientSlug: 'croutons', amount: 20 }, { ingredientSlug: 'caesar-dressing', amount: 30 }] },

  // Tuna Bowl — rice + tuna + avocado + edamame + ponzu
  { productSlug: 'tuna-bowl', variantId: 'standard', variantName: 'Стандарт', price: 155, costPrice: 53.60, isDefault: true,
    ingredients: [{ ingredientSlug: 'rice', amount: 100 }, { ingredientSlug: 'canned-tuna', amount: 80 }, { ingredientSlug: 'avocado', amount: 60 }, { ingredientSlug: 'edamame', amount: 40 }, { ingredientSlug: 'ponzu', amount: 20 }] },

  // ═══ СНІДАНКИ ═══

  // Avocado Toast — toast + avocado + egg + microgreens
  { productSlug: 'avocado-toast', variantId: 'standard', variantName: 'Стандарт', price: 125, costPrice: 26.50, isDefault: true,
    ingredients: [{ ingredientSlug: 'toast-bread', amount: 2 }, { ingredientSlug: 'avocado', amount: 80 }, { ingredientSlug: 'eggs', amount: 1 }, { ingredientSlug: 'microgreens', amount: 5 }] },

  // Granola Bowl — granola + yogurt + banana + berries
  { productSlug: 'granola-bowl', variantId: 'standard', variantName: 'Стандарт', price: 95, costPrice: 21.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'granola', amount: 80 }, { ingredientSlug: 'yogurt', amount: 150 }, { ingredientSlug: 'banana', amount: 50 }, { ingredientSlug: 'berry-mix', amount: 30 }] },

  // Syrnyky — cottage cheese + egg + sour cream + berries + sugar
  { productSlug: 'syrnyky', variantId: 'standard', variantName: 'Стандарт', price: 110, costPrice: 26.50, isDefault: true,
    ingredients: [{ ingredientSlug: 'cottage-cheese', amount: 200 }, { ingredientSlug: 'eggs', amount: 1 }, { ingredientSlug: 'sour-cream', amount: 30 }, { ingredientSlug: 'berry-mix', amount: 30 }, { ingredientSlug: 'sugar', amount: 20 }] },

  // Veggie Omelette — eggs + mushrooms + bell pepper + cheese
  { productSlug: 'veggie-omelette', variantId: 'standard', variantName: 'Стандарт', price: 115, costPrice: 30.20, isDefault: true,
    ingredients: [{ ingredientSlug: 'eggs', amount: 3 }, { ingredientSlug: 'mushrooms', amount: 40 }, { ingredientSlug: 'bell-pepper', amount: 30 }, { ingredientSlug: 'hard-cheese', amount: 30 }] },

  // ═══ ШАУРМА та ДОНЕРИ ═══

  // Chicken Shawarma
  { productSlug: 'chicken-shawarma', variantId: 'standard', variantName: 'Стандарт', price: 135, costPrice: 48.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'chicken-breast', amount: 150 }, { ingredientSlug: 'lavash', amount: 1 }, { ingredientSlug: 'tomato', amount: 50 }, { ingredientSlug: 'cucumber', amount: 40 }, { ingredientSlug: 'napa-cabbage', amount: 40 }, { ingredientSlug: 'red-onion', amount: 20 }, { ingredientSlug: 'garlic-sauce', amount: 30 }] },
  { productSlug: 'chicken-shawarma', variantId: 'xl', variantName: 'XL', variantDescription: 'Подвійна порція м\'яса', price: 185, costPrice: 77.75, isDefault: false,
    ingredients: [{ ingredientSlug: 'chicken-breast', amount: 300 }, { ingredientSlug: 'lavash', amount: 1 }, { ingredientSlug: 'tomato', amount: 60 }, { ingredientSlug: 'cucumber', amount: 50 }, { ingredientSlug: 'napa-cabbage', amount: 50 }, { ingredientSlug: 'red-onion', amount: 25 }, { ingredientSlug: 'garlic-sauce', amount: 40 }] },

  // Beef Shawarma
  { productSlug: 'beef-shawarma', variantId: 'standard', variantName: 'Стандарт', price: 155, costPrice: 65.20, isDefault: true,
    ingredients: [{ ingredientSlug: 'beef-mince', amount: 150 }, { ingredientSlug: 'lavash', amount: 1 }, { ingredientSlug: 'tomato', amount: 50 }, { ingredientSlug: 'cucumber', amount: 40 }, { ingredientSlug: 'iceberg-lettuce', amount: 30 }, { ingredientSlug: 'red-onion', amount: 20 }, { ingredientSlug: 'chili-sauce', amount: 25 }, { ingredientSlug: 'garlic-sauce', amount: 20 }] },

  // Doner Kebab — lamb in pita
  { productSlug: 'doner-kebab', variantId: 'standard', variantName: 'Стандарт', price: 175, costPrice: 70.10, isDefault: true,
    ingredients: [{ ingredientSlug: 'lamb-doner', amount: 130 }, { ingredientSlug: 'pita', amount: 1 }, { ingredientSlug: 'tomato', amount: 50 }, { ingredientSlug: 'cucumber', amount: 30 }, { ingredientSlug: 'red-onion', amount: 20 }, { ingredientSlug: 'parsley', amount: 5 }, { ingredientSlug: 'tahini', amount: 25 }] },

  // Falafel Pita
  { productSlug: 'falafel-pita', variantId: 'standard', variantName: 'Стандарт', price: 125, costPrice: 51.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'falafel-balls', amount: 4 }, { ingredientSlug: 'pita', amount: 1 }, { ingredientSlug: 'tomato', amount: 40 }, { ingredientSlug: 'cucumber', amount: 40 }, { ingredientSlug: 'iceberg-lettuce', amount: 30 }, { ingredientSlug: 'tahini', amount: 25 }, { ingredientSlug: 'parsley', amount: 5 }] },

  // Shrimp Shawarma — premium
  { productSlug: 'shrimp-shawarma', variantId: 'standard', variantName: 'Стандарт', price: 195, costPrice: 77.10, isDefault: true,
    ingredients: [{ ingredientSlug: 'shrimp', amount: 80 }, { ingredientSlug: 'lavash', amount: 1 }, { ingredientSlug: 'avocado', amount: 60 }, { ingredientSlug: 'iceberg-lettuce', amount: 30 }, { ingredientSlug: 'tomato', amount: 40 }, { ingredientSlug: 'chili-sauce', amount: 20 }, { ingredientSlug: 'garlic-sauce', amount: 20 }] },

  // ═══ ТАКО та БУРІТО ═══

  // Chicken Taco (2 pcs)
  { productSlug: 'chicken-taco', variantId: 'standard', variantName: '2 шт', price: 125, costPrice: 56.30, isDefault: true,
    ingredients: [{ ingredientSlug: 'tortilla', amount: 2 }, { ingredientSlug: 'chicken-breast', amount: 120 }, { ingredientSlug: 'salsa', amount: 30 }, { ingredientSlug: 'jalapeno', amount: 10 }, { ingredientSlug: 'cilantro', amount: 5 }, { ingredientSlug: 'red-onion', amount: 15 }] },

  // Beef Taco (2 pcs)
  { productSlug: 'beef-taco', variantId: 'standard', variantName: '2 шт', price: 135, costPrice: 72.40, isDefault: true,
    ingredients: [{ ingredientSlug: 'tortilla', amount: 2 }, { ingredientSlug: 'beef-mince', amount: 120 }, { ingredientSlug: 'salsa', amount: 30 }, { ingredientSlug: 'guacamole', amount: 30 }, { ingredientSlug: 'sour-cream', amount: 20 }, { ingredientSlug: 'iceberg-lettuce', amount: 20 }] },

  // Nachos Supreme
  { productSlug: 'nachos-supreme', variantId: 'standard', variantName: 'Стандарт', price: 145, costPrice: 67.20, isDefault: true,
    ingredients: [{ ingredientSlug: 'nachos-chips', amount: 150 }, { ingredientSlug: 'beef-mince', amount: 100 }, { ingredientSlug: 'feta-cheese', amount: 40 }, { ingredientSlug: 'salsa', amount: 40 }, { ingredientSlug: 'guacamole', amount: 30 }, { ingredientSlug: 'sour-cream', amount: 25 }, { ingredientSlug: 'jalapeno', amount: 10 }] },

  // Chicken Burrito
  { productSlug: 'chicken-burrito', variantId: 'standard', variantName: 'Стандарт', price: 155, costPrice: 55.00, isDefault: true,
    ingredients: [{ ingredientSlug: 'tortilla', amount: 1 }, { ingredientSlug: 'chicken-breast', amount: 150 }, { ingredientSlug: 'salsa', amount: 30 }, { ingredientSlug: 'feta-cheese', amount: 30 }, { ingredientSlug: 'bell-pepper', amount: 30 }, { ingredientSlug: 'red-onion', amount: 20 }, { ingredientSlug: 'sour-cream', amount: 20 }] },
];
