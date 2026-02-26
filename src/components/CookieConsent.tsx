import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { X } from "lucide-react";
import { Link } from "react-router-dom";

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
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] p-4 animate-slide-up" style={{ animationDelay: "0s" }}>
      <div className="container mx-auto max-w-3xl">
        <div className="bg-card border border-border rounded-xl p-5 shadow-lg">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-display font-semibold text-foreground mb-1">Cookie Preferences</h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to ensure essential site functionality. Non-essential cookies are only set with your explicit consent.
                Read our{" "}
                <Link to="/cookie-policy" className="text-primary underline underline-offset-2">
                  Cookie Policy
                </Link>{" "}
                for details.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" size="sm" onClick={onRejectAll}>
                Reject Non-Essential
              </Button>
              <Button variant="outline" size="sm" onClick={onManage}>
                Manage Preferences
              </Button>
              <Button size="sm" onClick={onAcceptAll}>
                Accept All
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
        <h2 className="font-display font-semibold text-lg text-foreground mb-4">Manage Cookie Preferences</h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Essential Cookies</p>
              <p className="text-xs text-muted-foreground">Required for core functionality. Cannot be disabled.</p>
            </div>
            <Switch checked disabled />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Analytics Cookies</p>
              <p className="text-xs text-muted-foreground">Help us understand how visitors interact with the site.</p>
            </div>
            <Switch checked={analytics} onCheckedChange={setAnalytics} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
            <div>
              <p className="text-sm font-medium text-foreground">Marketing Cookies</p>
              <p className="text-xs text-muted-foreground">Used to deliver relevant advertisements.</p>
            </div>
            <Switch checked={marketing} onCheckedChange={setMarketing} />
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          You can change your preferences at any time via the "Manage Cookie Preferences" link in the footer.
          See our <Link to="/cookie-policy" className="text-primary underline underline-offset-2">Cookie Policy</Link> for more information.
        </p>

        <div className="flex gap-2 mt-5">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(analytics, marketing)}>Save Preferences</Button>
        </div>
      </div>
    </div>
  );
};
