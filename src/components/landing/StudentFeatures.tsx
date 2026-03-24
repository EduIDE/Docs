import React from "react";
import type { ReactNode } from "react";
import SectionHeader from "./SectionHeader";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import styles from "./StudentFeatures.module.css";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
  iconColor: "teal" | "orange";
  highlight?: boolean;
  pill?: string;
}

/* Codicon: clockface (16x16) */
const IconClock = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7zm0 1a6 6 0 1 1 0 12A6 6 0 0 1 8 2zm-.5 2v4.5c0 .133.053.26.146.354l2.5 2.5.708-.708L8.5 8.293V4H7.5z"/>
  </svg>
);

/* Codicon: list-ordered (16x16) — horizontal bars on the right side */
const IconListOrdered = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M1 2h1.5v4H1V2zm2.5 0h8v1h-8V2zm0 5h8v1h-8V7zm0 5h8v1h-8v-1zM1 7h1.5v4H1V7zm0 5h1.5v4H1v-4z"/>
  </svg>
);

/* Codicon: server (16x16) */
const IconServer = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M14 4.5C14 2.567 11.314 1 8 1S2 2.567 2 4.5v7C2 13.433 4.686 15 8 15s6-1.567 6-3.5v-7zm-1 0c0 1.374-2.239 2.5-5 2.5S3 5.874 3 4.5 5.239 2 8 2s5 1.126 5 2.5zm0 2.949C12.016 8.252 10.117 9 8 9s-4.016-.748-5-2.051V8.5C3 9.874 5.239 11 8 11s5-1.126 5-2.5V7.449zm0 3.5C12.016 11.752 10.117 12.5 8 12.5s-4.016-.748-5-2.051V11.5C3 12.874 5.239 14 8 14s5-1.126 5-2.5v-.551z"/>
  </svg>
);

const features: Feature[] = [
  {
    iconColor: "teal",
    icon: <IconClock />,
    title: "Zero setup",
    description:
      "Open your browser. Your full dev environment is ready — no installs, no PATH issues, no Docker to configure.",
  },
  {
    iconColor: "orange",
    icon: <IconListOrdered />,
    title: "Assignment integration",
    description:
      "Assignments appear directly in the IDE. Submit without switching tabs or manually uploading files.",
  },
  {
    iconColor: "teal",
    icon: <IconServer />,
    title: "Consistent environments",
    description:
      "Every student runs identical toolchains. What works for you works for the grader — every single time.",
  },
];

interface FeatureCardProps {
  feature: Feature;
}

const FeatureCard = React.memo<FeatureCardProps>(function FeatureCard({
  feature,
}) {
  return (
    <div
      className={`${styles.featureCard} ${feature.highlight ? styles.highlight : ""}`}
    >
      {feature.pill && <div className={styles.featurePill}>{feature.pill}</div>}
      <div
        className={`${styles.featureIcon} ${feature.iconColor === "teal" ? styles.iconTeal : styles.iconOrange}`}
        aria-hidden="true"
      >
        {feature.icon}
      </div>
      <h3>{feature.title}</h3>
      <p>{feature.description}</p>
    </div>
  );
});

function RevealCard({ feature, delay }: { feature: Feature; delay: number }) {
  const ref = useScrollReveal<HTMLDivElement>(delay);
  return (
    <div
      ref={ref}
      role="listitem"
      style={{ display: "flex", flexDirection: "column" }}
    >
      <FeatureCard feature={feature} />
    </div>
  );
}

export default function StudentFeatures() {
  return (
    <section
      id="students"
      className={styles.section}
      aria-labelledby="students-heading"
    >
      <SectionHeader
        label="For students"
        title="Everything you need, right in the browser"
        subtitle='No installation, no config files, no "it works on my machine." Open your assignment and start coding in seconds.'
      />
      <div className={styles.featuresGrid} role="list">
        {features.map((f, i) => (
          <RevealCard key={f.title} feature={f} delay={i * 80} />
        ))}
      </div>
    </section>
  );
}
