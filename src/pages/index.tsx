import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import HeroSection from '../components/landing/HeroSection';
import StudentFeatures from '../components/landing/StudentFeatures';
import InstructorSection from '../components/landing/InstructorSection';
import FeatureShowcase from '../components/landing/FeatureShowcase';
import LanguagesSection from '../components/landing/LanguagesSection';
import OpenSourceSection from '../components/landing/OpenSourceSection';
import CtaSection from '../components/landing/CtaSection';

import styles from './index.module.css';

export default function Home() {
  return (
    <Layout
      title="EduIDE"
      description="A browser-based development environment designed for education, with zero setup and seamless course integration."
    >
      <main className={styles.page}>
        <HeroSection />
        <StudentFeatures />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="Run tasks"
          title="One click to build, test, and run"
          description="Pre-configured tasks let students run, build, and test their code without memorizing commands. Instructors define the workflow once and students only need to click on Run."
          videoName="run-button"
          mediaAlt="Run button demo"
          mediaType="video"
          accentColor="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
        />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="Open from a link"
          title="One link, the whole repository"
          description={<>Put a link or a badge in your README and students land in an IDE with your repository already cloned, its tasks and settings included. Private repositories work with the Clone Repository button in Source Control. <Link to="/instructor/course-operations/open-in-eduide-links">Build a link</Link>.</>}
          videoName="open-from-link"
          mediaAlt="Opening a repository from a link"
          mediaType="video"
          reverse
        />
        <hr className={styles.sectionDivider} />
        <LanguagesSection />
        <hr className={styles.sectionDivider} />
        <InstructorSection />
        <OpenSourceSection />
        <CtaSection />
      </main>
    </Layout>
  );
}
