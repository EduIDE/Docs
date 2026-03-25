import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { useScrollReveal } from '../../hooks/useScrollReveal';
import styles from './FeatureShowcase.module.css';

interface FeatureShowcaseProps {
  label: string;
  title: string;
  description: string;
  linkText?: string;
  linkHref?: string;
  mediaSrc?: string;
  mediaPoster?: string;
  mediaAlt?: string;
  mediaType?: 'img' | 'gif' | 'video';
  reverse?: boolean;
  accentColor?: string;
}

function useDeferredSrc(src: string | undefined): string | undefined {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    if (!src) return;
    if (document.readyState === 'complete') {
      setReady(true);
      return () => {};
    }
    const handler = () => setReady(true);
    window.addEventListener('load', handler, { once: true });
    return () => window.removeEventListener('load', handler);
  }, [src]);
  return ready ? src : undefined;
}

function MediaArea({
  mediaSrc,
  mediaPoster,
  mediaAlt,
  mediaType,
  accentColor,
}: Pick<FeatureShowcaseProps, 'mediaSrc' | 'mediaPoster' | 'mediaAlt' | 'mediaType' | 'accentColor'>) {
  const deferredSrc = useDeferredSrc(mediaType === 'video' ? mediaSrc : undefined);
  const style = accentColor ? { background: accentColor } : undefined;

  if (mediaSrc) {
    const isVideo = mediaType === 'video';
    const className = isVideo
      ? `${styles.mediaCol} ${styles.hasVideo}`
      : styles.mediaCol;

    return (
      <div className={className} style={isVideo ? undefined : style}>
        {isVideo ? (
          <video src={deferredSrc} poster={mediaPoster} autoPlay loop muted playsInline aria-label={mediaAlt} />
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
  mediaPoster,
  mediaAlt,
  mediaType = 'img',
  reverse = false,
  accentColor,
}) {
  const sectionRef = useScrollReveal<HTMLElement>();
  const resolvedMediaSrc = useBaseUrl(mediaSrc ?? '');
  const resolvedMediaPoster = useBaseUrl(mediaPoster ?? '');

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={`${styles.inner} ${reverse ? styles.reverse : ''}`}>
        <div className={styles.textCol}>
          <div className={styles.label}>{label}</div>
          <h2>{title}</h2>
          <p>{description}</p>
          {linkText && linkHref && (
            <a className={styles.link} href={linkHref}>
              {linkText} <span aria-hidden="true">→</span>
            </a>
          )}
        </div>
        <MediaArea
          mediaSrc={mediaSrc ? resolvedMediaSrc : undefined}
          mediaPoster={mediaPoster ? resolvedMediaPoster : undefined}
          mediaAlt={mediaAlt}
          mediaType={mediaType}
          accentColor={accentColor}
        />
      </div>
    </section>
  );
});

export default FeatureShowcase;
