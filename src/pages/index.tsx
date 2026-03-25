import Layout from '@theme/Layout';
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
      description="A browser-based development environment designed for education. With AI assistance, zero setup, and seamless course integration."
    >
      <main className={styles.page}>
        <HeroSection />
        <StudentFeatures />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="Run tasks"
          title="One click to build, test, and run"
          description="Pre-configured tasks let students run, build, and test their code without memorizing commands. Instructors define the workflow once and students only need to click on Run."
          mediaSrc="/videos/run-button.webm"
          mediaPoster="/img/marketing/page.png"
          mediaAlt="Run button demo"
          mediaType="video"
          accentColor="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
        />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="Submission"
          title="Submit without leaving the IDE"
          description="The integrated submission extension connects directly to Artemis. Students commit and submit their work in one step — no file uploads, no copy-paste, no switching tabs."
          mediaSrc="/videos/scorpio.webm"
          mediaPoster="/img/marketing/page.png"
          mediaAlt="Submission demo"
          mediaType="video"
          reverse
          accentColor="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
        />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="AI assistance"
          title="An AI-powered terminal that teaches."
          description="No more decoding cryptic logs. When a build fails, the AI terminal assistant provides instant explanations and guided fixes. It helps students master syntax and understand build outputs in real-time."
          mediaSrc="/videos/terminal-assistant.webm"
          mediaPoster="/img/marketing/page.png"
          mediaAlt="Terminal AI assistant demo"
          mediaType="video"
          accentColor="linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)"
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
