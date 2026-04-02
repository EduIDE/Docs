import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  developerSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Projects',
      items: [
        'projects/projects-overview',
        'projects/eduide-deployment',
        'projects/theia-scale-tests',
        'projects/eduide-shared-cache',
        'projects/eduide-lsp-extension',
        'projects/eduide-data-bridge',
        'projects/eduide',
        'projects/theia-arc-runners',
        'projects/workspace-garbage-collector',
      ],
    },
    {
      type: 'category',
      label: 'Platform',
      items: ['platform/architecture', 'platform/api-specification'],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/local-development', 'guides/deploying-pull-requests', 'guides/session-prewarming'],
    },
  ],
};

export default sidebars;
