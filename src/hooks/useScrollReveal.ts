import { useEffect, useRef, type RefObject } from 'react';

/**
 * Adds `.reveal` on mount and `.revealed` once the element enters the viewport.
 * Disconnects the observer after triggering so it only fires once.
 */
export function useScrollReveal<T extends HTMLElement = HTMLElement>(
  delay: number = 0,
): RefObject<T> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.classList.add('reveal');

    let timerId: ReturnType<typeof setTimeout> | undefined;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (delay > 0) {
            timerId = setTimeout(() => el.classList.add('revealed'), delay);
          } else {
            el.classList.add('revealed');
          }
          observer.disconnect();
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -48px 0px' },
    );

    observer.observe(el);
    return () => { observer.disconnect(); clearTimeout(timerId); };
  }, [delay]);

  return ref;
}
