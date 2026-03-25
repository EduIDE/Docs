import useBaseUrl from "@docusaurus/useBaseUrl";
import SectionHeader from "./SectionHeader";
import { useScrollReveal } from "../../hooks/useScrollReveal";
import styles from "./InstructorSection.module.css";

interface Step {
  title: string;
  description: string;
}

const steps: Step[] = [
  {
    title: "One-click course setup",
    description:
      "Define the environment once within Artemis. Every student gets an identical, pre-configured workspace with no need for manual replication.",
  },
  {
    title: "Automated grading pipeline",
    description:
      "Integrated with Artemis for test-based grading. Student submissions run against your test suite automatically.",
  },
  {
    title: 'No "works on my machine" tickets',
    description:
      "All runtimes, dependencies, and configs live server-side. Support tickets about setup drop to near zero.",
  },
];

export default function InstructorSection() {
  const sectionRef = useScrollReveal<HTMLElement>();
  const scorpioImg = useBaseUrl('/img/marketing/scorpio.png');

  return (
    <section
      ref={sectionRef}
      id="instructors"
      className={styles.section}
      aria-labelledby="instructors-heading"
    >
      <SectionHeader
        id="instructors-heading"
        label="For instructors"
        title="Set up a full IDE for your class in minutes."
        subtitle="No IT tickets. No setup emails. Students open a link and they're ready. You stay focused on teaching."
      />
      <div className={styles.instructorGrid}>
        <ol className={styles.instructorList}>
          {steps.map((step, i) => (
            <li key={step.title} className={styles.instItem}>
              <div className={styles.instNum} aria-hidden="true">
                {i + 1}
              </div>
              <div>
                <h4>{step.title}</h4>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
        <img
          src={scorpioImg}
          alt="Scorpio automated grading pipeline"
          className={styles.scorpioImg}
        />
      </div>
    </section>
  );
}
