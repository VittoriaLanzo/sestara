import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { ChevronLeft, User, Languages, Save, Loader2, Download, Trash2, Shield } from "lucide-react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'ur', name: 'Urdu (اردو)' },
  { code: 'es', name: 'Spanish (Español)' },
  { code: 'fr', name: 'French (Français)' },
  { code: 'de', name: 'German (Deutsch)' },
  { code: 'pt', name: 'Portuguese (Português)' },
  { code: 'zh', name: 'Chinese (中文)' },
  { code: 'ja', name: 'Japanese (日本語)' },
  { code: 'ko', name: 'Korean (한국어)' },
  { code: 'ar', name: 'Arabic (العربية)' },
  { code: 'ru', name: 'Russian (Русский)' },
  { code: 'it', name: 'Italian (Italiano)' },
  { code: 'nl', name: 'Dutch (Nederlands)' },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const { t } = useTranslation();
  
  const [displayName, setDisplayName] = useState('');
  const [studyLanguage, setStudyLanguage] = useState('en');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setStudyLanguage(profile.study_language || 'en');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const success = await updateProfile({ display_name: displayName || null, study_language: studyLanguage });
    setSaving(false);
    if (success) { toast.success(t('settings.saved_success')); } else { toast.error(t('settings.saved_error')); }
  };

  const handleSignOut = async () => { await signOut(); navigate('/auth'); };

  const handleExportData = async () => {
    setExporting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("export-user-data", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.error) throw new Error(res.error.message || "Export failed");

      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sestara-data-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(t('settings.export_success'));
    } catch (err: any) {
      console.error("Export error:", err);
      toast.error(err.message || t('settings.export_error'));
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE MY ACCOUNT") return;

    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await supabase.functions.invoke("delete-user-account", {
        headers: { Authorization: `Bearer ${token}` },
        body: { confirmation: "DELETE MY ACCOUNT" },
      });

      if (res.error) throw new Error(res.error.message || "Deletion failed");

      toast.success(t('settings.account_deleted'));
      await signOut();
      navigate('/');
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || t('settings.delete_error'));
    } finally {
      setDeleting(false);
      setDeleteConfirmText('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <main className="relative z-10 container mx-auto px-4 pt-24 pb-12 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-6 text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-4 h-4 mr-2" />
          {t('common.back')}
        </Button>

        <h1 className="text-3xl font-display font-bold text-foreground mb-8">{t('settings.title')}</h1>

        <div className="space-y-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />{t('settings.profile')}</CardTitle>
              <CardDescription>{t('settings.manage_account')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t('common.email')}</Label>
                <Input value={user?.email || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label>{t('settings.display_name')}</Label>
                <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={t('settings.enter_name')} />
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Languages className="w-5 h-5" />{t('settings.study_language')}</CardTitle>
              <CardDescription>{t('settings.study_language_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label>{t('settings.preferred_language')}</Label>
                <Select value={studyLanguage} onValueChange={setStudyLanguage}>
                  <SelectTrigger><SelectValue placeholder={t('settings.select_language')} /></SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (<SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-2">{t('settings.language_note')}</p>
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
            {saving ? (<><Loader2 className="w-4 h-4 animate-spin" />{t('common.saving')}</>) : (<><Save className="w-4 h-4" />{t('settings.save_changes')}</>)}
          </Button>

          <Button variant="outline" onClick={handleSignOut} className="w-full text-destructive hover:text-destructive">
            {t('common.sign_out')}
          </Button>

          {/* GDPR: Data & Privacy */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />{t('settings.data_privacy')}</CardTitle>
              <CardDescription>{t('settings.data_privacy_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Export Data */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium text-foreground">{t('settings.export_data')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.export_data_desc')}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportData}
                  disabled={exporting}
                  className="gap-2 shrink-0"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {exporting ? t('settings.exporting') : t('settings.download')}
                </Button>
              </div>

              {/* Delete Account */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                <div>
                  <p className="text-sm font-medium text-destructive">{t('settings.delete_account')}</p>
                  <p className="text-xs text-muted-foreground">{t('settings.delete_account_desc')}</p>
                </div>
                <AlertDialog onOpenChange={(open) => { if (!open) setDeleteConfirmText(''); }}>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" size="sm" className="gap-2 shrink-0">
                      <Trash2 className="w-4 h-4" />
                      {t('settings.delete')}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-destructive">{t('settings.delete_confirm_title')}</AlertDialogTitle>
                      <AlertDialogDescription className="space-y-3">
                        <span className="block">{t('settings.delete_confirm_desc')}</span>
                        <span className="block font-medium text-foreground">{t('settings.delete_confirm_type')}</span>
                        <Input
                          value={deleteConfirmText}
                          onChange={(e) => setDeleteConfirmText(e.target.value)}
                          placeholder="DELETE MY ACCOUNT"
                          className="font-mono"
                        />
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => setDeleteConfirmText('')}>{t('common.cancel')}</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        disabled={deleteConfirmText !== "DELETE MY ACCOUNT" || deleting}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        {t('settings.delete_permanently')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;
