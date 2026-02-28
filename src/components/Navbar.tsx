import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "./ui/button";
import { GlobalSearch } from "./GlobalSearch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Menu, X, Search, LogOut, Settings, User, LayoutDashboard, Map, Bell, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import sestaraLogo from "@/assets/sestara-logo.svg";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'User';
  const initials = displayName.slice(0, 2).toUpperCase();

  const isActive = (path: string) => location.pathname === path;

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

  useEffect(() => {
    const handleScroll = () => setScrolledPastHero(window.scrollY > 400);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const navLinkClass = (path: string) => cn(
    "text-sm font-sans font-semibold transition-colors flex items-center gap-1.5",
    "relative after:absolute after:bottom-[-4px] after:left-0 after:h-[2px] after:bg-accent",
    "after:transition-all after:duration-200 after:ease-out",
    isActive(path)
      ? "text-foreground after:w-full"
      : "text-muted-foreground hover:text-foreground after:w-0 hover:after:w-full"
  );

  const mobileLinkClass = (path: string) => cn(
    "px-3 py-2 rounded-lg flex items-center gap-2 transition-colors",
    isActive(path)
      ? "text-accent bg-accent/10 font-medium"
      : "text-muted-foreground hover:bg-accent/5"
  );

  return (
    <>
      <nav className={cn(
        "fixed top-0 left-0 right-0 z-50 bg-background backdrop-blur-xl transition-all duration-300",
        scrolledPastHero ? "border-b border-border" : "border-b border-transparent"
      )}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2">
              <img
                src={sestaraLogo}
                alt="Sestara"
                className="w-[120px] md:w-[160px] h-auto flex-shrink-0 mt-2"
              />
            </Link>

            {/* Authenticated nav links */}
            {user && (
              <div className="hidden md:flex items-center gap-6">
                <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                  <LayoutDashboard className="w-4 h-4" />
                  Dashboard
                </Link>
                <Link to="/onboarding" className={navLinkClass('/onboarding')}>
                  <Map className="w-4 h-4" />
                  New Roadmap
                </Link>
                <Link to="/important-dates" className={navLinkClass('/important-dates')}>
                  <Bell className="w-4 h-4" />
                  Reminders
                </Link>
                <Link to="/custom-quiz" className={navLinkClass('/custom-quiz')}>
                  <GraduationCap className="w-4 h-4" />
                  Practice
                </Link>
              </div>
            )}

            {/* Right side */}
            <div className="hidden md:flex items-center gap-2">
              {user ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchOpen(true)}
                    className="text-muted-foreground hover:text-foreground border-border hover:border-foreground/40 hover:bg-accent/5 gap-2 px-3"
                  >
                    <Search className="w-4 h-4" />
                    <span className="text-xs">Search</span>
                    <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                      <span className="text-xs">⌘</span>K
                    </kbd>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="gap-2 px-2 hover:bg-accent/5">
                        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                          <span className="text-xs font-semibold text-white">{initials}</span>
                        </div>
                        <span className="text-sm font-medium text-foreground hidden lg:inline">{displayName}</span>
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
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/auth")}
                    className="text-muted-foreground hover:text-foreground hover:bg-accent/5"
                  >
                    Sign In
                  </Button>
                  <Button
                    onClick={() => navigate("/auth")}
                    className="bg-primary text-primary-foreground font-sans font-bold text-sm uppercase tracking-widest border-b-[3px] border-accent hover:brightness-[0.88] transition-all duration-150"
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </div>

            <Button variant="ghost" size="icon" className="md:hidden text-foreground hover:bg-accent/5" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile Menu */}
          <div className={cn("md:hidden overflow-hidden transition-all duration-300", isMenuOpen ? "max-h-96 pb-4" : "max-h-0")}>
            <div className="flex flex-col gap-2">
              {user ? (
                <>
                  <button
                    onClick={() => { setSearchOpen(true); setIsMenuOpen(false); }}
                    className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent/5 flex items-center gap-2"
                  >
                    <Search className="w-4 h-4" />
                    Search
                  </button>
                  <Link to="/dashboard" className={mobileLinkClass('/dashboard')} onClick={() => setIsMenuOpen(false)}>
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <Link to="/onboarding" className={mobileLinkClass('/onboarding')} onClick={() => setIsMenuOpen(false)}>
                    <Map className="w-4 h-4" />
                    New Roadmap
                  </Link>
                  <Link to="/important-dates" className={mobileLinkClass('/important-dates')} onClick={() => setIsMenuOpen(false)}>
                    <Bell className="w-4 h-4" />
                    Reminders
                  </Link>
                  <Link to="/custom-quiz" className={mobileLinkClass('/custom-quiz')} onClick={() => setIsMenuOpen(false)}>
                    <GraduationCap className="w-4 h-4" />
                    Practice
                  </Link>
                  <Link to="/settings" className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent/5 flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button 
                    onClick={handleSignOut} 
                    className="px-3 py-2 rounded-lg text-destructive hover:bg-accent/5 text-left flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}
                    className="px-3 py-2 rounded-lg text-muted-foreground hover:bg-accent/5 flex items-center gap-2"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => { navigate("/auth"); setIsMenuOpen(false); }}
                    className="px-3 py-2 rounded-lg text-accent font-semibold hover:bg-accent/5 flex items-center gap-2"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {user && <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />}
    </>
  );
};
