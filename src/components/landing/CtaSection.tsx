import Button from "./Button";
import styles from "./CtaSection.module.css";

export default function CtaSection() {
  return (
    <section className={styles.ctaSection} aria-labelledby="cta-heading">
      <h2 id="cta-heading">Ready to try EduIDE?</h2>
      <p>
        Open the IDE in your browser. Or deploy it for your next course in
        minutes.
      </p>
      <div className={styles.ctaActions}>
        <Button
          variant="primary"
          to="https://theia.artemis.cit.tum.de/"
          target="_blank"
        >
          Get Started
        </Button>
        <Button variant="secondary" to="/student/intro">
          Read the Docs
        </Button>
      </div>
    </section>
  );
}
