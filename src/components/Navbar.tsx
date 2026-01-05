import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Menu, X, Sparkles, Search, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  onSignOut?: () => void;
  displayName?: string;
}

export const Navbar = ({ onSignOut, displayName }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : "U";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">StudyPath</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/dashboard" className="text-sm text-foreground hover:text-primary transition-colors">Dashboard</Link>
            <Link to="/onboarding" className="text-sm text-muted-foreground hover:text-primary transition-colors">New Roadmap</Link>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate('/settings')} 
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-5 h-5" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">{initials}</span>
            </div>
            {onSignOut && (
              <Button variant="ghost" size="icon" onClick={onSignOut} className="text-muted-foreground hover:text-foreground">
                <LogOut className="w-5 h-5" />
              </Button>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        <div className={cn("md:hidden overflow-hidden transition-all duration-300", isMenuOpen ? "max-h-64 pb-4" : "max-h-0")}>
          <div className="flex flex-col gap-2">
            <Link to="/dashboard" className="px-3 py-2 rounded-lg text-foreground bg-secondary">Dashboard</Link>
            <Link to="/onboarding" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary">New Roadmap</Link>
            <Link to="/settings" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary">Settings</Link>
            {onSignOut && (
              <button onClick={onSignOut} className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary text-left">Sign Out</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
