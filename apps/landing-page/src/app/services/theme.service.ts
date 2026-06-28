import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light' | 'high-contrast';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly THEME_KEY = 'arbeiters-theme';
  
  // Signal for current theme
  theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Effect to apply theme changes to DOM and localStorage
    effect(() => {
      const currentTheme = this.theme();
      document.documentElement.setAttribute('data-theme', currentTheme);
      localStorage.setItem(this.THEME_KEY, currentTheme);
    });
  }

  private getInitialTheme(): Theme {
    // Check localStorage first
    const stored = localStorage.getItem(this.THEME_KEY) as Theme;
    if (stored && ['dark', 'light', 'high-contrast'].includes(stored)) {
      return stored;
    }

    // Check system preference
    if (window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark';
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  cycleTheme(): void {
    const themes: Theme[] = ['dark', 'light', 'high-contrast'];
    const currentIndex = themes.indexOf(this.theme());
    const nextIndex = (currentIndex + 1) % themes.length;
    this.setTheme(themes[nextIndex]);
  }
}

// Made with Bob
