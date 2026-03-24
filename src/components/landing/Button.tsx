import React from 'react';
import Link from '@docusaurus/Link';
import styles from './Button.module.css';

interface ButtonProps {
  variant: 'primary' | 'secondary';
  to: string;
  target?: string;
  children: React.ReactNode;
}

const Button = React.memo<ButtonProps>(function Button({
  variant,
  to,
  target,
  children,
}) {
  return (
    <Link
      className={variant === 'primary' ? styles.btnPrimary : styles.btnSecondary}
      to={to}
      target={target}
      {...(target === '_blank' ? { rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </Link>
  );
});

export default Button;
