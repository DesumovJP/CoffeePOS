'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { Button, Text, Icon } from '@/components';
import styles from './page.module.css';

// ============================================
// DATA
// ============================================

const features = [
  {
    icon: 'package' as const,
    title: 'Склад та Інвентар',
    description: 'Автоматичне списання інгредієнтів при кожному замовленні. Сповіщення про низький запас.',
  },
  {
    icon: 'clock' as const,
    title: 'Управління Змінами',
    description: 'Відкриття та закриття змін, контроль каси, звірка готівки.',
  },
  {
    icon: 'truck' as const,
    title: 'Поставки',
    description: 'Облік поставок, автоматичне поповнення запасів, історія постачальників.',
  },
  {
    icon: 'store' as const,
    title: 'Мульти-локації',
    description: 'Керуйте кількома закладами з однієї панелі адміністратора.',
  },
  {
    icon: 'wifi' as const,
    title: 'Офлайн режим',
    description: 'Працюйте без інтернету. Синхронізація автоматично при з\'єднанні.',
  },
  {
    icon: 'receipt' as const,
    title: 'Звіти та Чеки',
    description: 'X/Z-звіти, денна аналітика, друк чеків. Все для бухгалтерії.',
  },
];

const steps = [
  { number: '01', title: 'Створіть акаунт', description: 'Зареєструйтесь за 30 секунд. Без кредитної картки.' },
  { number: '02', title: 'Додайте товари', description: 'Імпортуйте меню або створіть з нуля. Категорії, модифікатори, рецепти.' },
  { number: '03', title: 'Приймайте замовлення', description: 'Відкрийте зміну та почніть працювати. Все готово.' },
];

// ============================================
// SCROLL REVEAL HOOK
// ============================================

function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.visible);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );

    const children = el.querySelectorAll(`.${styles.reveal}`);
    children.forEach((child) => observer.observe(child));

    return () => observer.disconnect();
  }, []);

  return ref;
}

// ============================================
// COMPONENT
// ============================================

export default function LandingPage() {
  const scrollRef = useScrollReveal();

  return (
    <div className={styles.page} ref={scrollRef}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.dotGrid} />
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
      </div>

      {/* ==================== NAV ==================== */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <Icon name="coffee" size="lg" color="accent" />
            <span className={styles.logoText}>CoffeePOS</span>
          </div>
          <div className={styles.navLinks}>
            <Link href="#features" className={styles.navLink}>Можливості</Link>
            <Link href="#pricing" className={styles.navLink}>Ціни</Link>
            <Link href="/pos">
              <Button variant="primary" size="sm">Увійти</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ==================== HERO ==================== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.badge}>
            <span className={styles.badgeDot} />
            Вже на продакшені
          </div>

          <h1 className={styles.heroTitle}>
            Система, яка дійсно{' '}
            <span className={styles.gradientText}>прискорює</span>{' '}
            вашу кав&apos;ярню
          </h1>

          <p className={styles.heroSubtitle}>
            Легка, швидка та інтуїтивна POS-система для кафе, ресторанів та кав&apos;ярень.
          </p>

          <div className={styles.heroCTA}>
            <Link href="/pos">
              <Button variant="primary" size="lg">
                Спробувати безкоштовно
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="ghost" size="lg">
                Дізнатися більше
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ==================== SOCIAL PROOF ==================== */}
      <section className={styles.socialProof}>
        <div className={styles.socialProofInner}>
          <span className={styles.proofItem}>Вже працює</span>
          <span className={styles.proofDot} />
          <span className={styles.proofItem}>Railway</span>
          <span className={styles.proofDot} />
          <span className={styles.proofItem}>Vercel</span>
          <span className={styles.proofDot} />
          <span className={styles.proofItem}>PostgreSQL</span>
        </div>
      </section>

      {/* ==================== FEATURE SHOWCASE 1: POS ==================== */}
      <section className={`${styles.showcase} ${styles.reveal}`} id="features">
        <div className={styles.showcaseInner}>
          <div className={styles.showcaseText}>
            <span className={styles.overline}>POS ТЕРМІНАЛ</span>
            <h2 className={styles.showcaseTitle}>Один клік — замовлення готове</h2>
            <ul className={styles.checkList}>
              <li><Icon name="check" size="sm" color="accent" /> Каталог товарів з категоріями</li>
              <li><Icon name="check" size="sm" color="accent" /> Модифікатори та розміри</li>
              <li><Icon name="check" size="sm" color="accent" /> Оплата готівкою та карткою</li>
              <li><Icon name="check" size="sm" color="accent" /> Знижки на замовлення</li>
            </ul>
          </div>
          <div className={styles.showcaseVisual}>
            <div className={styles.posMockup}>
              <div className={styles.posHeader}>
                <div className={styles.posHeaderDots}>
                  <span /><span /><span />
                </div>
                <span className={styles.posHeaderTitle}>CoffeePOS</span>
              </div>
              <div className={styles.posBody}>
                <div className={styles.posProducts}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className={styles.posProduct}>
                      <div className={styles.posProductImg} />
                      <div className={styles.posProductLine} />
                    </div>
                  ))}
                </div>
                <div className={styles.posOrder}>
                  <div className={styles.posOrderItem} />
                  <div className={styles.posOrderItem} />
                  <div className={styles.posOrderItem} />
                  <div className={styles.posOrderTotal} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURE SHOWCASE 2: KDS ==================== */}
      <section className={`${styles.showcase} ${styles.showcaseReverse} ${styles.reveal}`}>
        <div className={styles.showcaseInner}>
          <div className={styles.showcaseText}>
            <span className={styles.overline}>КУХОННИЙ ЕКРАН</span>
            <h2 className={styles.showcaseTitle}>Ніколи не забудьте замовлення</h2>
            <ul className={styles.checkList}>
              <li><Icon name="check" size="sm" color="accent" /> Real-time оновлення</li>
              <li><Icon name="check" size="sm" color="accent" /> Таймер для кожного замовлення</li>
              <li><Icon name="check" size="sm" color="accent" /> Зміна статусу одним натиском</li>
              <li><Icon name="check" size="sm" color="accent" /> Пріоритезація по часу</li>
            </ul>
          </div>
          <div className={styles.showcaseVisual}>
            <div className={styles.kdsMockup}>
              {[
                { num: '#042', time: '2:30', status: 'preparing' },
                { num: '#043', time: '1:15', status: 'ready' },
                { num: '#044', time: '0:45', status: 'pending' },
              ].map((order) => (
                <div key={order.num} className={styles.kdsCard} data-status={order.status}>
                  <div className={styles.kdsCardHeader}>
                    <span className={styles.kdsOrderNum}>{order.num}</span>
                    <span className={styles.kdsTimer}>{order.time}</span>
                  </div>
                  <div className={styles.kdsCardBody}>
                    <div className={styles.kdsLine} />
                    <div className={styles.kdsLineShort} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURE SHOWCASE 3: ANALYTICS ==================== */}
      <section className={`${styles.showcase} ${styles.reveal}`}>
        <div className={styles.showcaseInner}>
          <div className={styles.showcaseText}>
            <span className={styles.overline}>АНАЛІТИКА</span>
            <h2 className={styles.showcaseTitle}>Розуміння вашого бізнесу</h2>
            <ul className={styles.checkList}>
              <li><Icon name="check" size="sm" color="accent" /> Денні та місячні звіти</li>
              <li><Icon name="check" size="sm" color="accent" /> Топ продукти за виручкою</li>
              <li><Icon name="check" size="sm" color="accent" /> Розбивка по типах оплати</li>
              <li><Icon name="check" size="sm" color="accent" /> Контроль списань та поставок</li>
            </ul>
          </div>
          <div className={styles.showcaseVisual}>
            <div className={styles.chartMockup}>
              <div className={styles.chartStats}>
                <div className={styles.chartStat}>
                  <span className={styles.chartStatValue}>₴12,450</span>
                  <span className={styles.chartStatLabel}>Виручка</span>
                </div>
                <div className={styles.chartStat}>
                  <span className={styles.chartStatValue}>86</span>
                  <span className={styles.chartStatLabel}>Замовлень</span>
                </div>
                <div className={styles.chartStat}>
                  <span className={styles.chartStatValue}>₴145</span>
                  <span className={styles.chartStatLabel}>Середній чек</span>
                </div>
              </div>
              <div className={styles.chartBars}>
                {[40, 65, 50, 80, 70, 90, 55].map((h, i) => (
                  <div key={i} className={styles.chartBar} style={{ '--bar-h': `${h}%` } as React.CSSProperties} />
                ))}
              </div>
              <div className={styles.chartLabels}>
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'].map((d) => (
                  <span key={d}>{d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== FEATURE GRID ==================== */}
      <section className={`${styles.featureGrid} ${styles.reveal}`}>
        <div className={styles.featureGridInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.overline}>ВСЕ МОЖЛИВОСТІ</span>
            <h2 className={styles.sectionTitle}>Все для управління закладом</h2>
          </div>
          <div className={styles.cards}>
            {features.map((f) => (
              <div key={f.title} className={styles.card}>
                <div className={styles.cardIcon}>
                  <Icon name={f.icon} size="lg" color="accent" />
                </div>
                <h3 className={styles.cardTitle}>{f.title}</h3>
                <p className={styles.cardDesc}>{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== HOW IT WORKS ==================== */}
      <section className={`${styles.howItWorks} ${styles.reveal}`}>
        <div className={styles.howItWorksInner}>
          <div className={styles.sectionHeader}>
            <span className={styles.overline}>ЯК ЦЕ ПРАЦЮЄ</span>
            <h2 className={styles.sectionTitle}>Три кроки до старту</h2>
          </div>
          <div className={styles.steps}>
            {steps.map((s) => (
              <div key={s.number} className={styles.step}>
                <span className={styles.stepNumber}>{s.number}</span>
                <h3 className={styles.stepTitle}>{s.title}</h3>
                <p className={styles.stepDesc}>{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className={`${styles.cta} ${styles.reveal}`} id="pricing">
        <div className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Готові модернізувати свою кав&apos;ярню?</h2>
          <p className={styles.ctaSubtitle}>Приєднуйтесь до закладів, які вже використовують CoffeePOS</p>
          <div className={styles.ctaButtons}>
            <Link href="/pos">
              <Button variant="primary" size="lg">Почати безкоштовно</Button>
            </Link>
            <Link href="#features">
              <Button variant="ghost" size="lg">Переглянути можливості</Button>
            </Link>
          </div>
          <p className={styles.ctaDisclaimer}>Безкоштовний тріал — без кредитної картки</p>
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerCol}>
            <div className={styles.logo}>
              <Icon name="coffee" size="md" color="accent" />
              <span className={styles.logoText}>CoffeePOS</span>
            </div>
            <p className={styles.footerDesc}>Сучасна POS-система для кафе та ресторанів</p>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Продукт</h4>
            <Link href="#features" className={styles.footerLink}>Можливості</Link>
            <Link href="#pricing" className={styles.footerLink}>Ціни</Link>
            <Link href="/pos" className={styles.footerLink}>POS Термінал</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Компанія</h4>
            <Link href="#" className={styles.footerLink}>Про нас</Link>
            <Link href="#" className={styles.footerLink}>Блог</Link>
          </div>
          <div className={styles.footerCol}>
            <h4 className={styles.footerHeading}>Підтримка</h4>
            <Link href="#" className={styles.footerLink}>Документація</Link>
            <Link href="#" className={styles.footerLink}>Контакти</Link>
          </div>
        </div>
        <div className={styles.footerBottom}>
          <Text variant="caption" color="tertiary">
            © 2026 CoffeePOS. Всі права захищено.
          </Text>
        </div>
      </footer>
    </div>
  );
}
