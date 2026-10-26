/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // The section colour map is a core system: its utilities must survive
  // purging even if a class name only ever appears inside lib/navigation.
  safelist: [
    {
      pattern: /^(bg|text|ring|border)-(section-(courses|tools|games|quizzes|library|roadmaps|languages|brand)(-soft)?)$/,
      variants: ['hover', 'focus', 'dark', 'dark:hover'],
    },
    {
      pattern: /^bg-gradient-section-(courses|tools|games|quizzes|library|roadmaps|languages)$/,
    },
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // Semantic tokens — the only colours components should reference.
        border: "hsl(var(--border) / <alpha-value>)",
        'border-strong': "hsl(var(--border-strong) / <alpha-value>)",
        'border-subtle': "hsl(var(--border-subtle) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        'foreground-muted': "hsl(var(--foreground-muted) / <alpha-value>)",
        'foreground-subtle': "hsl(var(--foreground-subtle) / <alpha-value>)",
        surface: "hsl(var(--surface) / <alpha-value>)",
        'surface-sunken': "hsl(var(--surface-sunken) / <alpha-value>)",
        'surface-raised': "hsl(var(--surface-raised) / <alpha-value>)",
        'surface-overlay': "hsl(var(--surface-overlay) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          hover: "hsl(var(--primary-hover) / <alpha-value>)",
          active: "hsl(var(--primary-active) / <alpha-value>)",
          soft: "hsl(var(--primary-soft) / <alpha-value>)",
          'soft-foreground': "hsl(var(--primary-soft-foreground) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          hover: "hsl(var(--accent-hover) / <alpha-value>)",
          soft: "hsl(var(--accent-soft) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        success: {
          DEFAULT: "hsl(var(--success) / <alpha-value>)",
          soft: "hsl(var(--success-soft) / <alpha-value>)",
          foreground: "hsl(var(--success-foreground) / <alpha-value>)",
        },
        warning: {
          DEFAULT: "hsl(var(--warning) / <alpha-value>)",
          soft: "hsl(var(--warning-soft) / <alpha-value>)",
          foreground: "hsl(var(--warning-foreground) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "hsl(var(--danger) / <alpha-value>)",
          soft: "hsl(var(--danger-soft) / <alpha-value>)",
          foreground: "hsl(var(--danger-foreground) / <alpha-value>)",
        },
        info: {
          DEFAULT: "hsl(var(--info) / <alpha-value>)",
          soft: "hsl(var(--info-soft) / <alpha-value>)",
          foreground: "hsl(var(--info-foreground) / <alpha-value>)",
        },
        code: {
          DEFAULT: "hsl(var(--code-bg) / <alpha-value>)",
          fg: "hsl(var(--code-fg) / <alpha-value>)",
          header: "hsl(var(--code-header) / <alpha-value>)",
          border: "hsl(var(--code-border) / <alpha-value>)",
          muted: "hsl(var(--code-muted) / <alpha-value>)",
        },
        // The site's colour map — one colour per top-level section.
        section: {
          courses: {
            DEFAULT: "hsl(var(--section-courses) / <alpha-value>)",
            soft: "hsl(var(--section-courses-soft) / <alpha-value>)",
          },
          tools: {
            DEFAULT: "hsl(var(--section-tools) / <alpha-value>)",
            soft: "hsl(var(--section-tools-soft) / <alpha-value>)",
          },
          games: {
            DEFAULT: "hsl(var(--section-games) / <alpha-value>)",
            soft: "hsl(var(--section-games-soft) / <alpha-value>)",
          },
          quizzes: {
            DEFAULT: "hsl(var(--section-quizzes) / <alpha-value>)",
            soft: "hsl(var(--section-quizzes-soft) / <alpha-value>)",
          },
          library: {
            DEFAULT: "hsl(var(--section-library) / <alpha-value>)",
            soft: "hsl(var(--section-library-soft) / <alpha-value>)",
          },
          roadmaps: {
            DEFAULT: "hsl(var(--section-roadmaps) / <alpha-value>)",
            soft: "hsl(var(--section-roadmaps-soft) / <alpha-value>)",
          },
          languages: {
            DEFAULT: "hsl(var(--section-languages) / <alpha-value>)",
            soft: "hsl(var(--section-languages-soft) / <alpha-value>)",
          },
          brand: {
            DEFAULT: "hsl(var(--brand-text) / <alpha-value>)",
            soft: "hsl(var(--primary-soft) / <alpha-value>)",
          },
        },
        // The neutral ramp used across the site. Aliased to the slate values
        // behind the semantic tokens so `gray-*` utilities stay in the same
        // family as `foreground` / `muted-foreground`.
        gray: {
          50: 'hsl(var(--slate-50) / <alpha-value>)',
          100: 'hsl(var(--slate-100) / <alpha-value>)',
          200: 'hsl(var(--slate-200) / <alpha-value>)',
          300: 'hsl(var(--slate-300) / <alpha-value>)',
          400: 'hsl(var(--slate-400) / <alpha-value>)',
          500: 'hsl(var(--slate-500) / <alpha-value>)',
          600: 'hsl(var(--slate-600) / <alpha-value>)',
          700: 'hsl(var(--slate-700) / <alpha-value>)',
          800: 'hsl(var(--slate-800) / <alpha-value>)',
          900: 'hsl(var(--slate-900) / <alpha-value>)',
          950: 'hsl(var(--slate-950) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        full: "var(--radius-full)",
      },
      backgroundImage: {
        brand: "var(--brand-gradient)",
        'brand-hover': "var(--brand-gradient-hover)",
        'brand-soft': "var(--brand-gradient-soft)",
        'brand-mark': "var(--brand-mark-gradient)",
        'brand-glow': "var(--brand-glow)",
        // `gradient-section-*` (not `bg-section-*`) so these never collide
        // with the `bg-section-*` colour utilities above.
        'gradient-section-courses': "linear-gradient(135deg, hsl(var(--section-courses-from)) 0%, hsl(var(--section-courses-to)) 100%)",
        'gradient-section-tools': "linear-gradient(135deg, hsl(var(--section-tools-from)) 0%, hsl(var(--section-tools-to)) 100%)",
        'gradient-section-games': "linear-gradient(135deg, hsl(var(--section-games-from)) 0%, hsl(var(--section-games-to)) 100%)",
        'gradient-section-quizzes': "linear-gradient(135deg, hsl(var(--section-quizzes-from)) 0%, hsl(var(--section-quizzes-to)) 100%)",
        'gradient-section-library': "linear-gradient(135deg, hsl(var(--section-library-from)) 0%, hsl(var(--section-library-to)) 100%)",
        'gradient-section-roadmaps': "linear-gradient(135deg, hsl(var(--section-roadmaps-from)) 0%, hsl(var(--section-roadmaps-to)) 100%)",
        'gradient-section-languages': "linear-gradient(135deg, hsl(var(--section-languages-from)) 0%, hsl(var(--section-languages-to)) 100%)",
        'gradient-section-courses-soft': "linear-gradient(135deg, hsl(var(--section-courses-soft)) 0%, hsl(var(--section-courses-soft)) 100%)",
        'gradient-section-tools-soft': "linear-gradient(135deg, hsl(var(--section-tools-soft)) 0%, hsl(var(--section-tools-soft)) 100%)",
        'gradient-section-games-soft': "linear-gradient(135deg, hsl(var(--section-games-soft)) 0%, hsl(var(--section-games-soft)) 100%)",
        'gradient-section-quizzes-soft': "linear-gradient(135deg, hsl(var(--section-quizzes-soft)) 0%, hsl(var(--section-quizzes-soft)) 100%)",
        'gradient-section-library-soft': "linear-gradient(135deg, hsl(var(--section-library-soft)) 0%, hsl(var(--section-library-soft)) 100%)",
        'gradient-section-roadmaps-soft': "linear-gradient(135deg, hsl(var(--section-roadmaps-soft)) 0%, hsl(var(--section-roadmaps-soft)) 100%)",
        'gradient-section-languages-soft': "linear-gradient(135deg, hsl(var(--section-languages-soft)) 0%, hsl(var(--section-languages-soft)) 100%)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        DEFAULT: "var(--shadow)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
        xl: "var(--shadow-xl)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        'in-out': "var(--ease-in-out)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        DEFAULT: "var(--duration)",
        slow: "var(--duration-slow)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}
