import React from 'react';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './FeatureShowcase.module.css';

interface FeatureShowcaseProps {
  label: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  mediaSrc?: string;
  mediaAlt?: string;
  mediaType?: 'img' | 'gif' | 'video';
  reverse?: boolean;
  accentColor?: string;
}

function MediaArea({
  mediaSrc,
  mediaAlt,
  mediaType,
  accentColor,
}: Pick<FeatureShowcaseProps, 'mediaSrc' | 'mediaAlt' | 'mediaType' | 'accentColor'>) {
  const style = accentColor ? { background: accentColor } : undefined;

  if (mediaSrc) {
    return (
      <div className={styles.mediaCol} style={style}>
        {mediaType === 'video' ? (
          <video src={mediaSrc} autoPlay loop muted playsInline aria-label={mediaAlt} />
        ) : (
          <img src={mediaSrc} alt={mediaAlt ?? ''} />
        )}
      </div>
    );
  }

  return (
    <div className={styles.mediaCol} style={style}>
      <div className={styles.gifPlaceholder}>
        {/* Codicon: device-desktop (16x16) */}
        <svg width="48" height="48" viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M15 2H1L0 3v8l1 1h5v1H4v1h8v-1H9v-1h5l1-1V3l-1-1zM1 11V3h14v8H1z"/>
        </svg>
        <span>GIF coming soon</span>
      </div>
    </div>
  );
}

const FeatureShowcase = React.memo<FeatureShowcaseProps>(function FeatureShowcase({
  label,
  title,
  description,
  linkText,
  linkHref,
  mediaSrc,
  mediaAlt,
  mediaType = 'img',
  reverse = false,
  accentColor,
}) {
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={`${styles.inner} ${reverse ? styles.reverse : ''}`}>
        <div className={styles.textCol}>
          <div className={styles.label}>{label}</div>
          <h2>{title}</h2>
          <p>{description}</p>
          {linkText && linkHref && (
            <a className={styles.link} href={linkHref}>
              {linkText} →
            </a>
          )}
        </div>
        <MediaArea
          mediaSrc={mediaSrc}
          mediaAlt={mediaAlt}
          mediaType={mediaType}
          accentColor={accentColor}
        />
      </div>
    </section>
  );
});

export default FeatureShowcase;
