import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { GlobalSearch } from "./GlobalSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Menu, X, Sparkles, Search, LogOut, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
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
              <Link to="/important-dates" className="text-sm text-muted-foreground hover:text-primary transition-colors">Productivity Hub</Link>
            </div>

            <div className="hidden md:flex items-center gap-2">
              {/* Search Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchOpen(true)}
                className="text-muted-foreground hover:text-foreground gap-2 px-3"
              >
                <Search className="w-4 h-4" />
                <span className="text-xs">Search</span>
                <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 px-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                      <span className="text-xs font-semibold text-primary-foreground">{initials}</span>
                    </div>
                    <span className="text-sm font-medium hidden lg:inline">{displayName}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{displayName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className={cn("md:hidden overflow-hidden transition-all duration-300", isMenuOpen ? "max-h-80 pb-4" : "max-h-0")}>
            <div className="flex flex-col gap-2">
              {/* Mobile Search */}
              <button
                onClick={() => { setSearchOpen(true); setIsMenuOpen(false); }}
                className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary flex items-center gap-2"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              <Link to="/dashboard" className="px-3 py-2 rounded-lg text-foreground bg-secondary">Dashboard</Link>
              <Link to="/onboarding" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary">New Roadmap</Link>
              <Link to="/important-dates" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary">Productivity Hub</Link>
              <Link to="/settings" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
              <button 
                onClick={handleSignOut} 
                className="px-3 py-2 rounded-lg text-destructive hover:bg-secondary text-left flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
};
