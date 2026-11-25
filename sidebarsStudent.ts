import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  studentSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/first-login',
        'getting-started/first-start',
        'getting-started/start-from-artemis',
        'getting-started/artemis-or-standalone',
        'getting-started/languages-and-templates',
        'getting-started/workspaces',
        'getting-started/your-environments',
        'getting-started/workspace-tour',
        'getting-started/session-timeout',
      ],
    },
    {
      type: 'category',
      label: 'Learning',
      items: ['learning/assignment-workflow', 'learning/submission-checklist', 'learning/private-repositories', 'learning/troubleshooting', 'learning/privacy', 'learning/get-help'],
    },
  ],
};

export default sidebars;
