'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Button, Icon } from '@/components';
import styles from './page.module.css';

// ============================================
// DATA
// ============================================

const features = [
  {
    icon: 'package' as const,
    title: 'Авто-списання інгредієнтів',
    description: "Кожне замовлення автоматично зменшує запаси. Рецепти прив\u2019язані до товарів — склад завжди актуальний.",
  },
  {
    icon: 'clock' as const,
    title: 'Управління змінами',
    description: 'Відкриття та закриття зміни, X/Z-звіти, зведення каси і контроль готівки.',
  },
  {
    icon: 'truck' as const,
    title: 'Облік поставок',
    description: 'Реєстрація поставок, автоматичне поповнення запасів, журнал постачальників.',
  },
  {
    icon: 'store' as const,
    title: 'Мульти-локації',
    description: 'Управляйте кількома закладами з однієї панелі адміністратора.',
  },
  {
    icon: 'wifi' as const,
    title: 'Офлайн режим',
    description: "Приймайте замовлення без інтернету. Синхронізація при відновленні з\u2019єднання.",
  },
  {
    icon: 'receipt' as const,
    title: 'Звіти та Аналітика',
    description: 'Денні й місячні звіти, топ-продукти, аналіз виплат і знижок у реальному часі.',
  },
];

const steps = [
  { number: '01', title: 'Увійдіть в систему', description: 'Барист · менеджер · власник. Ролі з різними правами доступу.' },
  { number: '02', title: 'Налаштуйте меню', description: 'Товари, категорії, модифікатори та рецепти за кілька хвилин.' },
  { number: '03', title: 'Відкрийте зміну', description: 'Один натиск — і POS готовий приймати замовлення.' },
];

const testimonials = [
  {
    quote: 'Перейшли на CoffeePOS — обслуговування стало вдвічі швидшим. Нові баристи освоюють за 10 хвилин.',
    author: 'Олена Коваль',
    role: 'Власник, Coffee Lab Kyiv',
    initials: 'ОК',
  },
  {
    quote: 'Нарешті POS де все інтуїтивно. Аналітика показує що і коли купують — меню вже оптимізували.',
    author: 'Дмитро Мельник',
    role: 'Менеджер, Roast House',
    initials: 'ДМ',
  },
  {
    quote: 'Склад списується автоматично. Повідомлення про низький залишок рятують від ситуації «молоко скінчилось».',
    author: 'Марія Василенко',
    role: 'Власник, Bean & Brew',
    initials: 'МВ',
  },
];

// ============================================
// POS HERO MOCKUP
// ============================================

const CATEGORIES = ['Еспресо', 'Кава', 'Десерти', 'Чай'];

const PRODUCTS = [
  { name: 'Еспресо',   price: 55,  bg: '#2C1200', fg: '#FDEBD0' },
  { name: 'Капучино',  price: 85,  bg: '#5C3317', fg: '#FDF5E6' },
  { name: 'Латте',     price: 95,  bg: '#8B5E3C', fg: '#FFF8F0' },
  { name: 'Американо', price: 65,  bg: '#3B2010', fg: '#FEF3E2' },
  { name: 'Флет Уайт', price: 90,  bg: '#6F4E2A', fg: '#FEFAF5' },
  { name: 'Раф кава',  price: 110, bg: '#A07850', fg: '#FFFDF8' },
];

const INIT_ORDER = [
  { name: 'Капучино M', price: 85, qty: 2 },
  { name: 'Круасан',    price: 65, qty: 1 },
];

function PosHeroMockup() {
  const [activeTab, setActiveTab]   = useState(0);
  const [order, setOrder]           = useState(INIT_ORDER);
  const [flashIdx, setFlashIdx]     = useState<number | null>(null);

  useEffect(() => {
    let idx = 0;
    const t = setInterval(() => {
      const p = PRODUCTS[idx % PRODUCTS.length];
      setFlashIdx(idx % PRODUCTS.length);
      setTimeout(() => {
        setOrder((prev) => {
          const ex = prev.find((i) => i.name === p.name);
          if (ex) return prev.map((i) => i.name === p.name ? { ...i, qty: Math.min(i.qty + 1, 9) } : i);
          return [...prev.slice(-3), { name: p.name, price: p.price, qty: 1 }];
        });
        setFlashIdx(null);
      }, 380);
      idx++;
    }, 2600);
    return () => clearInterval(t);
  }, []);

  const total = order.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <div className={styles.posMockup}>
      {/* Chrome bar */}
      <div className={styles.mockupChrome}>
        <div className={styles.chromeDots}>
          <span style={{ background: '#FF5F57' }} />
          <span style={{ background: '#FFBD2E' }} />
          <span style={{ background: '#28CA41' }} />
        </div>
        <span className={styles.chromeTitle}>CoffeePOS — Зміна #12</span>
        <div className={styles.chromeOnline}>
          <span className={styles.onlineDot} />
          Онлайн
        </div>
      </div>

      {/* Category tabs */}
      <div className={styles.mockupTabs}>
        {CATEGORIES.map((c, i) => (
          <button
            key={c}
            className={`${styles.mockupTab} ${activeTab === i ? styles.mockupTabActive : ''}`}
            onClick={() => setActiveTab(i)}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className={styles.mockupBody}>
        {/* Products */}
        <div className={styles.mockupProducts}>
          {PRODUCTS.map((p, i) => (
            <div
              key={p.name}
              className={`${styles.mockupProduct} ${flashIdx === i ? styles.mockupProductFlash : ''}`}
              style={{ '--pb': p.bg, '--pf': p.fg } as React.CSSProperties}
            >
              <div className={styles.prodTop} />
              <span className={styles.prodName}>{p.name}</span>
              <span className={styles.prodPrice}>₴{p.price}</span>
            </div>
          ))}
        </div>

        {/* Order */}
        <div className={styles.mockupOrder}>
          <div className={styles.orderHead}>
            <span className={styles.orderNum}>#042</span>
            <span className={styles.orderQty}>{order.reduce((s, i) => s + i.qty, 0)} шт</span>
          </div>
          <div className={styles.orderItems}>
            {order.map((item) => (
              <div key={item.name} className={styles.orderRow}>
                <span className={styles.orderRowName}>{item.name}</span>
                <span className={styles.orderRowQty}>×{item.qty}</span>
                <span className={styles.orderRowPrice}>₴{item.price * item.qty}</span>
              </div>
            ))}
          </div>
          <div className={styles.orderFoot}>
            <div className={styles.orderTotal}>
              <span>Разом</span>
              <strong>₴{total}</strong>
            </div>
            <div className={styles.orderPayBtn}>Оплатити ▶</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================
// SCROLL REVEAL HOOK
// ============================================

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add(styles.visible)),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    el.querySelectorAll(`.${styles.reveal}`).forEach((c) => obs.observe(c));
    return () => obs.disconnect();
  }, []);
  return ref;
}

// ============================================
// PAGE
// ============================================

export default function LandingPage() {
  const scrollRef = useScrollReveal();

  return (
    <div className={styles.page} ref={scrollRef}>

      {/* Background */}
      <div className={styles.bg}>
        <div className={styles.dotGrid} />
        <div className={styles.orb1} />
        <div className={styles.orb2} />
        <div className={styles.orb3} />
      </div>

      {/* ─── NAV ─── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}>
              <Icon name="coffee" size="sm" color="accent" />
            </div>
            <span className={styles.logoText}>CoffeePOS</span>
          </div>
          <div className={styles.navCenter}>
            <Link href="#features" className={styles.navLink}>Можливості</Link>
            <Link href="#how" className={styles.navLink}>Як це працює</Link>
            <Link href="#pricing" className={styles.navLink}>Ціни</Link>
          </div>
          <div className={styles.navRight}>
            <Link href="/login" className={styles.navLinkSecondary}>Увійти</Link>
            <Link href="/pos">
              <Button variant="primary" size="sm">Спробувати →</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>

          {/* Left */}
          <div className={styles.heroLeft}>
            <h1 className={styles.heroTitle}>
              POS-система,<br />
              яку бариста<br />
              <span className={styles.heroAccent}>обожнює</span>
            </h1>

            <p className={styles.heroSub}>
              Від замовлення до чеку — три натиски.
            </p>

            <div className={styles.heroCTAs}>
              <Link href="/pos">
                <Button variant="primary" size="lg">
                  Відкрити POS термінал →
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="lg">
                  Можливості
                </Button>
              </Link>
            </div>
          </div>

          {/* Right — mockup */}
          <div className={styles.heroRight}>
            <div className={styles.mockupWrap}>
              <PosHeroMockup />

              {/* Floating notifications */}
              <div className={styles.floatPill1}>
                <span className={styles.floatDot} />
                Замовлення #043 готове
              </div>
              <div className={styles.floatPill2}>
                <Icon name="chart" size="xs" color="accent" />
                ₴12&thinsp;450 сьогодні
              </div>
              <div className={styles.floatPill3}>
                <Icon name="check" size="xs" color="accent" />
                Зміна відкрита
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TECH STRIP ─── */}
      <div className={styles.techStrip}>
        <div className={styles.techInner}>
          <span className={styles.techLabel}>Побудовано на</span>
          {['Next.js 16', 'React 19', 'Strapi 5', 'PostgreSQL', 'Zustand', 'Railway', 'Vercel'].map((t) => (
            <span key={t} className={styles.techBadge}>{t}</span>
          ))}
        </div>
      </div>

      {/* ─── BENTO FEATURES ─── */}
      <section className={`${styles.bento} ${styles.reveal}`} id="features">
        <div className={styles.bentoInner}>
          <div className={styles.sectionHead}>
            <span className={styles.overline}>МОЖЛИВОСТІ</span>
            <h2 className={styles.sectionTitle}>Все для кав&apos;ярні — в одній системі</h2>
            <p className={styles.sectionSub}>
              Від POS-терміналу до складського обліку. Жодних зайвих підписок.
            </p>
          </div>
          <div className={styles.bentoGrid}>
            {features.map((f, i) => (
              <div key={f.title} className={`${styles.bentoCard} ${i === 0 ? styles.bentoBig : ''}`}>
                <div className={styles.bentoIconWrap}>
                  <Icon name={f.icon} size="lg" color="accent" />
                </div>
                <h3 className={styles.bentoCardTitle}>{f.title}</h3>
                <p className={styles.bentoCardDesc}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── POS SHOWCASE ─── */}
      <section className={`${styles.showcase} ${styles.reveal}`}>
        <div className={styles.showcaseInner}>
          <div className={styles.showcaseText}>
            <span className={styles.overline}>POS ТЕРМІНАЛ</span>
            <h2 className={styles.showcaseTitle}>Один клік — замовлення в черзі</h2>
            <p className={styles.showcaseSub}>
              Розроблено щоб бариста не думав — а працював. Миттєвий пошук,
              гнучкі модифікатори, оплата готівкою та карткою.
            </p>
            <ul className={styles.checkList}>
              {[
                'Каталог з категоріями та пошуком (F1)',
                'Модифікатори та розміри в 1 клік',
                'Готівка, картка, знижки, розбивка',
                'Клавіатурні шорткати для швидких касирів',
              ].map((item) => (
                <li key={item}>
                  <span className={styles.checkBullet}>
                    <Icon name="check" size="xs" color="accent" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.showcaseVisual}>
            <div className={styles.posDetail}>
              <div className={styles.posDetailChrome}>
                <div className={styles.chromeDots}>
                  <span style={{ background: '#FF5F57' }} />
                  <span style={{ background: '#FFBD2E' }} />
                  <span style={{ background: '#28CA41' }} />
                </div>
                <span className={styles.chromeTitle}>CoffeePOS · Термінал</span>
              </div>
              <div className={styles.posDetailBody}>
                <div className={styles.posDetailGrid}>
                  {PRODUCTS.map((p) => (
                    <div
                      key={p.name}
                      className={styles.posDetailCard}
                      style={{ '--pb': p.bg, '--pf': p.fg } as React.CSSProperties}
                    >
                      <div className={styles.posDetailCardTop} />
                      <span className={styles.posDetailCardName}>{p.name}</span>
                      <span className={styles.posDetailCardPrice}>₴{p.price}</span>
                    </div>
                  ))}
                </div>
                <div className={styles.posDetailSide}>
                  <div className={styles.posDetailSideTitle}>Замовлення #042</div>
                  {INIT_ORDER.map((item) => (
                    <div key={item.name} className={styles.posDetailSideRow}>
                      <span>{item.name}</span>
                      <span>×{item.qty}</span>
                      <span>₴{item.price * item.qty}</span>
                    </div>
                  ))}
                  <div className={styles.posDetailTotal}>
                    <span>Разом</span>
                    <strong>₴{INIT_ORDER.reduce((s, i) => s + i.price * i.qty, 0)}</strong>
                  </div>
                  <div className={styles.posDetailPay}>Оплатити</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── KDS + ANALYTICS ─── */}
      <section className={`${styles.dual} ${styles.reveal}`}>
        <div className={styles.dualInner}>

          <div className={styles.dualCard}>
            <span className={styles.overline}>КУХОННИЙ ЕКРАН</span>
            <h3 className={styles.dualTitle}>Жодне замовлення не загубиться</h3>
            <p className={styles.dualSub}>Real-time оновлення, таймери та статуси. Один дотик — страва готова.</p>
            <div className={styles.kdsMock}>
              {[
                { num: '#042', time: '2:15', items: ['Капучино ×2', 'Круасан'], status: 'preparing' },
                { num: '#043', time: '0:48', items: ['Латте M', 'Тірамісу'], status: 'ready' },
                { num: '#044', time: '4:02', items: ['Американо ×3'], status: 'pending' },
              ].map((order) => (
                <div key={order.num} className={`${styles.kdsCard} ${styles[`kds${order.status}`]}`}>
                  <div className={styles.kdsTop}>
                    <span className={styles.kdsNum}>{order.num}</span>
                    <span className={`${styles.kdsTime} ${styles[`kdstime${order.status}`]}`}>{order.time}</span>
                  </div>
                  {order.items.map((item) => (
                    <div key={item} className={styles.kdsItem}>{item}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className={styles.dualCard}>
            <span className={styles.overline}>АНАЛІТИКА</span>
            <h3 className={styles.dualTitle}>Розумійте свій бізнес</h3>
            <p className={styles.dualSub}>X/Z-звіти, топ-продукти та динаміка виручки за місяць.</p>
            <div className={styles.analyticsMock}>
              <div className={styles.analyticsRow}>
                {[
                  { val: '₴12 450', lbl: 'Виручка' },
                  { val: '86', lbl: 'Замовлень' },
                  { val: '₴145', lbl: 'Сер. чек' },
                ].map((s) => (
                  <div key={s.lbl} className={styles.analyticsStat}>
                    <span className={styles.analyticsVal}>{s.val}</span>
                    <span className={styles.analyticsLbl}>{s.lbl}</span>
                  </div>
                ))}
              </div>
              <div className={styles.analyticsChart}>
                {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                  <div
                    key={i}
                    className={styles.analyticsBar}
                    style={{ '--h': `${h}%`, '--delay': `${i * 0.08}s` } as React.CSSProperties}
                  />
                ))}
              </div>
              <div className={styles.analyticsAxis}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className={`${styles.testimonials} ${styles.reveal}`}>
        <div className={styles.testimonialsInner}>
          <div className={styles.sectionHead}>
            <span className={styles.overline}>ВІДГУКИ</span>
            <h2 className={styles.sectionTitle}>Що кажуть заклади</h2>
          </div>
          <div className={styles.testimonialsGrid}>
            {testimonials.map((t) => (
              <div key={t.author} className={styles.testimonialCard}>
                <div className={styles.testimonialStars}>{'★'.repeat(5)}</div>
                <p className={styles.testimonialQuote}>&ldquo;{t.quote}&rdquo;</p>
                <div className={styles.testimonialAuthorRow}>
                  <div className={styles.testimonialAvatar}>{t.initials}</div>
                  <div>
                    <div className={styles.testimonialName}>{t.author}</div>
                    <div className={styles.testimonialRole}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className={`${styles.howItWorks} ${styles.reveal}`} id="how">
        <div className={styles.howInner}>
          <div className={styles.sectionHead}>
            <span className={styles.overline}>ЯК ЦЕ ПРАЦЮЄ</span>
            <h2 className={styles.sectionTitle}>Три кроки до старту</h2>
          </div>
          <div className={styles.steps}>
            {steps.map((s, i) => (
              <div key={s.number} className={styles.step}>
                <div className={styles.stepTop}>
                  <span className={styles.stepNum}>{s.number}</span>
                  {i < steps.length - 1 && <div className={styles.stepConnector} />}
                </div>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className={`${styles.cta} ${styles.reveal}`} id="pricing">
        <div className={styles.ctaWrap}>
          <div className={styles.ctaOrb} />
          <span className={styles.overline}>БЕЗКОШТОВНО</span>
          <h2 className={styles.ctaTitle}>Готові спробувати?</h2>
          <p className={styles.ctaSub}>
            Відкрийте POS-термінал прямо зараз — без реєстрації та кредитної картки.
          </p>
          <div className={styles.ctaBtns}>
            <Link href="/pos">
              <Button variant="primary" size="lg">Відкрити POS термінал →</Button>
            </Link>
            <Link href="/login">
              <Button variant="ghost" size="lg">Увійти в систему</Button>
            </Link>
          </div>
          <p className={styles.ctaHint}>
            Тестові дані: <code>barista</code> / <code>barista123</code>
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <div className={styles.logoIcon}>
                <Icon name="coffee" size="sm" color="accent" />
              </div>
              <span className={styles.logoText}>CoffeePOS</span>
            </div>
            <p className={styles.footerDesc}>Сучасна POS-система для кав&apos;ярень та ресторанів</p>
          </div>
          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Продукт</h4>
              <Link href="#features" className={styles.footerLink}>Можливості</Link>
              <Link href="#how" className={styles.footerLink}>Як це працює</Link>
              <Link href="/pos" className={styles.footerLink}>POS Термінал</Link>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Компанія</h4>
              <Link href="#" className={styles.footerLink}>Про нас</Link>
              <Link href="#" className={styles.footerLink}>Контакти</Link>
            </div>
            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Підтримка</h4>
              <Link href="#" className={styles.footerLink}>Документація</Link>
              <Link href="#" className={styles.footerLink}>GitHub</Link>
            </div>
          </div>
        </div>
        <div className={styles.footerBottom}>
          © 2026 CoffeePOS · Всі права захищено · Зроблено в Україні 🇺🇦
        </div>
      </footer>

    </div>
  );
}
