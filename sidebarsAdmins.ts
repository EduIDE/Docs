import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  adminsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Platform',
      items: ['platform/provisioning', 'platform/access-control'],
    },
    {
      type: 'category',
      label: 'Operations',
      items: ['operations/monitoring-basics', 'operations/incident-response'],
    },
  ],
};

export default sidebars;
