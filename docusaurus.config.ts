import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'EduIDE Docs',
  tagline: 'Documentation and product guidance for EduIDE',
  favicon: 'img/logo.svg',
  future: {
    v4: true,
  },
  url: 'https://EduIDE.github.io',
  baseUrl: '/Docs/',
  organizationName: 'EduIDE',
  projectName: 'Docs',
  trailingSlash: false,
  onBrokenLinks: 'throw',
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'docs/developer',
          routeBasePath: 'developer',
          sidebarPath: './sidebarsDeveloper.ts',
          editUrl: 'https://github.com/EduIDE/Docs/tree/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  markdown: {
    mermaid: true,
  },
  themes: ['@docusaurus/theme-mermaid'],
  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'instructor',
        path: 'docs/instructor',
        routeBasePath: 'instructor',
        sidebarPath: './sidebarsInstructor.ts',
        editUrl: 'https://github.com/EduIDE/Docs/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'admins',
        path: 'docs/admins',
        routeBasePath: 'admins',
        sidebarPath: './sidebarsAdmins.ts',
        editUrl: 'https://github.com/EduIDE/Docs/tree/main/',
      },
    ],
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'student',
        path: 'docs/student',
        routeBasePath: 'student',
        sidebarPath: './sidebarsStudent.ts',
        editUrl: 'https://github.com/EduIDE/Docs/tree/main/',
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    colorMode: {
      defaultMode: 'light',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'EduIDE',
      logo: {
        alt: 'EduIDE Logo',
        src: 'img/logo.svg',
        href: '/',
      },
      items: [
        {
          to: '/developer/intro',
          label: 'Developer',
          position: 'left',
        },
        {
          to: '/instructor/intro',
          label: 'Instructor',
          position: 'left',
        },
        {
          to: '/admins/intro',
          label: 'Admins',
          position: 'left',
        },
        {
          to: '/student/intro',
          label: 'Student',
          position: 'left',
        },
        {
          href: 'https://github.com/EduIDE/Docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Sections',
          items: [
            {
              label: 'Developer',
              to: '/developer/intro',
            },
            {
              label: 'Instructor',
              to: '/instructor/intro',
            },
            {
              label: 'Admins',
              to: '/admins/intro',
            },
            {
              label: 'Student',
              to: '/student/intro',
            },
          ],
        },
        {
          title: 'Product',
          items: [
            {
              label: 'Landing Page',
              to: '/',
            },
            {
              label: 'Developer Docs',
              to: '/developer/intro',
            },
            {
              label: 'Student Docs',
              to: '/student/intro',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Imprint',
              to: '/imprint',
            },
            {
              label: 'GitHub Organization',
              href: 'https://github.com/EduIDE',
            },
            {
              label: 'Documentation Repository',
              href: 'https://github.com/EduIDE/Docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} EduIDE Docs. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
