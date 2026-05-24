/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#E95C2F',
          dark: '#C94820',
          light: '#F07A52',
        },
        veda: {
          dark: '#1C1C1E',
          gray: '#F2F2F7',
          border: '#E5E5EA',
          text: '#1C1C1E',
          muted: '#8E8E93',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 4px 0 rgba(0,0,0,0.08)',
        'card-hover': '0 4px 16px 0 rgba(0,0,0,0.12)',
      },
    },
  },
  plugins: [],
};
