import { createContext, useContext, useMemo } from "react";
import { CookiePreferences, useCookieConsent } from "@/components/CookieConsent";

type ConsentContextType = {
  /** True only after the user explicitly opted into analytics cookies */
  analyticsAllowed: boolean;
  /** True only after the user explicitly opted into marketing cookies */
  marketingAllowed: boolean;
  /** Raw preferences (null = banner not yet answered) */
  preferences: CookiePreferences | null;
  /** Open the manage-cookies dialog */
  openManage: () => void;
};

const ConsentContext = createContext<ConsentContextType>({
  analyticsAllowed: false,
  marketingAllowed: false,
  preferences: null,
  openManage: () => {},
});

export const useConsent = () => useContext(ConsentContext);

/**
 * Gate any analytics or marketing script behind this hook.
 * Example:
 *   const { analyticsAllowed } = useConsent();
 *   useEffect(() => { if (analyticsAllowed) initAnalytics(); }, [analyticsAllowed]);
 */
export const ConsentProvider = ({
  cookie,
  children,
}: {
  cookie: ReturnType<typeof useCookieConsent>;
  children: React.ReactNode;
}) => {
  const value = useMemo<ConsentContextType>(
    () => ({
      analyticsAllowed: cookie.preferences?.analytics === true,
      marketingAllowed: cookie.preferences?.marketing === true,
      preferences: cookie.preferences,
      openManage: cookie.openManage,
    }),
    [cookie.preferences, cookie.openManage],
  );

  return <ConsentContext.Provider value={value}>{children}</ConsentContext.Provider>;
};
