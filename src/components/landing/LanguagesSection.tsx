import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './LanguagesSection.module.css';

interface Language {
  name: string;
  logoSrc: string;
}

const languages: Language[] = [
  { name: 'Java',       logoSrc: '/Docs/img/marketing/java-svgrepo-com.svg' },
  { name: 'Python',     logoSrc: '/Docs/img/marketing/python-svgrepo-com.svg' },
  { name: 'C',          logoSrc: '/Docs/img/marketing/C_Programming_Language.svg' },
  { name: 'JavaScript', logoSrc: '/Docs/img/marketing/javascript-svgrepo-com.svg' },
  { name: 'OCaml',      logoSrc: '/Docs/img/marketing/OCaml_Sticker.svg' },
  { name: 'Rust',       logoSrc: '/Docs/img/marketing/rust-svgrepo-com.svg' },
];

const LangItem = React.memo<{ language: Language }>(function LangItem({ language }) {
  return (
    <div className={styles.langItem}>
      <img src={language.logoSrc} alt={language.name} className={styles.langLogo} />
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
          <h2 id="languages-heading">Supports the languages your course uses</h2>
          <p>
            Full LSP-powered editing — syntax highlighting, autocompletion, and inline errors — out of the box for every major teaching language.
          </p>
        </div>
        <div className={styles.langGrid} role="list" aria-label="Supported programming languages">
          {languages.map((lang) => (
            <div key={lang.name} role="listitem">
              <LangItem language={lang} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
