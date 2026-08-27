import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

/**
 * Every page under docs/instructor must appear here. Docusaurus warns about a
 * sidebar entry with no file, but publishes a file with no sidebar entry and
 * says nothing - so seven pages sat live and unreachable, including the two
 * that set expectations honestly. scripts/check-docs.sh enforces both
 * directions now.
 */
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
        'course-evaluation/what-you-can-evaluate',
        'course-evaluation/what-you-cannot-evaluate',
      ],
    },
    {
      type: 'category',
      label: 'Prerequisites',
      items: ['prerequisites/course-requirements', 'prerequisites/operational-dependencies'],
    },
    {
      type: 'category',
      label: 'Running a Course',
      items: ['course-operations/course-setup', 'course-operations/cohort-management'],
    },
    {
      type: 'category',
      label: 'Teaching',
      items: ['teaching/live-session-playbook', 'teaching/feedback-rhythm'],
    },
    'limitations/honest-limitations',
  ],
};

export default sidebars;
