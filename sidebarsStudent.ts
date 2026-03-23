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
        'getting-started/workspace-tour',
      ],
    },
    {
      type: 'category',
      label: 'Learning',
      items: ['learning/assignment-workflow', 'learning/submission-checklist'],
    },
  ],
};

export default sidebars;
