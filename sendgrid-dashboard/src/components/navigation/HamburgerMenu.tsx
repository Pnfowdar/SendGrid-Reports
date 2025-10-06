"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";

export interface NavigationSection {
  id: string;
  label: string;
}

interface HamburgerMenuProps {
  sections: NavigationSection[];
}

export function HamburgerMenu({ sections }: HamburgerMenuProps) {
  const [open, setOpen] = useState(false);

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
      setOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className="fixed left-4 top-20 z-50 flex h-10 w-10 items-center justify-center rounded-lg border border-border/60 bg-card/90 text-foreground shadow-lg backdrop-blur transition hover:bg-card"
        aria-label="Toggle section navigation"
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav className="fixed left-4 top-32 z-50 w-64 rounded-xl border border-border/60 bg-card/95 p-4 shadow-xl backdrop-blur">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Jump to Section</h3>
            <ul className="space-y-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => scrollToSection(section.id)}
                    className="w-full rounded-lg px-3 py-2 text-left text-sm text-muted-foreground transition hover:bg-primary/10 hover:text-primary"
                  >
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </>
      )}
    </>
  );
}
