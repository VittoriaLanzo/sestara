import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { z } from "zod";
import sestaraLogo from "@/assets/sestara-logo.svg";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const { t } = useTranslation();
  
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const emailSchema = z.string().email(t('auth.invalid_email'));
  const passwordSchema = z.string().min(6, t('auth.password_min'));

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) newErrors.email = emailResult.error.errors[0].message;
    const passwordResult = passwordSchema.safeParse(password);
    if (!passwordResult.success) newErrors.password = passwordResult.error.errors[0].message;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes("Invalid login credentials")) {
            toast.error(t('auth.invalid_credentials'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('auth.welcome_back_toast'));
          navigate("/");
        }
      } else {
        const { error } = await signUp(email, password, displayName);
        if (error) {
          if (error.message.includes("already registered")) {
            toast.error(t('auth.already_registered'));
          } else {
            toast.error(error.message);
          }
        } else {
          toast.success(t('auth.account_created'));
          navigate("/onboarding");
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
      <SEOHead title="Sign In" description="Sign in or create your Sestara account to start learning with AI-powered roadmaps." path="/auth" />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/20 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('common.back_to_home')}
        </Button>

        <div className="flex justify-center mb-8">
          <img src={sestaraLogo} alt="Sestara" className="w-[220px] h-auto" />
        </div>

        <div className="glass-card p-8">
          <h1 className="text-2xl font-display font-bold text-foreground text-center mb-2">
            {isLogin ? t('auth.welcome_back') : t('auth.create_account')}
          </h1>
          <p className="text-muted-foreground text-center mb-6">
            {isLogin ? t('auth.sign_in_subtitle') : t('auth.sign_up_subtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="displayName">{t('auth.display_name')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input id="displayName" type="text" placeholder={t('auth.display_name_placeholder')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder={t('auth.email_placeholder')} value={email} onChange={(e) => { setEmail(e.target.value); setErrors((prev) => ({ ...prev, email: undefined })); }} className={`pl-10 ${errors.email ? "border-destructive" : ""}`} />
              </div>
              {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? "text" : "password"} placeholder="••••••••" value={password} onChange={(e) => { setPassword(e.target.value); setErrors((prev) => ({ ...prev, password: undefined })); }} className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
            </div>

            <Button type="submit" variant="gradient" size="lg" className="w-full" disabled={loading}>
              {loading ? t('common.loading') : isLogin ? t('common.sign_in') : t('auth.create_account_btn')}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? t('auth.no_account') : t('auth.have_account')}{" "}
              <button onClick={() => { setIsLogin(!isLogin); setErrors({}); }} className="text-primary hover:underline font-medium">
                {isLogin ? t('common.sign_up') : t('common.sign_in')}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
