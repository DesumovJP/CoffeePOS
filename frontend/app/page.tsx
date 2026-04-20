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
    title: 'Живий склад',
    description: 'Кожне замовлення автоматично зменшує запаси. Рецепти прив\u2019язані до страв — залишки завжди точні.',
  },
  {
    icon: 'clock' as const,
    title: 'Зміни та каса',
    description: 'Відкриття/закриття змін, X/Z-звіти, готівка та безгот — усе під контролем одного екрана.',
  },
  {
    icon: 'truck' as const,
    title: 'Поставки та постачальники',
    description: 'Приймайте накладні, ведіть облік постачальників, плануйте замовлення, експортуйте у CSV.',
  },
  {
    icon: 'store' as const,
    title: 'Кілька закладів',
    description: 'Мережа ресторанів, кав\u2019ярень чи барів? Керуйте усіма з єдиної панелі.',
  },
  {
    icon: 'wifi' as const,
    title: 'Офлайн-стійкість',
    description: 'Інтернет зник — замовлення приймаються далі. Повна синхронізація після відновлення.',
  },
  {
    icon: 'chart' as const,
    title: 'Аналітика у реальному часі',
    description: 'Денні та місячні звіти, топ-позиції, продуктивність персоналу, знижки — усе наживо.',
  },
];

const steps = [
  { number: '01', title: 'Запросіть команду', description: 'Власник · менеджер · бариста · офіціант. Гнучкі ролі та права.' },
  { number: '02', title: 'Опишіть меню', description: 'Страви, категорії, модифікатори, рецепти — імпорт або з нуля за 10 хвилин.' },
  { number: '03', title: 'Відкрийте зміну', description: 'Один натиск — термінал, кухня і склад синхронно готові до роботи.' },
];

const testimonials = [
  {
    quote: 'Перейшли на Smak — час оформлення замовлення впав удвічі. Нові стажери освоюють термінал за 10 хвилин.',
    author: 'Олена Коваль',
    role: 'Власник, Coffee Lab Kyiv',
    initials: 'ОК',
  },
  {
    quote: 'Керую трьома ресторанами з одного дашборда. Аналітика показує що продається — меню вже переглянули.',
    author: 'Дмитро Мельник',
    role: 'CEO, Roast House Group',
    initials: 'ДМ',
  },
  {
    quote: 'Склад списується автоматично. Сповіщення про низькі залишки врятували не один вечір у барі.',
    author: 'Марія Василенко',
    role: 'Керуюча, Bar & Brew',
    initials: 'МВ',
  },
];

// ============================================
// POS HERO MOCKUP
// ============================================

const CATEGORIES = ['Бар', 'Кухня', 'Кава', 'Десерти'];

const PRODUCTS = [
  { name: 'Еспресо',    price: 55,  bg: '#2C1200', fg: '#FDEBD0' },
  { name: 'Капучино',   price: 85,  bg: '#5C3317', fg: '#FDF5E6' },
  { name: 'Бургер',     price: 185, bg: '#6B3A1A', fg: '#FFF3E0' },
  { name: 'Паста',      price: 165, bg: '#8A5A2B', fg: '#FFF8E8' },
  { name: 'Аперол',     price: 145, bg: '#C8692B', fg: '#FFF5E4' },
  { name: 'Чізкейк',    price: 95,  bg: '#A07850', fg: '#FFFDF8' },
];

const INIT_ORDER = [
  { name: 'Капучино M', price: 85, qty: 2 },
  { name: 'Бургер',     price: 185, qty: 1 },
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
        <span className={styles.chromeTitle}>Smak · Зміна #12</span>
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
              <Icon name="sparkle" size="sm" color="accent" />
            </div>
            <span className={styles.logoText}>Smak</span>
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
            <span className={styles.heroOverline}>POS · HoReCa · Україна</span>
            <h1 className={styles.heroTitle}>
              Гнучка система<br />
              для ведення<br />
              <span className={styles.heroAccent}>вашого бізнесу</span>
            </h1>

            <p className={styles.heroSub}>
              Ресторан, кафе, бар чи готель — Smak підлаштовується під ваш формат,
              а не навпаки. Термінал, склад, кухня та аналітика в одній платформі.
            </p>

            <div className={styles.heroCTAs}>
              <Link href="/pos">
                <Button variant="primary" size="lg">
                  Відкрити термінал →
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
            <h2 className={styles.sectionTitle}>Все для вашого закладу — в одній платформі</h2>
            <p className={styles.sectionSub}>
              Від дотику до замовлення — до Z-звіту в кінці зміни. Без зайвих підписок.
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
            <span className={styles.overline}>ТЕРМІНАЛ</span>
            <h2 className={styles.showcaseTitle}>Один дотик — і замовлення вже в роботі</h2>
            <p className={styles.showcaseSub}>
              Розроблено так, щоб персонал не думав, а працював. Миттєвий пошук,
              гнучкі модифікатори, будь-які способи оплати.
            </p>
            <ul className={styles.checkList}>
              {[
                'Каталог із категоріями та миттєвим пошуком (F1)',
                'Модифікатори, розміри та дод. інгредієнти в 1 клік',
                'Готівка, картка, розбивка, знижки, сертифікати',
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
                <span className={styles.chromeTitle}>Smak · Термінал</span>
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
            <span className={styles.overline}>КУХНЯ · KDS</span>
            <h3 className={styles.dualTitle}>Жодне замовлення не загубиться</h3>
            <p className={styles.dualSub}>Real-time синхронізація між залом і кухнею. Таймери, статуси, одне натискання — страва готова.</p>
            <div className={styles.kdsMock}>
              {[
                { num: '#042', time: '2:15', items: ['Капучино ×2', 'Круасан'], status: 'preparing' },
                { num: '#043', time: '0:48', items: ['Бургер', 'Аперол'], status: 'ready' },
                { num: '#044', time: '4:02', items: ['Паста ×2', 'Чізкейк'], status: 'pending' },
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
            <p className={styles.dualSub}>X/Z-звіти, топ-позиції, продуктивність персоналу та динаміка виручки — у режимі реального часу.</p>
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
            Відкрийте демо-термінал прямо зараз — без реєстрації та кредитної картки.
          </p>
          <div className={styles.ctaBtns}>
            <Link href="/pos">
              <Button variant="primary" size="lg">Відкрити термінал →</Button>
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
                <Icon name="sparkle" size="sm" color="accent" />
              </div>
              <span className={styles.logoText}>Smak</span>
            </div>
            <p className={styles.footerDesc}>Гнучка система для ведення бізнесу — HoReCa без компромісів.</p>
          </div>
          <div className={styles.footerCols}>
            <div className={styles.footerCol}>
              <h4 className={styles.footerHeading}>Продукт</h4>
              <Link href="#features" className={styles.footerLink}>Можливості</Link>
              <Link href="#how" className={styles.footerLink}>Як це працює</Link>
              <Link href="/pos" className={styles.footerLink}>Термінал</Link>
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
          © 2026 Smak · Всі права захищено · Зроблено в Україні 🇺🇦
        </div>
      </footer>

    </div>
  );
}
