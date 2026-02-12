# ParadisePOS - План Радикального Покращення UI/UX

## Аналіз Проблем

### 1. Дублювання Навбарів (Критична проблема)

**Поточний стан:**
```
┌─────────────────────────────────────────────────────────────┐
│ SIDEBAR │ HEADER (AppShell): "Товари" | Notifications | User│  ← Навбар 1
├─────────┼───────────────────────────────────────────────────┤
│         │ PAGE HEADER: "Управління товарами" | [+Товар]     │  ← Навбар 2
│         ├───────────────────────────────────────────────────┤
│         │ Stats cards...                                     │
│         │ Filters/Tabs...                                    │
│         │ Table...                                           │
└─────────┴───────────────────────────────────────────────────┘
```

**Проблеми:**
- AppShell header показує "Товари" → Page header показує "Управління товарами" (дублювання)
- Sidebar вже має ім'я користувача + аватар → AppShell header знову показує ім'я
- Два рівні заголовків створюють візуальний шум

---

### 2. Непослідовність Компонентів

| Сторінка | SearchInput | CategoryTabs | Badge | Stats Cards | Typography |
|----------|-------------|--------------|-------|-------------|------------|
| Products | ❌ Кастомний `<input>` | ❌ Кастомні tabs | ✅ Частково | `padding="md"` | `h3` |
| Inventory | ✅ `SearchInput` molecule | ❌ Кастомні chips | ✅ `Badge` | `padding="lg"` | `h2` |
| Reports | N/A | ❌ Кастомні tabs | N/A | `padding="lg"` | `h3` |

---

### 3. Надлишкові Елементи Header

**В AppShell header:**
- `user.name` — ДУБЛЮЄТЬСЯ (вже є в Sidebar footer)
- `NotificationCenter` — ОК, але позиція має бути продумана
- Заголовок сторінки — ДУБЛЮЄТЬСЯ з page-level header

**Відсутнє:**
- Кнопка сповіщень (bell icon) як основний елемент
- Глобальний пошук (опціонально)
- Quick actions для поточної сторінки

---

### 4. Стилістичні Невідповідності

**Products page (`page.module.css`):**
- Власний `.searchBox` замість `SearchInput`
- Власні `.tab` стилі замість `CategoryTabs`
- Власні `.badge` стилі замість `Badge` atom

**Inventory page:**
- Власні `.filterChip` стилі (не використовує shared CategoryTabs)
- Непослідовні spacing tokens

**Reports page:**
- Власні `.periodTab` стилі
- Дублювання логіки filtering tabs

---

## План Радикальних Змін

### ЕТАП 1: Уніфікація Навігаційної Філософії

#### 1.1 Новий AppShell Header
```
┌──────────────────────────────────────────────────────────────────┐
│ [Menu Toggle] │ [Page Title] │ [Breadcrumb?] │    [🔔] [⚙️]     │
└──────────────────────────────────────────────────────────────────┘
```

**Зміни:**
- ❌ Прибрати `user.name` з header (вже є в Sidebar)
- ✅ Залишити NotificationCenter (bell icon)
- ✅ Додати Settings icon button
- ✅ Page Title залишається (але page-level header треба прибрати)

#### 1.2 Прибрати Page-Level Headers
Замість окремого `<header>` в кожній сторінці, використовувати:
- **Page Actions** інтегровані в AppShell header справа
- **Subtitles** під заголовком в AppShell (якщо потрібно)

**Приклад нової структури:**
```tsx
// AppShell.tsx - новий header
<header className={styles.header}>
  <div className={styles.headerLeft}>
    <Text variant="h4">{pageTitle}</Text>
    {pageSubtitle && <Text variant="bodySmall" color="secondary">{pageSubtitle}</Text>}
  </div>
  <div className={styles.headerCenter}>
    {/* Page-specific actions slot */}
    {pageActions}
  </div>
  <div className={styles.headerRight}>
    <IconButton icon="bell" onClick={...} />
    <IconButton icon="settings" onClick={...} />
  </div>
</header>
```

---

### ЕТАП 2: Створення Shared Page Components

#### 2.1 Новий Компонент: `PageHeader`
```tsx
// components/molecules/PageHeader/PageHeader.tsx
interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;  // Кнопки справа
  filters?: ReactNode;  // Tabs/filters під заголовком
}

export function PageHeader({ title, subtitle, actions, filters }: PageHeaderProps) {
  return (
    <div className={styles.pageHeader}>
      <div className={styles.titleRow}>
        <div className={styles.titleSection}>
          <Text variant="h4" weight="semibold">{title}</Text>
          {subtitle && <Text variant="bodySmall" color="secondary">{subtitle}</Text>}
        </div>
        {actions && <div className={styles.actions}>{actions}</div>}
      </div>
      {filters && <div className={styles.filters}>{filters}</div>}
    </div>
  );
}
```

#### 2.2 Новий Компонент: `FilterTabs` (Універсальні таби)
```tsx
// components/molecules/FilterTabs/FilterTabs.tsx
interface FilterTab {
  id: string;
  label: string;
  icon?: IconName;
  count?: number;
  variant?: 'default' | 'warning' | 'success';
}

interface FilterTabsProps {
  tabs: FilterTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  size?: 'sm' | 'md';
}
```
Замінить:
- `.tab` в Products
- `.filterChip` в Inventory
- `.periodTab` в Reports

#### 2.3 Новий Компонент: `StatsGrid`
```tsx
// components/molecules/StatsGrid/StatsGrid.tsx
interface StatCard {
  label: string;
  value: string | number;
  icon: IconName;
  iconColor?: 'accent' | 'success' | 'warning' | 'error' | 'info';
  trend?: { value: number; direction: 'up' | 'down' };
}

interface StatsGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
}
```

#### 2.4 Новий Компонент: `DataTable`
```tsx
// components/organisms/DataTable/DataTable.tsx
interface Column<T> {
  key: keyof T;
  header: string;
  render?: (item: T) => ReactNode;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  emptyState?: { icon: IconName; message: string };
  loading?: boolean;
}
```

---

### ЕТАП 3: Рефакторинг Сторінок

#### 3.1 Products Page (Товари)

**BEFORE:**
```tsx
<div className={styles.page}>
  <header className={styles.header}>           // ❌ Прибрати
    <Text variant="h3">Управління товарами</Text>
    <Button>Додати товар</Button>
  </header>
  <div className={styles.stats}>...</div>
  <div className={styles.toolbar}>
    <div className={styles.searchBox}>         // ❌ Замінити на SearchInput
      <input ... />
    </div>
    <div className={styles.tabs}>              // ❌ Замінити на FilterTabs
      <button>...</button>
    </div>
  </div>
  <GlassCard>
    <table>...</table>                         // ❌ Замінити на DataTable
  </GlassCard>
</div>
```

**AFTER:**
```tsx
<div className={styles.page}>
  <PageHeader
    title="Управління товарами"
    actions={<Button variant="primary"><Icon name="plus" />Додати товар</Button>}
  />
  <StatsGrid stats={[
    { label: 'Всього товарів', value: stats.total, icon: 'package', iconColor: 'accent' },
    { label: 'З рецептом', value: stats.recipe, icon: 'receipt', iconColor: 'info' },
    ...
  ]} />
  <div className={styles.toolbar}>
    <SearchInput value={search} onChange={setSearch} placeholder="Пошук товарів..." />
    <FilterTabs
      tabs={[{ id: 'all', label: 'Всі' }, ...categories.map(c => ({ id: c.slug, label: c.name }))]}
      activeTab={categoryFilter}
      onTabChange={setCategoryFilter}
    />
  </div>
  <DataTable
    columns={productColumns}
    data={filteredProducts}
    onRowClick={handleProductClick}
    emptyState={{ icon: 'package', message: 'Товарів не знайдено' }}
  />
</div>
```

#### 3.2 Inventory Page (Склад)

**Зміни:**
- Прибрати `<header>` з title/subtitle (перенести в AppShell)
- Замінити `.filterChip` на `FilterTabs`
- Використовувати `StatsGrid` для статистики
- Використовувати `DataTable` для таблиці

#### 3.3 Reports Page (Звіти)

**Зміни:**
- Прибрати `<header>` (заголовок в AppShell)
- Замінити `.periodTab` на `FilterTabs`
- Використовувати `StatsGrid`
- Використовувати `DataTable` для замовлень

---

### ЕТАП 4: Оновлення AppShell

#### 4.1 Нова Структура Header

```tsx
// AppShell.tsx
interface PageMeta {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

const pageMeta: Record<string, PageMeta> = {
  '/admin/products': {
    title: 'Товари',
    subtitle: 'Управління асортиментом',
    actions: <Button variant="primary" size="sm"><Icon name="plus" />Додати</Button>
  },
  '/admin/inventory': {
    title: 'Склад',
    subtitle: 'Управління інгредієнтами',
    actions: <Button variant="primary" size="sm"><Icon name="plus" />Додати</Button>
  },
  '/admin/reports': {
    title: 'Звіти',
    subtitle: 'Аналітика продажів',
    actions: null  // Filters замість actions
  },
};

// В рендері:
<header className={styles.header}>
  <div className={styles.headerLeft}>
    <Text variant="h4" weight="semibold">{meta.title}</Text>
    {meta.subtitle && (
      <Text variant="caption" color="secondary">{meta.subtitle}</Text>
    )}
  </div>
  <div className={styles.headerCenter}>
    {meta.actions}
  </div>
  <div className={styles.headerRight}>
    <NotificationCenter />
    {/* Прибрати user.name - він вже в sidebar */}
  </div>
</header>
```

#### 4.2 Прибрати Дублювання User Info

```diff
// AppShell.tsx
<header className={styles.header}>
  ...
  <div className={styles.headerRight}>
    <NotificationCenter position="right" />
-   <div className={styles.userInfo}>
-     <Text variant="labelSmall" color="secondary">{user.name}</Text>
-   </div>
  </div>
</header>
```

---

### ЕТАП 5: CSS Token Консистентність

#### 5.1 Стандартизація Spacing

**Правило:**
- Page padding: `var(--space-6)` (24px)
- Section gap: `var(--space-6)` (24px)
- Card padding: `var(--space-5)` (20px)
- Component gap: `var(--space-4)` (16px)
- Inner gap: `var(--space-3)` (12px)

#### 5.2 Стандартизація Typography

| Елемент | Variant | Weight |
|---------|---------|--------|
| Page Title | `h4` | `semibold` |
| Page Subtitle | `bodySmall` | `regular` |
| Section Title | `labelLarge` | `semibold` |
| Stat Value | `h3` | `semibold` |
| Stat Label | `caption` | `regular` |
| Table Header | `labelSmall` | `medium` |
| Table Cell | `bodySmall` | `regular` |

---

### ЕТАП 6: Responsive Design Уніфікація

#### 6.1 Breakpoint Strategy

```css
/* Unified responsive approach */
@media (max-width: 1200px) {
  /* Tablet: 2-column stats, full-width filters */
}

@media (max-width: 768px) {
  /* Mobile: 1-column stats, stacked layout */
  /* Hide non-essential table columns */
}

@media (max-width: 480px) {
  /* Small mobile: Minimal table, card-based view */
}
```

---

## Файли для Створення/Модифікації

### Нові Компоненти:
1. `components/molecules/PageHeader/PageHeader.tsx`
2. `components/molecules/PageHeader/PageHeader.module.css`
3. `components/molecules/FilterTabs/FilterTabs.tsx`
4. `components/molecules/FilterTabs/FilterTabs.module.css`
5. `components/molecules/StatsGrid/StatsGrid.tsx`
6. `components/molecules/StatsGrid/StatsGrid.module.css`
7. `components/organisms/DataTable/DataTable.tsx`
8. `components/organisms/DataTable/DataTable.module.css`

### Модифікація:
1. `components/organisms/AppShell/AppShell.tsx` - Новий header
2. `components/organisms/AppShell/AppShell.module.css` - Стилі header
3. `app/admin/products/page.tsx` - Рефакторинг
4. `app/admin/products/page.module.css` - Прибрати кастомні стилі
5. `app/admin/inventory/page.tsx` - Рефакторинг
6. `app/admin/inventory/page.module.css` - Прибрати кастомні стилі
7. `app/admin/reports/page.tsx` - Рефакторинг
8. `app/admin/reports/page.module.css` - Прибрати кастомні стилі
9. `components/index.ts` - Експорт нових компонентів

### Видалення (після рефакторингу):
- Кастомні `.searchBox` стилі (Products)
- Кастомні `.tab` стилі (Products)
- Кастомні `.filterChip` стилі (Inventory)
- Кастомні `.periodTab` стилі (Reports)

---

## Візуальний Результат

### BEFORE:
```
┌─────────┬────────────────────────────────────────────────┐
│ SIDEBAR │ [Товари]              [🔔] Олена Коваленко    │ ← AppShell Header
│         ├────────────────────────────────────────────────┤
│ [Каса]  │ Управління товарами              [+Товар]     │ ← Page Header (ДУБЛЮВАННЯ!)
│ [Замов] ├────────────────────────────────────────────────┤
│ [Столи] │ [📦 12] [📝 8] [🛒 4] [⚠️ 2]                    │
│         │ [🔍______] [Всі][Кава][Чай][Десерти]           │
│─────────│────────────────────────────────────────────────│
│ Упр:    │ Table...                                        │
│ [Товари]│                                                │
│ [Склад] │                                                │
│ [Звіти] │                                                │
└─────────┴────────────────────────────────────────────────┘
```

### AFTER:
```
┌─────────┬────────────────────────────────────────────────┐
│ SIDEBAR │ Товари                   [+Товар] [🔔] [⚙️]    │ ← Єдиний Header
│         │ Управління асортиментом                        │
│ [Каса]  ├────────────────────────────────────────────────┤
│ [Замов] │ [📦 12] [📝 8] [🛒 4] [⚠️ 2]                    │ ← StatsGrid
│ [Столи] ├────────────────────────────────────────────────┤
│         │ [🔍 Пошук...        ] [Всі][Кава][Чай][Десерти]│ ← FilterTabs
│─────────├────────────────────────────────────────────────┤
│ Упр:    │                                                │
│ [Товари]│ DataTable                                      │ ← DataTable
│ [Склад] │                                                │
│ [Звіти] │                                                │
│─────────│                                                │
│ 👤 User │                                                │
└─────────┴────────────────────────────────────────────────┘
```

---

## Checklist Імплементації

### Phase 1: Shared Components
- [ ] Створити `PageHeader` molecule
- [ ] Створити `FilterTabs` molecule
- [ ] Створити `StatsGrid` molecule
- [ ] Створити `DataTable` organism
- [ ] Оновити `components/index.ts` exports

### Phase 2: AppShell Refactor
- [ ] Оновити header структуру
- [ ] Прибрати user.name дублювання
- [ ] Додати page actions slot
- [ ] Додати settings button

### Phase 3: Page Refactors
- [ ] Products page: використати shared components
- [ ] Inventory page: використати shared components
- [ ] Reports page: використати shared components

### Phase 4: Cleanup
- [ ] Прибрати невикористані CSS стилі
- [ ] Прибрати дублюючий код
- [ ] Тестування responsive design
- [ ] Тестування accessibility

---

## Примітки

1. **Кнопка "Назад на POS"** - не знайдена в коді, можливо була видалена або в іншому місці

2. **Notification Center** - залишаємо, але позиціонуємо правильно як icon button

3. **User Info в Header** - видаляємо, бо дублює Sidebar footer

4. **Page-specific actions** - переносимо в AppShell header slot

5. **Typography** - уніфікуємо до `h4` для page titles

---

*Документ створено: 2026-02-06*
*Версія: 1.0*
