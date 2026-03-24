import React from "react";
import type { ReactNode } from "react";
import SectionHeader from "./SectionHeader";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import styles from "./OpenSourceSection.module.css";

interface OssCard {
  iconColor: "teal" | "orange";
  icon: ReactNode;
  title: string;
  description: string;
}

interface Contribution {
  color: string;
  text: string;
}

/* Codicon: source-control (24x24) */
const IconSourceControl = () => (
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M21 8.25C21 6.1815 19.3185 4.5 17.25 4.5C15.1815 4.5 13.5 6.1815 13.5 8.25C13.5 10.023 14.739 11.5035 16.395 11.892C16.116 12.819 15.2655 13.5 14.25 13.5H9.75C8.9025 13.5 8.1285 13.7925 7.5 14.268V7.4235C9.21 7.0755 10.5 5.5605 10.5 3.75C10.5 1.6815 8.8185 0 6.75 0C4.6815 0 3 1.6815 3 3.75C3 5.562 4.29 7.0755 6 7.4235V16.575C4.29 16.923 3 18.438 3 20.2485C3 22.317 4.6815 23.9985 6.75 23.9985C8.8185 23.9985 10.5 22.317 10.5 20.2485C10.5 18.4755 9.261 16.995 7.605 16.6065C7.884 15.6795 8.7345 14.9985 9.75 14.9985H14.25C16.0845 14.9985 17.61 13.6725 17.931 11.9295C19.674 11.607 21 10.0845 21 8.25ZM4.5 3.75C4.5 2.5095 5.5095 1.5 6.75 1.5C7.9905 1.5 9 2.5095 9 3.75C9 4.9905 7.9905 6 6.75 6C5.5095 6 4.5 4.9905 4.5 3.75ZM9 20.25C9 21.4905 7.9905 22.5 6.75 22.5C5.5095 22.5 4.5 21.4905 4.5 20.25C4.5 19.0095 5.5095 18 6.75 18C7.9905 18 9 19.0095 9 20.25ZM17.25 10.5C16.0095 10.5 15 9.4905 15 8.25C15 7.0095 16.0095 6 17.25 6C18.4905 6 19.5 7.0095 19.5 8.25C19.5 9.4905 18.4905 10.5 17.25 10.5Z"/>
  </svg>
);

/* Codicon: heart (16x16) */
const IconHeart = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M8.022 14.072c-.128 0-.256-.049-.354-.146L2.104 8.361C1.538 7.797.998 6.891.998 5.699.998 3.945 2.326 2 4.728 2c.975 0 1.951.357 2.665 1.07L8 3.672l.587-.602C9.305 2.36 10.266 2.003 11.229 2.003c2.975 0 3.769 2.682 3.769 3.75 0 .957-.362 1.913-1.086 2.641L8.376 13.927a.501.501 0 0 1-.354.145z"/>
  </svg>
);

/* Codicon: book (16x16) */
const IconBook = () => (
  <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M2.5 2C1.672 2 1 2.672 1 3.5v9C1 13.328 1.672 14 2.5 14H6c.818 0 1.544-.393 2-1 .456.607 1.182 1 2 1h3.5c.828 0 1.5-.672 1.5-1.5v-9C15 2.672 14.328 2 13.5 2H10c-.818 0-1.544.393-2 1A2.494 2.494 0 0 0 6 2H2.5zM7.5 4.5v7c0 .828-.672 1.5-1.5 1.5H2.5a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5H6c.828 0 1.5.672 1.5 1.5zm1 7V4.5C8.5 3.672 9.172 3 10 3h3.5a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5H10c-.828 0-1.5-.672-1.5-1.5z"/>
  </svg>
);

const cards: OssCard[] = [
  {
    iconColor: "teal",
    icon: <IconSourceControl />,
    title: "Open source",
    description:
      "The full codebase is public. Fork it, audit it, and extend it for your institution — no black boxes.",
  },
  {
    iconColor: "orange",
    icon: <IconHeart />,
    title: "Built by students, for students",
    description:
      "edu ide is developed as part of thesis projects at TUM's AET Chair — by students who understand the learning experience firsthand.",
  },
  {
    iconColor: "teal",
    icon: <IconBook />,
    title: "Education research-backed",
    description:
      "Features are grounded in real student studies and pedagogical research at TUM's Applied Education Technologies chair.",
  },
];

const contributions: Contribution[] = [
  { color: "#4E9F9C", text: "AI terminal assistant extension" },
  { color: "#4E9F9C", text: "OSC Escape Sequence Support in the Terminal" },
  { color: "#4E9F9C", text: "Git Actions button support" },
  { color: "#4E9F9C", text: "And more" },
];

const tags: string[] = [
  "eclipse-theia",
  "typescript",
  "xterm.js",
  "monaco-editor",
  "artemis",
  "lsp",
  "node.js",
];

const OssCardItem = React.memo<{ card: OssCard }>(function OssCardItem({
  card,
}) {
  return (
    <div className={styles.ossCard}>
      <div
        className={`${styles.ossCardIcon} ${card.iconColor === "teal" ? styles.iconTeal : styles.iconOrange}`}
        aria-hidden="true"
      >
        {card.icon}
      </div>
      <div className={styles.ossLabel}>{card.title}</div>
      <div className={styles.ossDesc}>{card.description}</div>
    </div>
  );
});

export default function OpenSourceSection() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      id="opensource"
      className={styles.ossSection}
      aria-labelledby="opensource-heading"
    >
      <div className={styles.ossInner}>
        <SectionHeader
          label="Open source"
          title="Built in the open, giving back upstream"
          subtitle="EduIDE is built on Eclipse Theia and developed openly at TUM. Everything we learn, we share with the community and the platform."
        />

        <div className={styles.ossGrid} role="list">
          {cards.map((card) => (
            <div key={card.title} role="listitem">
              <OssCardItem card={card} />
            </div>
          ))}
        </div>

        <div className={styles.ossTheiaProminent}>
          <div className={styles.ossTheiaLeft}>
            <div className={styles.ossTheiaBadge} aria-hidden="true">
              Theia
            </div>
            <div>
              <div className={styles.ossTheiaTag}>Powered by Eclipse Theia</div>
              <h3 className={styles.ossTheiaTitle}>
                A real IDE platform, not a toy editor
              </h3>
              <p className={styles.ossTheiaDesc}>
                EduIDE is built on Eclipse Theia — the same open-source platform
                that powers cloud IDEs used in industry. We work in
                collaboration with the team at Ecplise Source and extend Theia
                by contributing our extensions back upstream.
              </p>
            </div>
          </div>
          <div className={styles.ossContribCard}>
            <div className={styles.ossContribTitle}>Contributions upstream</div>
            {contributions.map((c) => (
              <div key={c.text} className={styles.contribRow}>
                <div
                  className={styles.contribDot}
                  style={{ background: c.color }}
                  aria-hidden="true"
                />
                <div className={styles.contribText}>{c.text}</div>
              </div>
            ))}
            <div className={styles.contribFooter}>
              Part of the Eclipse Foundation ecosystem
            </div>
          </div>
        </div>

        <div
          className={styles.ossTags}
          role="list"
          aria-label="Technologies used"
        >
          {tags.map((tag) => (
            <span key={tag} className={styles.ossTag} role="listitem">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
