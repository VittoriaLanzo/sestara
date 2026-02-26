import { Link } from "react-router-dom";

export const LegalFooter = ({ onManageCookies }: { onManageCookies: () => void }) => {
  return (
    <footer className="w-full border-t border-border bg-card mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} StudyPath. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/cookie-policy" className="hover:text-foreground transition-colors">
              Cookie Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <a href="mailto:privacy@studypath.app" className="hover:text-foreground transition-colors">
              Contact
            </a>
            <button
              onClick={onManageCookies}
              className="hover:text-foreground transition-colors underline-offset-2 hover:underline"
            >
              Manage Cookie Preferences
            </button>
          </nav>
        </div>
      </div>
    </footer>
  );
};
