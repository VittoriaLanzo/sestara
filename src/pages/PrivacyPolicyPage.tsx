const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display font-semibold text-xl text-foreground mb-3">{title}</h2>
    {children}
  </section>
);

const Sub = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4">
    <h3 className="font-display font-medium text-base text-foreground mb-1">{title}</h3>
    {children}
  </div>
);

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>
);

const Li = ({ children }: { children: React.ReactNode }) => (
  <li className="text-sm text-muted-foreground leading-relaxed">{children}</li>
);

const PrivacyPolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</p>

        <Section title="1. Data Controller">
          <P>[Legal Entity Name]</P>
          <P>Registered Address: [Registered Address]</P>
          <P>Contact Email: privacy@studypath.app</P>
          <P>EU Representative (if applicable): [EU Representative Name and Address]</P>
          <P>Data Protection Officer (if applicable): [DPO Name and Contact Details]</P>
        </Section>

        <Section title="2. Legal Framework">
          <P>
            This Privacy Policy is issued in compliance with Regulation (EU) 2016/679 (the General Data Protection Regulation, "GDPR").
            All processing of personal data is carried out in accordance with the principles set out in Article 5 GDPR:
          </P>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <Li>Lawfulness, fairness, and transparency</Li>
            <Li>Purpose limitation</Li>
            <Li>Data minimisation</Li>
            <Li>Accuracy</Li>
            <Li>Storage limitation</Li>
            <Li>Integrity and confidentiality</Li>
            <Li>Accountability</Li>
          </ul>
        </Section>

        <Section title="3. Categories of Personal Data">
          <P>We may process the following categories of personal data:</P>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <Li><strong>Identity data:</strong> name, username, display name.</Li>
            <Li><strong>Contact data:</strong> email address.</Li>
            <Li><strong>Technical data:</strong> IP address, device type, browser type, operating system.</Li>
            <Li><strong>Usage data:</strong> pages visited, features used, session duration, study progress.</Li>
            <Li><strong>Communication data:</strong> correspondence with us.</Li>
          </ul>
          <P>
            We do not intentionally collect any special category data as defined in Article 9 GDPR (e.g., racial or ethnic origin, political opinions, health data, biometric data).
          </P>
        </Section>

        <Section title="4. Purposes and Lawful Bases (Art. 6 GDPR)">
          <P>Personal data is processed for the following purposes, each with a specified lawful basis:</P>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Purpose</th>
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Lawful Basis</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border"><td className="p-2">Providing and managing your account</td><td className="p-2">Contract performance (Art. 6(1)(b))</td></tr>
                <tr className="border-b border-border"><td className="p-2">Personalising study roadmaps and content</td><td className="p-2">Contract performance (Art. 6(1)(b))</td></tr>
                <tr className="border-b border-border"><td className="p-2">Sending service-related communications</td><td className="p-2">Legitimate interests (Art. 6(1)(f))</td></tr>
                <tr className="border-b border-border"><td className="p-2">Analytics and service improvement</td><td className="p-2">Consent (Art. 6(1)(a))</td></tr>
                <tr className="border-b border-border"><td className="p-2">Marketing communications</td><td className="p-2">Consent (Art. 6(1)(a))</td></tr>
                <tr><td className="p-2">Compliance with legal obligations</td><td className="p-2">Legal obligation (Art. 6(1)(c))</td></tr>
              </tbody>
            </table>
          </div>
          <P>
            Where processing is based on legitimate interests, we have conducted a balancing test to ensure that our interests do not override your fundamental rights and freedoms.
          </P>
          <P>
            Where processing is based on consent, you have the right to withdraw consent at any time. Withdrawal does not affect the lawfulness of processing carried out prior to withdrawal.
          </P>
        </Section>

        <Section title="5. Data Minimisation">
          <P>
            We process only the personal data that is strictly necessary for the purposes outlined above. We do not collect or retain data beyond what is required.
          </P>
        </Section>

        <Section title="6. Data Retention">
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <Li>Account data is retained for the duration of the account's existence.</Li>
            <Li>Technical logs are retained only for as long as necessary for security and operational purposes.</Li>
            <Li>Legal retention obligations are honoured where applicable.</Li>
            <Li>Personal data is deleted or anonymised when it is no longer required for its original purpose.</Li>
          </ul>
        </Section>

        <Section title="7. Data Subject Rights (Arts. 15–22 GDPR)">
          <P>Under the GDPR, you have the following rights:</P>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <Li><strong>Right of access</strong> (Art. 15) — obtain confirmation and a copy of your data.</Li>
            <Li><strong>Right to rectification</strong> (Art. 16) — correct inaccurate or incomplete data.</Li>
            <Li><strong>Right to erasure</strong> (Art. 17) — request deletion of your data.</Li>
            <Li><strong>Right to restriction</strong> (Art. 18) — restrict processing in certain circumstances.</Li>
            <Li><strong>Right to data portability</strong> (Art. 20) — receive your data in a structured, machine-readable format.</Li>
            <Li><strong>Right to object</strong> (Art. 21) — object to processing based on legitimate interests.</Li>
            <Li><strong>Right to withdraw consent</strong> — withdraw consent at any time.</Li>
          </ul>
          <P>
            We will respond to valid requests within one calendar month. This period may be extended by two further months where necessary, taking into account the complexity and number of requests.
          </P>
        </Section>

        <Section title="8. Automated Decision-Making (Art. 22 GDPR)">
          <P>
            We do not currently engage in automated decision-making, including profiling, that produces legal effects or similarly significant effects on data subjects.
          </P>
        </Section>

        <Section title="9. International Transfers">
          <P>
            Where personal data is transferred outside the European Economic Area (EEA), such transfers are carried out exclusively under one of the following safeguards:
          </P>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <Li>An adequacy decision by the European Commission (Art. 45 GDPR).</Li>
            <Li>Standard Contractual Clauses approved by the European Commission (Art. 46 GDPR).</Li>
            <Li>Other equivalent safeguards as permitted under the GDPR.</Li>
          </ul>
        </Section>

        <Section title="10. Security Measures (Art. 32 GDPR)">
          <P>We implement appropriate technical and organisational measures, including:</P>
          <ul className="list-disc pl-5 space-y-1 mb-2">
            <Li>Encryption of data in transit (TLS).</Li>
            <Li>Secure hosting infrastructure with access controls.</Li>
            <Li>Role-based access control to personal data.</Li>
            <Li>Logging and monitoring of access.</Li>
            <Li>Organisational policies and staff awareness.</Li>
          </ul>
        </Section>

        <Section title="11. Processors (Art. 28 GDPR)">
          <P>
            Third-party service providers who process personal data on our behalf are bound by Data Processing Agreements that meet the requirements of Article 28 GDPR.
          </P>
        </Section>

        <Section title="12. Supervisory Authority">
          <P>
            You have the right to lodge a complaint with the relevant supervisory authority in the EU Member State of your habitual residence, place of work, or place of the alleged infringement.
          </P>
        </Section>

        <Section title="13. Contact for Data Requests">
          <P>
            For all data subject requests, please contact: <a href="mailto:privacy@studypath.app" className="text-primary underline underline-offset-2">privacy@studypath.app</a>
          </P>
        </Section>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
