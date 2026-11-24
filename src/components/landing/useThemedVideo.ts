import useBaseUrl from '@docusaurus/useBaseUrl';
import {useColorMode} from '@docusaurus/theme-common';

// Each showcase video is recorded twice, once per color mode (scripts/record-showcase):
// /videos/<name>-light.webm, /videos/<name>-dark.webm and posters /img/marketing/<name>-<mode>.jpg.
export function useThemedVideo(name: string): {src: string; poster: string} {
  const {colorMode} = useColorMode();
  return {
    src: useBaseUrl(`/videos/${name}-${colorMode}.webm`),
    poster: useBaseUrl(`/img/marketing/${name}-${colorMode}.jpg`),
  };
}
