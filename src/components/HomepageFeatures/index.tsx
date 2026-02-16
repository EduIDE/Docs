import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'Cloud-Native IDE',
    description: (
      <>
        Access a full-featured development environment directly in your browser.
        No installation required—just open and start coding with Eclipse Theia.
      </>
    ),
  },
  {
    title: 'Built for Education',
    description: (
      <>
        Designed for university programming courses with seamless Artemis integration,
        automated grading support, and isolated student workspaces.
      </>
    ),
  },
  {
    title: 'Scalable & Extensible',
    description: (
      <>
        Deployed on Kubernetes with custom language server support, shared caching,
        and comprehensive monitoring for reliable performance at scale.
      </>
    ),
  },
];

function Feature({title, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
