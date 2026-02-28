import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>
);

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <h2 className="font-display font-semibold text-xl text-foreground mb-3">{title}</h2>
    {children}
  </section>
);

const TermsPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Terms of Service" description="Read Sestara's terms of service governing your use of the platform." path="/terms" />
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Terms of Service</span>
        </nav>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 28 February 2026</p>

        <Section title="1. Service Description">
          <P>
            Sestara ("the Service") is an AI-powered learning platform that provides personalised study roadmaps, quizzes, flashcards, note-taking, and progress tracking functionality. The Service is provided on an "as-is" basis.
          </P>
        </Section>

        <Section title="2. User Obligations">
          <P>By using the Service, you agree to:</P>
          <ul className="list-disc pl-5 space-y-1 mb-2 text-sm text-muted-foreground">
            <li>Provide accurate registration information.</li>
            <li>Maintain the confidentiality of your account credentials.</li>
            <li>Use the Service in compliance with all applicable laws and regulations.</li>
            <li>Not attempt to circumvent security measures or access other users' data.</li>
            <li>Not use the Service for any unlawful, harmful, or abusive purpose.</li>
          </ul>
        </Section>

        <Section title="3. Intellectual Property">
          <P>
            All content, design, software, and trademarks associated with Sestara are the intellectual property of [Legal Entity Name] or its licensors. You retain ownership of content you create (notes, custom quizzes, etc.) but grant us a limited licence to host and display it as part of the Service.
          </P>
        </Section>

        <Section title="4. Acceptable Use">
          <P>You must not:</P>
          <ul className="list-disc pl-5 space-y-1 mb-2 text-sm text-muted-foreground">
            <li>Upload malicious code, viruses, or harmful content.</li>
            <li>Engage in automated scraping, crawling, or data harvesting.</li>
            <li>Impersonate other users or misrepresent your identity.</li>
            <li>Use the Service to distribute spam or unsolicited communications.</li>
            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
          </ul>
        </Section>

        <Section title="5. Disclaimer of Warranties">
          <P>
            The Service is provided "as is" and "as available" without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement. We do not warrant that the Service will be uninterrupted, error-free, or secure.
          </P>
        </Section>

        <Section title="6. Limitation of Liability">
          <P>
            To the maximum extent permitted by applicable law, [Legal Entity Name] shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits, data, or goodwill, arising out of or in connection with your use of the Service. Our total aggregate liability shall not exceed the amount paid by you, if any, for accessing the Service during the twelve (12) months preceding the claim.
          </P>
        </Section>

        <Section title="7. Governing Law">
          <P>
            These Terms shall be governed by and construed in accordance with the laws of [Jurisdiction], without regard to its conflict of law provisions.
          </P>
        </Section>

        <Section title="8. Jurisdiction">
          <P>
            Any disputes arising under or in connection with these Terms shall be subject to the exclusive jurisdiction of the courts of [Jurisdiction].
          </P>
        </Section>

        <Section title="9. Modifications">
          <P>
            We reserve the right to modify these Terms at any time. Material changes will be communicated via the Service or by email. Continued use of the Service after changes take effect constitutes acceptance of the revised Terms.
          </P>
        </Section>

        <Section title="10. Contact">
          <P>
            For questions regarding these Terms, please contact:{" "}
            <a href="mailto:privacy@sestara.com" className="text-primary underline underline-offset-2">privacy@sestara.com</a>
          </P>
        </Section>

        <div className="mt-12 text-center">
          <Button asChild>
            <Link to="/">Return to Sestara</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
