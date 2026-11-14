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
        'getting-started/languages-and-templates',
        'getting-started/workspace-tour',
        'getting-started/session-timeout',
      ],
    },
    {
      type: 'category',
      label: 'Learning',
      items: ['learning/assignment-workflow', 'learning/submission-checklist', 'learning/get-help'],
    },
  ],
};

export default sidebars;
