import {test} from 'node:test';
import assert from 'node:assert/strict';
import {badgeHtml, badgeMarkdown, buildLink, repoError} from './link.ts';

const hosts = ['github.com', 'gitlab.com', 'codeberg.org'];

test('accepts a public https repository on an allowed host', () => {
  assert.equal(repoError('https://github.com/owner/repo.git', hosts), undefined);
  assert.equal(repoError(' https://gitlab.com/group/sub/repo ', hosts), undefined);
});

test('refuses what the service refuses', () => {
  assert.match(repoError('http://github.com/owner/repo.git', hosts)!, /https/);
  assert.match(repoError('https://user:token@github.com/owner/repo.git', hosts)!, /credentials/);
  assert.match(repoError('https://example.org/owner/repo.git', hosts)!, /only clones from/);
  assert.match(repoError('https://github.com/owner', hosts)!, /owner and a repository/);
  assert.match(repoError('https://github.com/owner/repo.git?x=1', hosts)!, /query/);
  assert.match(repoError('github.com/owner/repo', hosts)!, /full URL/);
});

test('builds the landing page link with encoded parameters', () => {
  const link = buildLink({
    host: 'bonn.eduide.aet.cit.tum.de',
    template: 'javascript-standalone',
    repo: 'https://github.com/owner/repo.git',
    title: ' My project ',
  });
  assert.equal(
    link,
    'https://bonn.eduide.aet.cit.tum.de/?appDef=javascript-standalone&gitUri=https%3A%2F%2Fgithub.com%2Fowner%2Frepo.git&title=My+project',
  );
  const p = new URL(link).searchParams;
  assert.equal(p.get('gitUri'), 'https://github.com/owner/repo.git');
  assert.equal(p.get('persistence'), null);
});

test('adds persistence only when chosen', () => {
  const link = buildLink({host: 'h', template: 't', repo: 'https://github.com/o/r', persistence: 'none'});
  assert.equal(new URL(link).searchParams.get('persistence'), 'none');
});

test('badge snippets point at the link', () => {
  const link = 'https://h/?appDef=t&gitUri=x';
  assert.equal(badgeMarkdown(link), `[![Open in EduIDE](https://eduide.github.io/Docs/img/open-in-eduide.svg)](${link})`);
  assert.match(badgeHtml(link), /href="https:\/\/h\/\?appDef=t&amp;gitUri=x"/);
});
