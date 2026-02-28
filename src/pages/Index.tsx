import { useNavigate } from "react-router-dom";
import sestaraLogo from "@/assets/sestara-logo.svg";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChevronRight, BookOpen, Target, Zap, Shield, Lock, Eye, FileCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { SEOHead } from "@/components/SEOHead";
import { useTranslation } from "react-i18next";

// Inline Hero Arc SVG — semicircular protractor with tick marks
const HeroArc = () => (
  <svg
    viewBox="0 0 800 420"
    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75vw] pointer-events-none z-0"
    style={{ opacity: 0.06 }}
    aria-hidden="true"
  >
    <path
      d="M 60 400 A 340 340 0 0 1 740 400"
      fill="none"
      stroke="hsl(227 56% 25%)"
      strokeWidth="3"
      strokeLinecap="round"
    />
    {Array.from({ length: 19 }, (_, i) => {
      const angle = Math.PI - (i * Math.PI) / 18;
      const cx = 400 + 340 * Math.cos(angle);
      const cy = 400 - 340 * Math.sin(angle);
      const ix = 400 + 320 * Math.cos(angle);
      const iy = 400 - 320 * Math.sin(angle);
      return (
        <line
          key={i}
          x1={cx}
          y1={cy}
          x2={ix}
          y2={iy}
          stroke="hsl(227 56% 25%)"
          strokeWidth={i % 3 === 0 ? "2.5" : "1.5"}
          strokeLinecap="round"
        />
      );
    })}
  </svg>
);

// Inline Alidade SVG — diagonal line with star, animated on mount
const HeroAlidade = () => {
  const lineRef = useRef<SVGPathElement>(null);
  const starRef = useRef<SVGPolygonElement>(null);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const line = lineRef.current;
    if (!line) return;
    const length = line.getTotalLength();
    line.style.strokeDasharray = `${length}`;
    line.style.strokeDashoffset = `${length}`;
    requestAnimationFrame(() => {
      line.style.transition = "stroke-dashoffset 0.8s ease-out";
      line.style.strokeDashoffset = "0";
    });
    const timer = setTimeout(() => setAnimated(true), 800);
    return () => clearTimeout(timer);
  }, []);

  const starPoints = Array.from({ length: 16 }, (_, i) => {
    const angle = (i * Math.PI) / 8 - Math.PI / 2;
    const r = i % 2 === 0 ? 12 : 5;
    return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
  }).join(" ");

  return (
    <svg
      viewBox="0 0 500 500"
      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[50vw] max-w-[500px] pointer-events-none z-0"
      style={{ opacity: 0.12 }}
      aria-hidden="true"
    >
      <path
        ref={lineRef}
        d="M 250 490 L 440 60"
        fill="none"
        stroke="hsl(38 66% 48%)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <polygon
        ref={starRef}
        points={starPoints}
        fill="hsl(38 66% 48%)"
        transform="translate(440, 60)"
        style={{
          transformOrigin: "440px 60px",
          transition: animated ? "none" : "transform 0.3s ease-out",
          transform: `translate(440px, 60px) scale(${animated ? 1 : 1.08})`,
          animation: animated ? "none" : undefined,
        }}
        className={animated ? "animate-none" : ""}
      />
    </svg>
  );
};

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard");
    }
  }, [user, loading, navigate]);

  const brandName = <span className="font-serif font-semibold text-accent">Sestara</span>;

  const features = [
    { icon: Target, title: t('landing.features.roadmaps_title'), desc: t('landing.features.roadmaps_desc') },
    { icon: BookOpen, title: t('landing.features.tracking_title'), desc: t('landing.features.tracking_desc') },
    { icon: Zap, title: t('landing.features.quizzes_title'), desc: t('landing.features.quizzes_desc') },
  ];

  const securityItems = [
    { icon: FileCheck, text: t('landing.security.gdpr') },
    { icon: Lock, text: t('landing.security.encryption') },
    { icon: Shield, text: t('landing.security.no_resale') },
    { icon: Eye, text: t('landing.security.transparency') },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden bg-primary">
      <SEOHead path="/" />
      <Navbar />
      <main className="relative z-10 container mx-auto px-4 pt-24 pb-32">
        <div className="max-w-4xl mx-auto text-center relative">
          <HeroArc />
          <HeroAlidade />

          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-accent text-sm mb-6 animate-slide-up font-sans font-medium uppercase tracking-widest">
              {t('landing.badge')}
            </div>

            <h1
              className="text-5xl md:text-7xl font-serif font-semibold text-white mb-8 hero-reveal"
              style={{ animationDelay: "0.1s", lineHeight: 1.1 }}
            >
              {t('landing.headline_start')} <span className="text-accent">{t('landing.headline_accent')}</span>
            </h1>

            <p
              className="text-lg font-sans text-white/75 mb-10 max-w-[560px] mx-auto animate-slide-up leading-relaxed"
              style={{ animationDelay: "0.2s" }}
            >
              {t('landing.subtitle')}
            </p>

            <div
              className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button
                onClick={() => navigate("/auth")}
                className="bg-white text-primary font-sans font-bold text-sm uppercase tracking-widest border-b-[3px] border-accent hover:brightness-[0.88] transition-all duration-150 h-14 px-10 rounded-xl text-lg gap-2"
              >
                {t('landing.cta')} <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-5xl mx-auto relative z-10">
          {features.map((feature, i) => (
            <div
              key={i}
              className="bg-card border border-border border-t-[3px] border-t-accent rounded-xl p-6 text-center animate-slide-up hover:-translate-y-[3px] hover:shadow-lg transition-all duration-200"
              style={{ animationDelay: `${0.4 + i * 0.1}s` }}
            >
              <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-4">
                <feature.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-serif font-semibold text-foreground mb-2 text-xl">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>

        {/* Security & Compliance */}
        <div className="mt-24 max-w-4xl mx-auto animate-slide-up relative z-10" style={{ animationDelay: "0.7s" }}>
          <div className="bg-card border border-border border-t-[3px] border-t-accent rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-serif font-medium text-2xl text-foreground">{t('landing.security.title')}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {securityItems.map((item, i) => (
                <div key={i} className="flex items-start gap-3">
                  <item.icon className="w-4 h-4 text-accent mt-0.5 shrink-0" />
                  <span className="text-sm text-muted-foreground">{item.text}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              {t('landing.security.disclaimer')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
