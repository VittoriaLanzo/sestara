import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const NotFound = () => {
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <SEOHead title="Page Not Found" description="The page you're looking for doesn't exist." path={location.pathname} />
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-serif font-bold text-foreground">{t('not_found.title')}</h1>
        <p className="mb-4 text-xl text-muted-foreground">{t('not_found.message')}</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          {t('not_found.return_home')}
        </a>
      </div>
    </div>
  );
};

export default NotFound;
