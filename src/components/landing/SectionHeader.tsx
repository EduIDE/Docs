import React from 'react';
import styles from './SectionHeader.module.css';

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle: string;
  id?: string;
}

const SectionHeader = React.memo<SectionHeaderProps>(function SectionHeader({
  label,
  title,
  subtitle,
  id,
}) {
  return (
    <>
      <div className={styles.sectionLabel}>{label}</div>
      <h2 id={id} className={styles.sectionTitle}>{title}</h2>
      <p className={styles.sectionSub}>{subtitle}</p>
    </>
  );
});

export default SectionHeader;
