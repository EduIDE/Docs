import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  adminsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Platform',
      items: [
        'platform/provisioning',
        'platform/access-control',
        'platform/app-definitions',
        'platform/storage-and-quotas',
      ],
    },
    {
      type: 'category',
      label: 'Operations',
      items: [
        'operations/monitoring-basics',
        'operations/incident-response',
        'operations/session-management',
        'operations/garbage-collection',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      items: [
        'security/admin-api-tokens',
        'security/audit-and-compliance',
      ],
    },
    {
      type: 'category',
      label: 'Maintenance',
      items: [
        'maintenance/upgrades',
      ],
    },
  ],
};

export default sidebars;
