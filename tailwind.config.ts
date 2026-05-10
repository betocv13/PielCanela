import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors from Piel Canela style guide
        brand: {
          brown: '#805437',      // Primary Brown
          cream: '#efeae3',      // Secondary Cream
          pink: '#e47079',       // Accent Pink (CTAs, highlights)
          green: '#74a12e',      // Accent Green (success states)
          beige: '#f0eade',      // Light Beige (cards, sections)
        },
        // Semantic colors
        primary: {
          DEFAULT: '#805437',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#efeae3',
          foreground: '#805437',
        },
        accent: {
          DEFAULT: '#e47079',
          foreground: '#ffffff',
        },
        success: {
          DEFAULT: '#74a12e',
          foreground: '#ffffff',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'serif'],
        body: ['var(--font-body)', 'sans-serif'],
        nav: ['var(--font-nav)', 'sans-serif'],
      },
      borderRadius: {
        'card': '12px',
        'button': '8px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(128, 84, 55, 0.1), 0 2px 4px -1px rgba(128, 84, 55, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(128, 84, 55, 0.1), 0 4px 6px -2px rgba(128, 84, 55, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;
