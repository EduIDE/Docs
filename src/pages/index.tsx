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
      title="edu ide"
      description="A browser-based development environment designed for education — with AI assistance, zero setup, and seamless course integration."
    >
      <main className={styles.page}>
        <HeroSection />
        <StudentFeatures />
        <hr className={styles.sectionDivider} />
        <InstructorSection />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="Run tasks"
          title="One click to build, test, and run"
          description="Pre-configured tasks let students run, build, and test their code without memorizing commands. Instructors define the workflow once — students just click Run."
          linkText="Learn about task configuration"
          linkHref="/student/intro"
          mediaSrc="/videos/run-button.webm"
          mediaAlt="Run button demo"
          mediaType="video"
          accentColor="linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)"
        />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="Submission"
          title="Submit without leaving the IDE"
          description="The integrated submission extension connects directly to Artemis. Students commit and submit their work in one step — no file uploads, no copy-paste, no switching tabs."
          linkText="See how submission works"
          linkHref="/student/intro"
          mediaSrc="/videos/scorpio.webm"
          mediaAlt="Submission demo"
          mediaType="video"
          reverse
          accentColor="linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)"
        />
        <hr className={styles.sectionDivider} />
        <FeatureShowcase
          label="AI assistance"
          title="A terminal assistant that explains errors"
          description="When a command fails, the AI terminal assistant explains what went wrong and suggests guided fixes — right inside the terminal, not a separate chat window. Students learn from errors instead of just copying solutions."
          linkText="Learn about the AI assistant"
          linkHref="/student/intro"
          mediaSrc="/videos/terminal-assistant.webm"
          mediaAlt="Terminal AI assistant demo"
          mediaType="video"
          accentColor="linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)"
        />
        <hr className={styles.sectionDivider} />
        <LanguagesSection />
        <OpenSourceSection />
        <CtaSection />
      </main>
    </Layout>
  );
}
