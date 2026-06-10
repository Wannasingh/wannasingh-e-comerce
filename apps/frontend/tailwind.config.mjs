/** @type {import('tailwindcss').Config} */
export default {
  // ── Content sources ───────────────────────────────────────────────────────
  content: [
    "./src/**/*.{astro,html,js,jsx,ts,tsx,mdx}",
    // Include any shadcn/ui components registered in this project
    "./src/components/ui/**/*.{ts,tsx}",
  ],

  // ── Dark mode via class strategy ─────────────────────────────────────────
  darkMode: ["class"],

  theme: {
    extend: {
      // ── shadcn/ui Design Tokens ─────────────────────────────────────────
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Brand colors
        brand: {
          50: "hsl(262, 100%, 97%)",
          100: "hsl(262, 94%, 93%)",
          200: "hsl(262, 91%, 86%)",
          300: "hsl(262, 87%, 75%)",
          400: "hsl(262, 82%, 63%)",
          500: "hsl(262, 78%, 53%)",
          600: "hsl(262, 74%, 45%)",
          700: "hsl(262, 70%, 37%)",
          800: "hsl(262, 66%, 30%)",
          900: "hsl(262, 62%, 24%)",
          950: "hsl(262, 58%, 14%)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["Inter Variable", "Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease-out",
        shimmer: "shimmer 2s infinite linear",
      },
    },
  },

  plugins: [],
};
