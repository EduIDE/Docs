import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './LandingNavbar.module.css';

export default function LandingNavbar(): React.JSX.Element {
  return (
    <nav className={`navbar ${styles.nav}`} role="navigation" aria-label="Main navigation">
      <div className="navbar__inner">
        <div className="navbar__items">
          <Link className="navbar__brand" to="/">
            <img
              src={useBaseUrl('/img/logo.svg')}
              className="navbar__logo"
              alt="EduIDE"
            />
            <strong className="navbar__title">EduIDE</strong>
          </Link>
        </div>
        <div className="navbar__items navbar__items--right">
          <Link className={`navbar__item navbar__link ${styles.navLink}`} to="/student/intro">
            Docs
          </Link>
          <Link
            className={`navbar__item navbar__link ${styles.navLink}`}
            href="https://github.com/EduIDE/Docs"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub
          </Link>
        </div>
      </div>
    </nav>
  );
}
