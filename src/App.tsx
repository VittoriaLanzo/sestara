import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { StudyTimeProvider } from "@/providers/StudyTimeProvider";
import { StudyAssistant } from "@/components/assistant/StudyAssistant";
import { LegalFooter } from "@/components/LegalFooter";
import { CookieBanner, CookieManageDialog, useCookieConsent } from "@/components/CookieConsent";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import DashboardPage from "./pages/DashboardPage";
import RoadmapView from "./pages/RoadmapView";
import TopicPage from "./pages/TopicPage";
import NotFound from "./pages/NotFound";
import ImportantDatesPage from "./pages/ImportantDatesPage";
import SettingsPage from "./pages/SettingsPage";
import TodosPage from "./pages/TodosPage";
import CustomQuizPage from "./pages/CustomQuizPage";
import ResourcesPage from "./pages/ResourcesPage";
import ChallengePage from "./pages/ChallengePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import CookiePolicyPage from "./pages/CookiePolicyPage";
import TermsPage from "./pages/TermsPage";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppContent = () => {
  const { user } = useAuth();
  const cookie = useCookieConsent();
  
  return (
    <StudyTimeProvider>
      <div className="flex flex-col min-h-screen">
        <div className="flex-1">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/cookie-policy" element={<CookiePolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/roadmap/:id" element={<ProtectedRoute><RoadmapView /></ProtectedRoute>} />
            <Route path="/roadmap/:id/resources" element={<ProtectedRoute><ResourcesPage /></ProtectedRoute>} />
            <Route path="/topic/:topicId" element={<ProtectedRoute><TopicPage /></ProtectedRoute>} />
            <Route path="/important-dates" element={<ProtectedRoute><ImportantDatesPage /></ProtectedRoute>} />
            <Route path="/todos" element={<ProtectedRoute><TodosPage /></ProtectedRoute>} />
            <Route path="/custom-quiz" element={<ProtectedRoute><CustomQuizPage /></ProtectedRoute>} />
            <Route path="/challenge/:code" element={<ProtectedRoute><ChallengePage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </div>
        <LegalFooter onManageCookies={cookie.openManage} />
      </div>
      {user && <StudyAssistant />}
      {cookie.showBanner && (
        <CookieBanner
          onAcceptAll={cookie.acceptAll}
          onRejectAll={cookie.rejectNonEssential}
          onManage={cookie.openManage}
        />
      )}
      <CookieManageDialog
        open={cookie.showManage}
        onClose={() => cookie.setShowManage(false)}
        onSave={cookie.savePreferences}
        initialAnalytics={cookie.preferences?.analytics ?? false}
        initialMarketing={cookie.preferences?.marketing ?? false}
      />
    </StudyTimeProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
