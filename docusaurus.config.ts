import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'EduTheia Docs',
  tagline: 'Documentation for EduTheia',
  favicon: 'img/logo.png',

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: 'https://ls1intum.github.io',
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: '/EduTheia-Docs/',

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'ls1intum', // Usually your GitHub org/user name.
  projectName: 'EduTheia-Docs', // Usually your repo name.
  trailingSlash: false,

  onBrokenLinks: 'throw',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl:
            'https://github.com/ls1intum/EduTheia-Docs/tree/main/',
          routeBasePath: '/', // Serve docs at the site's root
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.png',
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: false,
      respectPrefersColorScheme: false,
    },
    navbar: {
      title: 'EduTheia Docs',
      logo: {
        alt: 'EduTheia Logo',
        src: 'img/logo.png',
        href: '/intro',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Projects',
        },
        {
          href: 'https://github.com/ls1intum/EduTheia-Docs',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Introduction',
              to: '/intro',
            },
            {
              label: 'Projects',
              to: '/projects/theia-deployment',
            },
          ],
        },
        {
          title: 'Related Projects',
          items: [
            {
              label: 'Eclipse Theia',
              href: 'https://theia-ide.org/',
            },
            {
              label: 'Theia Cloud',
              href: 'https://github.com/eclipse-theia/theia-cloud',
            },
            {
              label: 'Artemis',
              href: 'https://github.com/ls1intum/Artemis',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'GitHub Organization',
              href: 'https://github.com/ls1intum',
            },
            {
              label: 'Documentation Repository',
              href: 'https://github.com/ls1intum/EduTheia-Docs',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} EduTheia Docs. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
