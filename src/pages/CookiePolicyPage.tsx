import { Link } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const P = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground leading-relaxed mb-2">{children}</p>
);

const CookiePolicyPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 pt-24 pb-16 max-w-3xl">
        <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground font-medium">Cookie Policy</span>
        </nav>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-2">Cookie Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: 28 February 2026</p>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3">1. What Are Cookies</h2>
          <P>
            Cookies are small text files placed on your device by a website. They are widely used to make websites function correctly, improve efficiency, and provide information to website operators. Cookies may be "session" cookies (deleted when you close your browser) or "persistent" cookies (remaining until they expire or are deleted).
          </P>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3">2. Cookies We Use</h2>
          <div className="overflow-x-auto mb-3">
            <table className="w-full text-sm border border-border rounded-lg">
              <thead>
                <tr className="bg-secondary/50">
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Category</th>
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Cookie / Technology</th>
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Purpose</th>
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Duration</th>
                  <th className="text-left p-2 font-medium text-foreground border-b border-border">Provider</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="p-2 font-medium">Essential</td>
                  <td className="p-2">Authentication session</td>
                  <td className="p-2">Maintains user login state</td>
                  <td className="p-2">Session</td>
                   <td className="p-2">Sestara</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2 font-medium">Essential</td>
                  <td className="p-2">cookie_consent</td>
                  <td className="p-2">Stores your cookie preference choices</td>
                  <td className="p-2">1 year</td>
                  <td className="p-2">Sestara</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="p-2 font-medium">Essential</td>
                  <td className="p-2">CSRF token</td>
                  <td className="p-2">Security — prevents cross-site request forgery</td>
                  <td className="p-2">Session</td>
                  <td className="p-2">Sestara</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3">3. How to Manage or Withdraw Consent</h2>
          <P>
            You may change your cookie preferences at any time by clicking "Manage Cookie Preferences" in the site footer. You may also configure your browser to reject cookies or delete existing cookies. Note that disabling essential cookies may impair site functionality.
          </P>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3">4. Essential Cookies</h2>
          <P>
            Essential cookies are strictly necessary for the operation of the website. They cannot be disabled through the consent mechanism as they are required for core functionality such as authentication and security.
          </P>
        </section>

        <section className="mb-10">
          <h2 className="font-display font-semibold text-xl text-foreground mb-3">5. Contact</h2>
          <P>
            For questions regarding this Cookie Policy, contact us at{" "}
            <a href="mailto:privacy@sestara.com" className="text-primary underline underline-offset-2">privacy@sestara.com</a>.
          </P>
        </section>

        <div className="mt-12 text-center">
          <Button asChild>
            <Link to="/">Return to Sestara</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CookiePolicyPage;
