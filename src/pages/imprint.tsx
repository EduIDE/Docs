import clsx from "clsx";
import Link from "@docusaurus/Link";
import Layout from "@theme/Layout";

import styles from "./imprint.module.css";

export default function Imprint() {
  return (
    <Layout
      title="Imprint"
      description="Legal information for the EduIDE documentation site."
    >
      <main className={styles.page}>
        <div className={styles.shell}>
          <section className={styles.hero}>
            <div className={styles.heroCard}>
              <p className={styles.eyebrow}>Legal Information</p>
              <h1>Imprint</h1>
              <p className={styles.heroLead}>Legal information for EduIDE</p>
              <div className={styles.actions}>
                <Link className="button button--primary button--lg" to="/">
                  Back to home
                </Link>
                <Link
                  className={clsx(
                    "button button--secondary button--lg",
                    styles.secondaryAction,
                  )}
                  to="/developer/intro"
                >
                  Open docs
                </Link>
              </div>
            </div>

            <aside className={styles.infoCard}>
              <div>
                <span className={styles.infoLabel}>Publisher</span>
                <strong>Technical University of Munich</strong>
                <p>Arcisstrasse 21, 80333 Munich</p>
              </div>
              <div>
                <span className={styles.infoLabel}>
                  Responsible for content
                </span>
                <strong>Prof. Dr. Stephan Krusche</strong>
                <p>Boltzmannstrasse 3, 85748 Garching</p>
              </div>
              <div>
                <span className={styles.infoLabel}>Applies to</span>
                <strong>EduIDE Docs</strong>
                <p>Documentation and product guidance for EduIDE</p>
              </div>
            </aside>
          </section>

          <section className={styles.grid}>
            <article className={styles.sectionCard}>
              <h2>Publisher</h2>
              <h3>Technical University of Munich</h3>
              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt>Address</dt>
                  <dd>Arcisstrasse 21, 80333 Munich</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Phone</dt>
                  <dd>
                    <a href="tel:+498928901">+49-(0)89-289-01</a>
                  </dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Fax</dt>
                  <dd>+49-(0)89-289-22000</dd>
                </div>
                <div className={styles.detailRow}>
                  <dt>Email</dt>
                  <dd>
                    <a href="mailto:poststelle@tum.de">poststelle@tum.de</a>
                  </dd>
                </div>
              </dl>
            </article>

            <article className={styles.sectionCard}>
              <h2>Authorized to Represent</h2>
              <p>
                The Technical University of Munich is legally represented by the
                President Prof. Dr. Thomas F. Hofmann.
              </p>
            </article>

            <article className={styles.sectionCard}>
              <h2>VAT Identification Number</h2>
              <p>
                DE811193231 (in accordance with Section 27a of the German VAT
                tax act, UStG).
              </p>
            </article>

            <article className={styles.sectionCard}>
              <h2>Responsible for Content</h2>
              <h3>Prof. Dr. Stephan Krusche</h3>
              <dl className={styles.detailList}>
                <div className={styles.detailRow}>
                  <dt>Address</dt>
                  <dd>Boltzmannstrasse 3, 85748 Garching</dd>
                </div>
              </dl>
            </article>

            <article className={clsx(styles.sectionCard, styles.fullWidth)}>
              <h2>Terms of Use</h2>
              <p>
                Texts, images, graphics, and the design of these internet pages
                may be subject to copyright. The following are not protected by
                copyright according to Section 5 of the German Copyright Act
                (UrhG).
              </p>
              <p>
                Laws, ordinances, official decrees and announcements, decisions,
                and officially written guidelines for decisions as well as other
                official works that have been published in the official interest
                for general knowledge, with the restriction that the provisions
                on prohibition of modification and indication of source in
                Section 62 (1) to (3) and Section 63 (1) and (2) UrhG apply
                accordingly.
              </p>
              <p>
                As a private individual, you may use copyrighted material for
                private and other personal use within the scope of Section 53
                UrhG. Any duplication or use of objects such as images,
                diagrams, sounds, or texts in other electronic or printed
                publications is not permitted without prior agreement. This
                consent will be granted upon request by the person responsible
                for the content. The reprinting and evaluation of press releases
                and speeches are generally permitted with reference to the
                source. Furthermore, texts, images, graphics, and other files
                may be subject in whole or in part to the copyright of third
                parties. The persons responsible for the content will also
                provide more detailed information on the existence of possible
                third-party rights.
              </p>
            </article>

            <article className={clsx(styles.sectionCard, styles.fullWidth)}>
              <h2>Liability Disclaimer</h2>
              <p>
                The information provided on this website has been collected and
                verified to the best of our knowledge and belief. However, there
                is no warranty that the information provided is up-to-date,
                correct, complete, or available. There is no contractual
                relationship with users of this website.
              </p>
              <p>
                We accept no liability for any loss or damage caused by using
                this website. The exclusion of liability does not apply where
                the provisions of the German Civil Code (BGB) on liability in
                case of breach of official duty are applicable (Section 839
                BGB). We accept no liability for any loss or damage caused by
                malware when accessing or downloading data or by the
                installation or use of software from this website.
              </p>
              <p>
                Where necessary in individual cases, the exclusion of liability
                does not apply to information governed by Directive 2006/123/EC
                of the European Parliament and of the Council. Such information
                is guaranteed to be accurate and up to date.
              </p>
            </article>

            <article className={clsx(styles.sectionCard, styles.fullWidth)}>
              <h2>Links</h2>
              <p>
                Our own content is to be distinguished from cross-references
                (&quot;links&quot;) to websites of other providers. These links
                only provide access for using third-party content in accordance
                with Section 8 of the German Telemedia Act (TMG). Before
                providing links to other websites, we review third-party content
                for potential civil or criminal liability. However, a continuous
                review of third-party content for changes is not possible, and
                therefore we cannot accept any responsibility. For illegal,
                incorrect, or incomplete content, including any damage arising
                from the use or non-use of third-party information, liability
                rests solely with the provider of the website.
              </p>
            </article>
          </section>
        </div>
      </main>
    </Layout>
  );
}
