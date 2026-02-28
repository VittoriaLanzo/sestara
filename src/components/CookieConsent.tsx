import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export type CookiePreferences = {
  essential: true;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
};

const STORAGE_KEY = "cookie_consent";

const getStoredPreferences = (): CookiePreferences | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

const storePreferences = (prefs: CookiePreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
};

export const useCookieConsent = () => {
  const [showBanner, setShowBanner] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences | null>(null);

  useEffect(() => {
    const stored = getStoredPreferences();
    if (stored) {
      setPreferences(stored);
    } else {
      setShowBanner(true);
    }
  }, []);

  const acceptAll = useCallback(() => {
    const prefs: CookiePreferences = { essential: true, analytics: true, marketing: true, timestamp: new Date().toISOString() };
    storePreferences(prefs);
    setPreferences(prefs);
    setShowBanner(false);
    setShowManage(false);
  }, []);

  const rejectNonEssential = useCallback(() => {
    const prefs: CookiePreferences = { essential: true, analytics: false, marketing: false, timestamp: new Date().toISOString() };
    storePreferences(prefs);
    setPreferences(prefs);
    setShowBanner(false);
    setShowManage(false);
  }, []);

  const savePreferences = useCallback((analytics: boolean, marketing: boolean) => {
    const prefs: CookiePreferences = { essential: true, analytics, marketing, timestamp: new Date().toISOString() };
    storePreferences(prefs);
    setPreferences(prefs);
    setShowBanner(false);
    setShowManage(false);
  }, []);

  const openManage = useCallback(() => {
    setShowManage(true);
    setShowBanner(false);
  }, []);

  return { showBanner, showManage, setShowManage, preferences, acceptAll, rejectNonEssential, savePreferences, openManage };
};

export const CookieBanner = ({
  onAcceptAll,
  onRejectAll,
  onManage,
}: {
  onAcceptAll: () => void;
  onRejectAll: () => void;
  onManage: () => void;
}) => {
  const { t } = useTranslation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-slide-up" style={{ animationDelay: "0s" }}>
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">{t('cookies.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('cookies.description')}{" "}
                <Link to="/cookie-policy" className="text-primary underline underline-offset-2">
                  {t('cookies.read_policy')}
                </Link>{" "}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={onRejectAll}>
                {t('cookies.reject')}
              </Button>
              <Button variant="outline" size="sm" onClick={onManage}>
                {t('cookies.manage')}
              </Button>
              <Button size="sm" onClick={onAcceptAll}>
                {t('cookies.accept_all')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CookieManageDialog = ({
  open,
  onClose,
  onSave,
  initialAnalytics = false,
  initialMarketing = false,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (analytics: boolean, marketing: boolean) => void;
  initialAnalytics?: boolean;
  initialMarketing?: boolean;
}) => {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [marketing, setMarketing] = useState(initialMarketing);
  const { t } = useTranslation();

  useEffect(() => {
    setAnalytics(initialAnalytics);
    setMarketing(initialMarketing);
  }, [initialAnalytics, initialMarketing, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/20" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-xl p-6 max-w-lg w-full shadow-lg max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">{t('cookies.manage_title')}</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">{t('cookies.essential_title')}</p>
              <p className="text-xs text-muted-foreground">{t('cookies.essential_desc')}</p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">{t('cookies.analytics_title')}</p>
              <p className="text-xs text-muted-foreground">{t('cookies.analytics_desc')}</p>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">{t('cookies.marketing_title')}</p>
              <p className="text-xs text-muted-foreground">{t('cookies.marketing_desc')}</p>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          {t('cookies.manage_note')}{" "}
          <Link to="/cookie-policy" className="text-primary underline underline-offset-2">{t('cookies.read_policy')}</Link>
        </p>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={onClose}>{t('common.cancel')}</Button>
          <Button size="sm" onClick={() => onSave(analytics, marketing)}>{t('cookies.save')}</Button>
        </div>
      </div>
    </div>
  );
};
