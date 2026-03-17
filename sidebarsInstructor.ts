import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  instructorSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Course Evaluation',
      items: [
        'course-evaluation/course-fit',
        'course-evaluation/evaluating-eduide-in-a-pilot',
        'course-evaluation/customizable-features',
      ],
    },
    {
      type: 'category',
      label: 'Prerequisites',
      items: ['prerequisites/course-requirements', 'prerequisites/operational-dependencies'],
    },
  ],
};

export default sidebars;
