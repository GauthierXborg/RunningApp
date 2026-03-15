/** @type {import('tailwindcss').Config} */
module.exports = {
  presets: [require('nativewind/preset')],
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0A0A0F',
        surface: '#141420',
        surfaceLight: '#1E1E30',
        surfaceBright: '#282840',
        accent: '#FF6A3D',
        accentDark: '#E55A2D',
        accentSoft: 'rgba(255, 106, 61, 0.15)',
        brand: '#FF6A3D',
        textPrimary: '#FFFFFF',
        textSecondary: '#9595B0',
        textMuted: '#5E5E78',
        divider: '#1E1E32',
        success: '#34D399',
        error: '#FF5555',
      },
    },
  },
  plugins: [],
};
