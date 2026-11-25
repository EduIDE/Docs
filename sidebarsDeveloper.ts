import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  developerSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Projects',
      items: [
        'projects/projects-overview',
        'projects/eduide-control-plane',
        'projects/eduide',
        'projects/eduide-deployment',
        'projects/eduide-image-mannheim',
        'projects/eduide-shared-cache',
        'projects/eduide-lsp-extension',
        'projects/theia-scale-tests',
        'projects/theia-arc-runners',
      ],
    },
    {
      type: 'category',
      label: 'Platform',
      items: [
        'platform/architecture',
        'platform/session-prewarming',
        'platform/session-lifecycle',
        'platform/api-specification',
        'platform/external-integration',
        'platform/git-accounts',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      items: ['guides/local-development', 'guides/contributing', 'guides/deploying-pull-requests', 'guides/releases-and-dependencies'],
    },
  ],
};

export default sidebars;
