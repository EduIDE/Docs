import React from 'react';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle: string;
}

const SectionHeader = React.memo<SectionHeaderProps>(function SectionHeader({
  label,
  title,
  subtitle,
}) {
  return (
    <>
      <div className={styles.sectionLabel}>{label}</div>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSub}>{subtitle}</p>
    </>
  );
});

export default SectionHeader;
