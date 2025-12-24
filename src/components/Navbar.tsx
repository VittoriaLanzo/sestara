import { useState } from "react";
import { Button } from "./ui/button";
import { Menu, X, Sparkles, Bell, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-accent">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl gradient-text">StudyPath</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <a href="#" className="text-sm text-foreground hover:text-primary transition-colors">Dashboard</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Roadmaps</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Quizzes</a>
            <a href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Analytics</a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Search className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </Button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <span className="text-xs font-semibold text-primary-foreground">JD</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "md:hidden overflow-hidden transition-all duration-300",
            isMenuOpen ? "max-h-64 pb-4" : "max-h-0"
          )}
        >
          <div className="flex flex-col gap-2">
            <a href="#" className="px-3 py-2 rounded-lg text-foreground bg-secondary">Dashboard</a>
            <a href="#" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Roadmaps</a>
            <a href="#" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Quizzes</a>
            <a href="#" className="px-3 py-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Analytics</a>
          </div>
        </div>
      </div>
    </nav>
  );
};
