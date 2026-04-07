import useBaseUrl from '@docusaurus/useBaseUrl';
import Button from './Button';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  const heroVideoSrc = useBaseUrl('/videos/artemis-theia-e2e.webm');
  const heroVideoPoster = useBaseUrl('/img/marketing/page.png');
  return (
    <section className={styles.hero} aria-labelledby="hero-heading">
      {/* Decorative background elements */}
      <div className={styles.heroGridBg} aria-hidden="true" />
      <div className={styles.heroGlow} aria-hidden="true" />

      <div className={styles.heroText}>
        <div className={styles.heroBadge}>
          <span className={styles.heroBadgeDot} aria-hidden="true" />
          By TUM · AET Research Group
        </div>
        <h1 id="hero-heading">
          The IDE built for <em>learning</em>,<br />not just coding
        </h1>
        <p className={styles.heroSub}>
          A browser-based development environment designed for education — with AI assistance, zero setup, and seamless course integration.
        </p>
        <div className={styles.heroActions}>
          <Button variant="primary" to="https://theia.artemis.cit.tum.de/" target="_blank">
            Get Started
          </Button>
          <Button variant="secondary" to="/student/intro">
            Read the Docs
          </Button>
        </div>
      </div>
      <div className={styles.heroImageWrap}>
        <video
          src={heroVideoSrc}
          poster={heroVideoPoster}
          autoPlay
          loop
          muted
          playsInline
          aria-label="edu ide — browser-based IDE demo"
          className={styles.heroImage}
        />
      </div>
    </section>
  );
}
