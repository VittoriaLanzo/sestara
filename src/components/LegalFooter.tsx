import { Link } from "react-router-dom";
import sestaraLogo from "@/assets/sestara-logo.svg";
import { useTranslation } from "react-i18next";

export const LegalFooter = ({ onManageCookies }: { onManageCookies: () => void }) => {
  const { t } = useTranslation();

  return (
    <footer className="w-full bg-background mt-auto border-t border-border">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center mb-6">
          <img src={sestaraLogo} alt="Sestara" className="w-[180px] h-auto" />
        </div>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground mb-4">
          <Link to="/privacy-policy" className="hover:text-accent transition-colors duration-150">
            {t('footer.privacy_policy')}
          </Link>
          <Link to="/cookie-policy" className="hover:text-accent transition-colors duration-150">
            {t('footer.cookie_policy')}
          </Link>
          <Link to="/terms" className="hover:text-accent transition-colors duration-150">
            {t('footer.terms')}
          </Link>
          <a href="mailto:privacy@sestara.com" className="hover:text-accent transition-colors duration-150">
            {t('footer.contact')}
          </a>
          <button
            onClick={onManageCookies}
            className="hover:text-accent transition-colors duration-150 underline-offset-2 hover:underline"
          >
            {t('footer.manage_cookies')}
          </button>
        </nav>

        <p className="text-center text-xs text-muted-foreground">
          {t('footer.copyright', { year: new Date().getFullYear() })}
        </p>
      </div>
    </footer>
  );
};
