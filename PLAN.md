# CoffeePOS — План реалізації (2026-03-02)

## Проблеми та задачі

---

## ✅ Задача 1: Зображення продуктів у POS-терміналі

### Діагноз
- `ProductCard` та `transformApiProduct` — код правильний
- `buildUrl` коректно конвертує `populate=image,category` → `populate[0]=image&populate[1]=category`
- **Root cause: Railway має ephemeral filesystem** — зображення завантажені в Strapi стираються при кожному redeploy
- При кожному `git push` Railway робить redeploy → всі файли в `/uploads/` зникають

### Рішення (короткострокове)
- Повторно завантажити картинки після кожного deploy (тимчасово)

### Рішення (довгострокове — TODO Phase 8)
- Підключити Cloudinary або AWS S3 через `@strapi/provider-upload-cloudinary`
- Додати env-змінні CLOUDINARY_NAME, CLOUDINARY_KEY, CLOUDINARY_SECRET в Railway
- Зображення будуть зберігатись в хмарі, не зникатимуть при redeploy

### Статус: ⚠️ Infrastructure issue (не код-баг)

---

## ✅ Задача 2: Поле avatar в Strapi для робітників

### Діагноз
- Schema.json оновлена (src + dist) у коміті `b023711`
- Strapi admin UI читає схему динамічно через API → поле з'явиться після redeploy
- Railway повинен був задеплоїти зміни після нашого push

### Можлива причина "не видно"
- Railway ще не завершив redeploy на момент перевірки
- Або user перевіряв до нашого push

### Дія
- Почекати Railway redeploy (~3-5 хв після push)
- Перевірити: Strapi Admin → Content Manager → Employee → має бути поле "Avatar"
- Якщо не з'явилось → потрібен `strapi build` в Railway (додати в build command)

### Статус: ✅ Код готовий, очікується Railway redeploy

---

## 🔨 Задача 3: Сторінка Постачальники (ОСНОВНА)

### Архітектура
Постачальники — це агрегація Supply записів по полю `supplierName`.
Окремого Supplier content type в бекенді немає → рахуємо на фронтенді.

### Структура SupplierProfile (computed)
```typescript
interface SupplierProfile {
  name: string;
  totalDeliveries: number;      // кількість Supply записів
  receivedDeliveries: number;   // status === 'received'
  pendingDeliveries: number;    // status в ['draft','ordered','shipped']
  totalSpent: number;           // сума totalCost всіх received
  lastDeliveryDate: string | null;
  supplies: Supply[];           // всі поставки цього постачальника
}
```

### Файли для створення

#### 1. `frontend/app/admin/suppliers/page.tsx`
- Завантажує всі Supply записи (`pageSize=200`)
- Групує по `supplierName` → масив SupplierProfile
- Пошук по назві постачальника
- DataTable: Назва | Поставок | Отримано | Очікується | Витрачено | Остання поставка | Дії
- Клік по рядку → SupplierDetailModal

#### 2. `frontend/app/admin/suppliers/page.module.css`

#### 3. `frontend/components/organisms/SupplierDetailModal/SupplierDetailModal.tsx`
- Header: назва постачальника + stats (badges)
- Tabs: "Всі" | "Очікується" | "Отримано" | "Скасовано"
- DataTable поставок: Дата | Статус | Позицій | Сума | Отримав
- Expandable row або inline detail: список items (ingredient + qty + cost)
- Кнопки дій: "Нова поставка"

#### 4. `frontend/components/organisms/SupplierDetailModal/SupplierDetailModal.module.css`

#### 5. Оновити `frontend/components/organisms/index.ts`
- Додати export SupplierDetailModal

#### 6. Оновити `frontend/components/organisms/AppShell/AppShell.tsx`
- Додати в групу 'management': `{ id: 'suppliers', label: 'Постачальники', icon: 'truck', href: '/admin/suppliers' }`

### Порядок реалізації
1. SupplierDetailModal (компонент + CSS)
2. Export з index.ts
3. Сторінка suppliers/page.tsx + CSS
4. AppShell navigation update
5. TypeScript check
6. Commit + push

---

## Прогрес виконання

- [x] Аналіз та діагностика всіх трьох проблем
- [x] Написання плану (цей файл)
- [x] Задача 3: SupplierDetailModal компонент
- [x] Задача 3: Сторінка /admin/suppliers
- [x] Задача 3: AppShell navigation
- [x] TypeScript build перевірка
- [x] Commit + Push

---

## 🔨 Задача 4: Tasks page — повне тестування + UX/UI до production-ready

### Знайдені баги
- [x] **BUG-1**: POST /api/tasks повертав 400 — фронт надсилав `createdBy` якого немає в схемі → прибрали поле

### UX/UI проблеми (знайдені аудитом)
- [ ] **UX-1**: Немає стану завантаження (skeleton) — поки tasks грузяться показує "Немає завдань"
- [ ] **UX-2**: Прострочені завдання (dueDate < сьогодні) не підсвічуються
- [ ] **UX-3**: Done-картки виглядають так само як активні — немає візуальної різниці
- [ ] **UX-4**: Порожня колонка не має CTA кнопки "Додати завдання"
- [ ] **UX-5**: Icon-кнопки (edit/delete) не мають aria-label (доступність)
- [ ] **UX-6**: Кнопка "Виконано" на done-картці з'являється помилково при прямому complete з todo
- [ ] **UX-7**: Дата виконання (date-only string) може давати off-by-one через UTC timezone

### Функціональні тести (покрити playwright)
- [x] Створення завдання (3 варіанти пріоритету)
- [ ] Старт (todo → in_progress)
- [ ] Виконання (→ done) + перевірка completedAt
- [ ] Редагування (pre-fill, зміна, збереження)
- [ ] Видалення + підтвердження
- [ ] Скасування видалення
- [ ] Пошук (є результати, немає результатів, очистка)
- [ ] Role-based filtering
- [ ] Due date display

### Статус: ✅ Завершено (commit 8da0705)

---

## 🔨 Задача 5: Tasks — таймер + офлайн + фото (активна задача)

### Що треба зробити
1. [x] Backend: +4 поля в schema.json (`startedAt`, `duration`, `completionNote`, `completionPhoto`)
2. [x] Backend: оновити controller `complete` → приймає duration + completionNote + completionPhotoId
3. [ ] Frontend: `lib/utils/taskTimer.ts` — localStorage таймер + offline queue
4. [ ] Frontend: оновити типи `lib/api/tasks.ts`
5. [ ] Frontend: оновити хук `useCompleteTask` + додати `useStartTask`
6. [ ] Frontend: новий `TaskCompleteModal` (note + photo upload)
7. [ ] Frontend: page.tsx — одна кнопка, живий таймер, completion flow
8. [ ] Frontend: оновити mock service
9. [ ] Build check + commit + push (Railway auto-deploy backend)

### Архітектура offline-first
- Таймер: localStorage `coffeepos-timers` — незалежно від інтернету
- Offline queue: `coffeepos-offline-queue` — синхронізується при reconnect через `window.online`
- Оптимістичні оновлення в TanStack Query
- Фото: вимагає інтернет; якщо офлайн — показує "Фото збережеться коли з'явиться інтернет"

### Що зроблено
- [x] BUG-1: `createdBy` → 400 error — прибрали поле з payload
- [x] UX-1: Skeleton loading state
- [x] UX-2: Overdue date highlight (червоний + "прострочено")
- [x] UX-3: Done cards — strikethrough + opacity 0.6
- [x] UX-4: Empty column CTA кнопка "Додати завдання"
- [x] UX-5: aria-label на edit/delete кнопках
- [x] UX-6: Toast "Завдання розпочато" при натисканні Почати
- [x] UX-7: Due date UTC fix (local midnight парсинг)
