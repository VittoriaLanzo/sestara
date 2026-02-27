import { Link } from "react-router-dom";
import sestaraLogo from "@/assets/sestara-logo.svg";

export const LegalFooter = ({ onManageCookies }: { onManageCookies: () => void }) => {
  return (
    <footer className="w-full bg-primary mt-auto relative overflow-hidden" style={{ borderTop: '1px solid hsl(38 66% 48%)' }}>
      {/* Watermark logo */}
      <img
        src={sestaraLogo}
        alt=""
        aria-hidden="true"
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 opacity-[0.05] pointer-events-none z-0"
      />

      <div className="container mx-auto px-4 py-6 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          <div className="flex items-center gap-3">
            <img src={sestaraLogo} alt="Sestara" className="h-8 object-contain" />
            <span className="font-serif font-semibold text-white tracking-wide">
              SEST<span className="text-accent">A</span>RA
            </span>
          </div>
          <p>&copy; {new Date().getFullYear()} Sestara. All rights reserved.</p>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
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
        </div>
      </div>
    </footer>
  );
};
