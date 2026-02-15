# ParadisePOS — Покроковий деплой

## Передумови

- GitHub репозиторій: `https://github.com/DesumovJP/CoffeePOS`
- Акаунти: [Railway](https://railway.app), [Vercel](https://vercel.com), [DigitalOcean](https://digitalocean.com)

---

## Крок 1: DigitalOcean Spaces (медіа-сховище)

Картинки зберігаються окремо від Railway, щоб не зникали при редеплої.

1. Зайти в DigitalOcean → **Spaces Object Storage** → **Create a Space**
2. Налаштування:
   - **Region**: `fra1` (Frankfurt) або найближчий
   - **Name**: `coffeepos-media`
   - **File Listing**: Restricted
3. Увімкнути **CDN** (Enable CDN) — запам'ятати CDN endpoint
4. Створити API Key:
   - **API** → **Spaces Keys** → **Generate New Key**
   - Зберегти `Access Key` та `Secret Key`

**Результат**: маєш 4 значення:
```
DO_SPACE_ACCESS_KEY=xxxxxxxxxx
DO_SPACE_SECRET_KEY=xxxxxxxxxx
DO_SPACE_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACE_BUCKET=coffeepos-media
DO_SPACE_CDN=https://coffeepos-media.fra1.cdn.digitaloceanspaces.com
```

---

## Крок 2: Railway (бекенд + PostgreSQL)

### 2.1 Створити проект

1. Зайти в [Railway](https://railway.app) → **New Project** → **Deploy from GitHub Repo**
2. Вибрати `DesumovJP/CoffeePOS`
3. Railway запропонує створити сервіс — налаштуємо далі

### 2.2 Додати PostgreSQL

1. В проекті натиснути **+ New** → **Database** → **Add PostgreSQL**
2. Railway автоматично створить `DATABASE_URL` — він буде доступний як змінна

### 2.3 Налаштувати бекенд-сервіс

1. Натиснути на сервіс (GitHub repo) → **Settings**:
   - **Root Directory**: `backend`
   - **Builder**: `Dockerfile` (він знайде `backend/Dockerfile` автоматично)
   - **Custom Start Command**: залишити порожнім (CMD в Dockerfile)

2. Перейти в **Variables** і додати:

```env
# Database (Railway підставить автоматично якщо прив'язати PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=false
DATABASE_POOL_MIN=0
DATABASE_POOL_MAX=5

# Server
HOST=0.0.0.0
PORT=1337
NODE_ENV=production
PUBLIC_URL=https://<ТВІЙ-ДОМЕН>.up.railway.app

# Security — згенерувати кожен окремо: openssl rand -base64 32
APP_KEYS=<key1>,<key2>
API_TOKEN_SALT=<згенерувати>
ADMIN_JWT_SECRET=<згенерувати>
TRANSFER_TOKEN_SALT=<згенерувати>
JWT_SECRET=<згенерувати>
ENCRYPTION_KEY=<згенерувати>

# Seed (ТІЛЬКИ при першому деплої!)
SEED_DATABASE=true

# CORS
FRONTEND_URL=https://<ТВІЙ-ДОМЕН>.vercel.app

# DigitalOcean Spaces (медіа)
DO_SPACE_ACCESS_KEY=<з кроку 1>
DO_SPACE_SECRET_KEY=<з кроку 1>
DO_SPACE_ENDPOINT=fra1.digitaloceanspaces.com
DO_SPACE_BUCKET=coffeepos-media
DO_SPACE_CDN=https://coffeepos-media.fra1.cdn.digitaloceanspaces.com
```

> **Генерація секретів** (виконати 6 разів):
> ```bash
> openssl rand -base64 32
> ```

3. Натиснути **Deploy** або зачекати автоматичний деплой

### 2.4 Перевірити бекенд

1. Відкрити `https://<домен>.up.railway.app/_health` — має повернути:
   ```json
   {"status":"ok","database":"connected","uptime":...}
   ```
2. Відкрити `https://<домен>.up.railway.app/admin` — Strapi Admin Panel
3. Створити свій адмін-акаунт (це окремий від API акаунт)

### 2.5 Вимкнути сідування

Після першого успішного деплою **обов'язково**:
1. Railway → Variables → змінити `SEED_DATABASE=false`
2. Це запобіжить повторному створенню тестових даних

---

## Крок 3: Vercel (фронтенд)

### 3.1 Імпортувати проект

1. Зайти в [Vercel](https://vercel.com) → **Add New** → **Project** → **Import Git Repository**
2. Вибрати `DesumovJP/CoffeePOS`
3. Налаштування:
   - **Root Directory**: `frontend`
   - **Framework Preset**: Next.js (визначить автоматично)
   - **Build Command**: `npm run build`
   - **Output Directory**: залишити за замовчуванням

### 3.2 Додати змінні оточення

В **Settings** → **Environment Variables**:

```env
NEXT_PUBLIC_API_URL=https://<ТВІЙ-RAILWAY-ДОМЕН>.up.railway.app
NEXT_PUBLIC_API_MODE=live
```

> **ВАЖЛИВО**: `NEXT_PUBLIC_API_MODE` має бути `live`, не `mock`!

### 3.3 Деплой

1. Натиснути **Deploy**
2. Vercel збілдить Next.js і видасть URL

### 3.4 Оновити CORS на бекенді

Після отримання Vercel URL:
1. Railway → бекенд сервіс → Variables
2. Оновити `FRONTEND_URL=https://твій-проект.vercel.app`
3. Railway автоматично редеплоїть

---

## Крок 4: Перевірка

### Чеклист після деплою

- [ ] `/_health` повертає `{"status":"ok"}`
- [ ] Strapi Admin Panel відкривається (`/admin`)
- [ ] Фронтенд відкривається на Vercel URL
- [ ] Логін працює (owner@test.com / Password123!)
- [ ] POS сторінка завантажує продукти з бекенду
- [ ] Створення замовлення працює
- [ ] Зображення завантажуються через Strapi → DO Spaces

### Тестові користувачі (створені сідом)

| Email | Пароль | Роль |
|---|---|---|
| owner@paradise.coffee | Password123! | Власник |
| manager@paradise.coffee | Password123! | Менеджер |
| barista@paradise.coffee | Password123! | Бариста |

---

## Крок 5: Кастомний домен (опціонально)

### Railway (бекенд)
1. Settings → **Networking** → **Custom Domain**
2. Додати домен (напр. `api.paradise.coffee`)
3. Оновити DNS записи за інструкцією Railway

### Vercel (фронтенд)
1. Settings → **Domains** → додати домен
2. Оновити DNS записи за інструкцією Vercel
3. Не забути оновити `FRONTEND_URL` на Railway та `PUBLIC_URL` відповідно

---

## Обслуговування

### Бекапи БД
Railway PostgreSQL підтримує автоматичні бекапи. Додатково можна налаштувати `pg_dump` через cron.

### Моніторинг
- Railway Dashboard → Logs, Metrics
- Endpoint `/_health` для uptime моніторингу (UptimeRobot, Better Uptime)

### Оновлення
1. Пуш в `main` → Railway та Vercel автоматично редеплоять
2. Міграції БД: `backend/database/migrations/` — застосовуються при старті Strapi
