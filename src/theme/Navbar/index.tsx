import React from 'react';
import { useLocation } from '@docusaurus/router';
import NavbarOriginal from '@theme-original/Navbar';
import type NavbarType from '@theme/Navbar';
import type { WrapperProps } from '@docusaurus/types';
import LandingNavbar from '../../components/landing/LandingNavbar';

type Props = WrapperProps<typeof NavbarType>;

export default function NavbarWrapper(props: Props): React.JSX.Element {
  const { pathname } = useLocation();
  const isHome = pathname === '/' || pathname === '/Docs/' || pathname === '/Docs';

  if (isHome) {
    return <LandingNavbar />;
  }
  return <NavbarOriginal {...props} />;
}
