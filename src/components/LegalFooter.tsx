import { Link } from "react-router-dom";
import sestaraLogo from "@/assets/sestara-logo.svg";

export const LegalFooter = ({ onManageCookies }: { onManageCookies: () => void }) => {
  return (
    <footer className="w-full bg-background mt-auto border-t border-border">
      <div className="container mx-auto px-4 py-8">
        {/* Centered logo */}
        <div className="flex justify-center mb-6">
          <img src={sestaraLogo} alt="Sestara" className="w-[180px] h-auto" />
        </div>

        {/* Links & copyright */}
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
          <Link to="/privacy-policy" className="hover:text-accent transition-colors duration-150">
            Privacy Policy
          </Link>
          <Link to="/cookie-policy" className="hover:text-accent transition-colors duration-150">
            Cookie Policy
          </Link>
          <Link to="/terms" className="hover:text-accent transition-colors duration-150">
            Terms of Service
          </Link>
          <a href="mailto:privacy@sestara.com" className="hover:text-accent transition-colors duration-150">
            Contact
          </a>
          <button
            onClick={onManageCookies}
            className="hover:text-accent transition-colors duration-150 underline-offset-2 hover:underline"
          >
            Manage Cookie Preferences
          </button>
        </nav>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Sestara. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
