'use client';

/**
 * ParadisePOS - Landing Page
 *
 * Modern, light, and inviting landing page for cafes and coffee shops
 * iOS 26 Liquid Glass design with wow-effect
 */

import Link from 'next/link';
import { Button, Text, GlassCard, Icon } from '@/components';
import styles from './page.module.css';

// ============================================
// FEATURES DATA
// ============================================

const features = [
  {
    icon: 'cart' as const,
    title: 'Швидкий POS',
    description: 'Інтуїтивний інтерфейс для швидкого обслуговування. Один клік — і замовлення готове.',
  },
  {
    icon: 'package' as const,
    title: 'Склад та Інвентар',
    description: 'Автоматичне списання інгредієнтів. Сповіщення про низький запас.',
  },
  {
    icon: 'chart' as const,
    title: 'Аналітика',
    description: 'Детальні звіти про продажі, популярні товари та пікові години.',
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
    description: 'Друк чеків, Z-звіти, фіскалізація. Все для бухгалтерії.',
  },
];

const stats = [
  { value: '500+', label: 'Закладів' },
  { value: '1M+', label: 'Замовлень' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Підтримка' },
];

// ============================================
// COMPONENT
// ============================================

export default function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Animated Background */}
      <div className={styles.background}>
        <div className={styles.gradientOrb1} />
        <div className={styles.gradientOrb2} />
        <div className={styles.gradientOrb3} />
      </div>

      {/* Navigation */}
      <nav className={styles.nav}>
        <div className={styles.navContent}>
          <div className={styles.logo}>
            <Icon name="coffee" size="lg" color="accent" />
            <Text variant="h4" weight="semibold">ParadisePOS</Text>
          </div>
          <div className={styles.navLinks}>
            <Link href="#features" className={styles.navLink}>
              <Text variant="labelMedium">Можливості</Text>
            </Link>
            <Link href="#pricing" className={styles.navLink}>
              <Text variant="labelMedium">Ціни</Text>
            </Link>
            <Link href="/pos">
              <Button variant="primary" size="sm">
                Увійти
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.heroText}>
            <div className={styles.badge}>
              <Icon name="sparkle" size="sm" />
              <Text variant="labelSmall">Нова версія 2.0</Text>
            </div>

            <h1 className={styles.heroTitle}>
              <span className={styles.gradientText}>Сучасна POS</span>
              <br />
              для вашої кав'ярні
            </h1>

            <Text variant="bodyLarge" color="secondary" className={styles.heroSubtitle}>
              Легка, швидка та красива система для кафе, ресторанів та кав'ярень.
              Почніть приймати замовлення за 5 хвилин.
            </Text>

            <div className={styles.heroCTA}>
              <Link href="/pos">
                <Button variant="primary" size="xl">
                  <Icon name="cart" size="md" />
                  Спробувати безкоштовно
                </Button>
              </Link>
              <Link href="#features">
                <Button variant="ghost" size="xl">
                  Дізнатися більше
                  <Icon name="chevronRight" size="md" />
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className={styles.stats}>
              {stats.map((stat) => (
                <div key={stat.label} className={styles.stat}>
                  <Text variant="h3" weight="bold" color="accent">{stat.value}</Text>
                  <Text variant="caption" color="tertiary">{stat.label}</Text>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Image / POS Preview */}
          <div className={styles.heroImage}>
            <GlassCard elevated className={styles.mockupCard}>
              <div className={styles.mockupHeader}>
                <div className={styles.mockupDots}>
                  <span className={styles.dot} data-color="red" />
                  <span className={styles.dot} data-color="yellow" />
                  <span className={styles.dot} data-color="green" />
                </div>
                <Text variant="caption" color="tertiary">ParadisePOS</Text>
              </div>
              <div className={styles.mockupContent}>
                <div className={styles.mockupSidebar}>
                  <div className={styles.mockupNavItem} data-active="true" />
                  <div className={styles.mockupNavItem} />
                  <div className={styles.mockupNavItem} />
                </div>
                <div className={styles.mockupMain}>
                  <div className={styles.mockupGrid}>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <div key={i} className={styles.mockupProduct} />
                    ))}
                  </div>
                </div>
                <div className={styles.mockupOrder}>
                  <div className={styles.mockupOrderItem} />
                  <div className={styles.mockupOrderItem} />
                  <div className={styles.mockupOrderTotal} />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={styles.features}>
        <div className={styles.sectionHeader}>
          <Text variant="overline" color="accent">МОЖЛИВОСТІ</Text>
          <h2 className={styles.sectionTitle}>
            Все що потрібно для вашого бізнесу
          </h2>
          <Text variant="bodyLarge" color="secondary" className={styles.sectionSubtitle}>
            Від прийому замовлень до аналітики — ParadisePOS охоплює всі аспекти управління закладом
          </Text>
        </div>

        <div className={styles.featuresGrid}>
          {features.map((feature) => (
            <GlassCard
              key={feature.title}
              padding="lg"
              interactive
              className={styles.featureCard}
            >
              <div className={styles.featureIcon}>
                <Icon name={feature.icon} size="xl" color="accent" />
              </div>
              <Text variant="h5" weight="semibold">{feature.title}</Text>
              <Text variant="bodyMedium" color="secondary">
                {feature.description}
              </Text>
            </GlassCard>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.cta}>
        <GlassCard elevated padding="xl" className={styles.ctaCard}>
          <div className={styles.ctaContent}>
            <Text variant="h2">Готові почати?</Text>
            <Text variant="bodyLarge" color="secondary">
              Приєднуйтесь до сотень кав'ярень, які вже використовують ParadisePOS
            </Text>
            <div className={styles.ctaButtons}>
              <Link href="/pos">
                <Button variant="primary" size="lg">
                  <Icon name="cart" size="md" />
                  Почати безкоштовно
                </Button>
              </Link>
              <Button variant="secondary" size="lg">
                <Icon name="calendar" size="md" />
                Замовити демо
              </Button>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.footerBrand}>
            <div className={styles.logo}>
              <Icon name="coffee" size="md" color="accent" />
              <Text variant="labelLarge" weight="semibold">ParadisePOS</Text>
            </div>
            <Text variant="bodySmall" color="tertiary">
              Сучасна POS-система для HoReCa
            </Text>
          </div>
          <div className={styles.footerLinks}>
            <Text variant="labelSmall" color="tertiary">
              © 2026 ParadisePOS. Всі права захищено.
            </Text>
          </div>
        </div>
      </footer>
    </div>
  );
}
