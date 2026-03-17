import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  instructorSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Course Operations',
      items: ['course-operations/course-setup', 'course-operations/cohort-management'],
    },
    {
      type: 'category',
      label: 'Teaching',
      items: ['teaching/live-session-playbook', 'teaching/feedback-rhythm'],
    },
  ],
};

export default sidebars;
