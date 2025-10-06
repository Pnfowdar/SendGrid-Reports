"use client";

import { useState, useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { 
  BarChart3, 
  Target, 
  AlertCircle, 
  TrendingUp, 
  PieChart, 
  Table, 
  Filter,
  Zap,
  Activity,
  Search,
  Layers,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/utils/cn";

export interface SidebarSection {
  id: string;
  label: string;
  icon: string;
}

interface SidebarProps {
  sections: SidebarSection[];
}

const iconMap: Record<string, LucideIcon> = {
  "filters": Filter,
  "insights": Target,
  "bounce-warnings": AlertCircle,
  "metrics": BarChart3,
  "charts": TrendingUp,
  "figures": Table,
  "funnel": Zap,
  "sequences": Activity,
  "activity": Search,
  "categories": Layers,
  "summary": PieChart,
  "top-openers": TrendingUp,
  "top-clickers": Target,
  "cold-leads": AlertCircle,
  "all-contacts": Table,
  "hot-leads": Target,
  "warm-leads": TrendingUp,
  "at-risk": AlertCircle,
};

export function Sidebar({ sections }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Default to expanded on desktop
  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1280;
      setIsDesktop(desktop);
      setIsExpanded(desktop);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Track active section on scroll
  useEffect(() => {
    const handleScroll = () => {
      const sectionElements = sections.map(s => ({
        id: s.id,
        element: document.getElementById(s.id),
      }));

      for (const { id, element } of sectionElements) {
        if (element) {
          const rect = element.getBoundingClientRect();
          if (rect.top >= 0 && rect.top <= 200) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
      setActiveSection(id);
    }
  };

  return (
    <>
      {/* Mobile toggle button */}
      {!isDesktop && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="fixed left-4 top-20 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-border/60 bg-card shadow-lg transition hover:bg-muted"
          aria-label="Open navigation"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}

      {/* Overlay for mobile */}
      {!isDesktop && isExpanded && (
        <div
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsExpanded(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card/95 border-r border-border/60 backdrop-blur-sm transition-transform duration-300 z-40 flex flex-col",
          isDesktop ? (isExpanded ? "w-64" : "w-16") : "w-64",
          isDesktop ? "translate-x-0" : isExpanded ? "translate-x-0 shadow-2xl" : "-translate-x-full pointer-events-none"
        )}
      >
        {/* Toggle Button */}
        {isDesktop ? (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-border/60 bg-card shadow-md transition hover:bg-muted"
            aria-label={isExpanded ? "Collapse sidebar" : "Expand sidebar"}
          >
            {isExpanded ? (
              <ChevronLeft className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-full border border-border/60 bg-card/80 shadow-md transition hover:bg-muted"
            aria-label="Close navigation"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-6">
          <ul className="space-y-1">
            {sections.map((section) => {
              const Icon = iconMap[section.id] || BarChart3;
              const isActive = activeSection === section.id;

              return (
                <li key={section.id}>
                  <button
                    onClick={() => {
                      scrollToSection(section.id);
                      if (!isDesktop) {
                        setIsExpanded(false);
                      }
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                    title={!isDesktop && !isExpanded ? section.label : undefined}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    {(isDesktop && isExpanded) || (!isDesktop && isExpanded) ? (
                      <span className="truncate">{section.label}</span>
                    ) : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
