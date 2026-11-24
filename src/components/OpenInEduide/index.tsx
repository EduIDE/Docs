import React, {useState} from 'react';
import CodeBlock from '@theme/CodeBlock';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {
  INSTALLATIONS,
  type Persistence,
  badgeHtml,
  badgeMarkdown,
  buildLink,
  repoError,
} from './link';
import styles from './styles.module.css';

export default function OpenInEduideGenerator(): React.ReactElement {
  const [host, setHost] = useState(INSTALLATIONS[0].host);
  const installation = INSTALLATIONS.find((i) => i.host === host) ?? INSTALLATIONS[0];
  const [template, setTemplate] = useState(installation.templates[0].name);
  const [repo, setRepo] = useState('');
  const [title, setTitle] = useState('');
  const [persistence, setPersistence] = useState<Persistence>('');
  // The snippets point at the published badge; the preview uses the copy served with this build.
  const badgePreview = useBaseUrl('/img/open-in-eduide.svg');

  const chosenTemplate = installation.templates.some((t) => t.name === template)
    ? template
    : installation.templates[0].name;
  const error = repo.trim() ? repoError(repo, installation.gitHosts) : undefined;
  const link =
    repo.trim() && !error ? buildLink({host, template: chosenTemplate, repo, title, persistence}) : undefined;

  return (
    <div className={styles.generator}>
      <div className={styles.grid}>
        <label htmlFor="oie-installation">Installation</label>
        <select id="oie-installation" value={host} onChange={(e) => setHost(e.target.value)}>
          {INSTALLATIONS.map((i) => (
            <option key={i.host} value={i.host}>
              {i.label} ({i.host})
            </option>
          ))}
        </select>

        <label htmlFor="oie-template">Language</label>
        <select id="oie-template" value={chosenTemplate} onChange={(e) => setTemplate(e.target.value)}>
          {installation.templates.map((t) => (
            <option key={t.name} value={t.name}>
              {t.label}
            </option>
          ))}
        </select>

        <label htmlFor="oie-repo">Repository URL</label>
        <div>
          <input
            id="oie-repo"
            type="url"
            placeholder="https://github.com/owner/repository.git"
            value={repo}
            onChange={(e) => setRepo(e.target.value)}
            aria-invalid={!!error}
            aria-describedby="oie-repo-help"
          />
          <small id="oie-repo-help" className={error ? styles.error : styles.help} role={error ? 'alert' : undefined}>
            {error ?? `Public repository on ${installation.gitHosts.join(', ')}.`}
          </small>
        </div>

        <label htmlFor="oie-title">Title (optional)</label>
        <input
          id="oie-title"
          type="text"
          placeholder="Shown in the student's environment list"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="oie-persistence">Workspace</label>
        <select
          id="oie-persistence"
          value={persistence}
          onChange={(e) => setPersistence(e.target.value as Persistence)}>
          <option value="">Installation default</option>
          <option value="volume">Saved</option>
          <option value="none">Temporary</option>
        </select>
      </div>

      {link ? (
        <div className={styles.result}>
          <p>
            <a href={link} target="_blank" rel="noopener noreferrer">
              <img src={badgePreview} alt="Open in EduIDE" height={20} />
            </a>{' '}
            Try it: the badge opens the link.
          </p>
          <p className={styles.caption}>Link</p>
          <CodeBlock language="text">{link}</CodeBlock>
          <p className={styles.caption}>Markdown badge (README.md)</p>
          <CodeBlock language="markdown">{badgeMarkdown(link)}</CodeBlock>
          <p className={styles.caption}>HTML badge</p>
          <CodeBlock language="html">{badgeHtml(link)}</CodeBlock>
        </div>
      ) : (
        <p className={styles.help}>Enter a repository URL to get the link and the badge.</p>
      )}
    </div>
  );
}
