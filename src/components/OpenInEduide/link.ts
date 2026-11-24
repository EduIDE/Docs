// What each installation offers to a link from outside Artemis.
// Taken from EduIDE-deployment environments/<host>/values.yaml (templates and
// eduide-control-plane.config.allowedHosts) and the public /api/v1/status.
// The status endpoint sends no CORS headers, so this page cannot read it live.
export type Installation = {
  host: string;
  label: string;
  templates: {name: string; label: string}[];
  gitHosts: string[];
};

export const INSTALLATIONS: Installation[] = [
  {
    host: 'eduide.artemis.cit.tum.de',
    label: 'TUM',
    templates: [
      {name: 'java-17-standalone', label: 'Java 17'},
      {name: 'java-25-standalone', label: 'Java 25'},
      {name: 'python-standalone', label: 'Python'},
      {name: 'javascript-standalone', label: 'JavaScript'},
      {name: 'c-standalone', label: 'C'},
    ],
    gitHosts: ['github.com', 'gitlab.com', 'codeberg.org'],
  },
  {
    host: 'bonn.eduide.aet.cit.tum.de',
    label: 'Bonn',
    templates: [{name: 'javascript-standalone', label: 'JavaScript'}],
    gitHosts: ['github.com', 'gitlab.com', 'codeberg.org'],
  },
];

export const BADGE_URL = 'https://eduide.github.io/Docs/img/open-in-eduide.svg';

export type Persistence = '' | 'volume' | 'none';

export type LinkInput = {
  host: string;
  template: string;
  repo: string;
  title?: string;
  persistence?: Persistence;
};

// Returns an error message for the repository URL, or undefined when the installation will accept it.
// Mirrors the service rules for GIT_URI: https only, a host on the allowlist, no credentials.
export function repoError(repo: string, gitHosts: string[]): string | undefined {
  let u: URL;
  try {
    u = new URL(repo.trim());
  } catch {
    return 'Enter a full URL, for example https://github.com/owner/repository.git';
  }
  if (u.protocol !== 'https:') {
    return 'Only https URLs work.';
  }
  if (u.username || u.password) {
    return 'Remove the credentials: a link must never carry a password or token.';
  }
  if (!gitHosts.includes(u.hostname)) {
    return `This installation only clones from ${gitHosts.join(', ')}.`;
  }
  if (u.pathname.split('/').filter(Boolean).length < 2) {
    return 'The URL needs an owner and a repository, for example https://github.com/owner/repository.git';
  }
  if (u.search || u.hash) {
    return 'Remove the query and the fragment from the URL.';
  }
  return undefined;
}

export function buildLink({host, template, repo, title, persistence}: LinkInput): string {
  const p = new URLSearchParams({appDef: template, gitUri: repo.trim()});
  if (title?.trim()) {
    p.set('title', title.trim());
  }
  if (persistence) {
    p.set('persistence', persistence);
  }
  return `https://${host}/?${p.toString()}`;
}

export function badgeMarkdown(link: string): string {
  return `[![Open in EduIDE](${BADGE_URL})](${link})`;
}

export function badgeHtml(link: string): string {
  const href = link.replace(/&/g, '&amp;');
  return `<a href="${href}"><img src="${BADGE_URL}" alt="Open in EduIDE" height="20"></a>`;
}
