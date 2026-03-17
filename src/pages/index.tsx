import clsx from 'clsx';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

import styles from './index.module.css';

const sections = [
  {
    title: 'Developer',
    description: 'API references, architecture decisions, integration guides, and implementation patterns.',
    href: '/developer/intro',
  },
  {
    title: 'Instructor',
    description: 'Course delivery workflows, classroom playbooks, and content operations guidance.',
    href: '/instructor/intro',
  },
  {
    title: 'Admins',
    description: 'Provisioning, permissions, platform operations, and incident handling documentation.',
    href: '/admins/intro',
  },
  {
    title: 'Student',
    description: 'Onboarding, workspace basics, assignment flow, and submission support.',
    href: '/student/intro',
  },
];

export default function Home(): JSX.Element {
  return (
    <Layout
      title="EduIDE"
      description="Flashy landing page for EduIDE with clear entry points into each documentation audience."
    >
      <main className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroGlow} />
          <div className={styles.heroContent}>
            <p className={styles.kicker}>Learning infrastructure for modern engineering education</p>
            <h1>EduIDE brings product storytelling and practical docs into one place.</h1>
            <p className={styles.lead}>
              This landing page can sell the platform, while every audience gets a dedicated doc space with
              its own sidebar, route, and navigation path.
            </p>
            <div className={styles.actions}>
              <Link className="button button--primary button--lg" to="/developer/intro">
                Open docs
              </Link>
              <Link className={clsx('button button--secondary button--lg', styles.secondaryAction)} to="/student/intro">
                Explore student flow
              </Link>
            </div>
          </div>
          <div className={styles.heroPanel}>
            <div className={styles.metricCard}>
              <span>Audience-based docs</span>
              <strong>4 sections</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Navigation model</span>
              <strong>Independent sidebars</strong>
            </div>
            <div className={styles.metricCard}>
              <span>Current state</span>
              <strong>Mock content ready</strong>
            </div>
          </div>
        </section>

        <section className={styles.sectionGrid}>
          {sections.map((section) => (
            <Link key={section.title} className={styles.sectionCard} to={section.href}>
              <span className={styles.sectionLabel}>Section</span>
              <h2>{section.title}</h2>
              <p>{section.description}</p>
              <span className={styles.sectionCta}>Enter section</span>
            </Link>
          ))}
        </section>
      </main>
    </Layout>
  );
}
