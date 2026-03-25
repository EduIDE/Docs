import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './LanguagesSection.module.css';

interface Language {
  name: string;
  logoSrc: string;
}

const languages: Language[] = [
  { name: 'Java', logoSrc: '/img/marketing/java-svgrepo-com.svg' },
  { name: 'Python', logoSrc: '/img/marketing/python-svgrepo-com.svg' },
  { name: 'C', logoSrc: '/img/marketing/C_Programming_Language.svg' },
  { name: 'JavaScript', logoSrc: '/img/marketing/javascript-svgrepo-com.svg' },
  { name: 'OCaml', logoSrc: '/img/marketing/OCaml_Sticker.svg' },
  { name: 'Rust', logoSrc: '/img/marketing/rust-svgrepo-com.svg' },
];

const LangItem = React.memo<{ language: Language }>(function LangItem({ language }) {
  const resolvedSrc = useBaseUrl(language.logoSrc);
  return (
    <div className={styles.langItem} role="listitem">
      <img src={resolvedSrc} alt={language.name} className={styles.langLogo} />
      {language.name}
    </div>
  );
});

export default function LanguagesSection() {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} id="languages" className={styles.section} aria-labelledby="languages-heading">
      <div className={styles.inner}>
        <div className={styles.textCol}>
          <h2 id="languages-heading">
            Ready-to-code environments
          </h2>
          <p>
            We provide pre-configured Cloud IDEs with full toolchain support and LSP-powered editing right out of the box.
            <br />Enjoy seamless syntax highlighting, autocompletion, and real-time error detection without any setup.
          </p>
        </div>
        <div className={styles.langGrid} role="list" aria-label="Supported programming languages">
          {languages.map((lang) => (
            <LangItem key={lang.name} language={lang} />
          ))}
        </div>
      </div>
    </section>
  );
}
