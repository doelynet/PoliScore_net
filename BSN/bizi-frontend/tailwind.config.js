/** @type {import('tailwindcss').Config} */
export default {
    content: ['./index.html', './src/**/*.{js,jsx}'],

    // 'class' strategy: dark mode activates when <html> has class="dark"
    // Our themeStore adds/removes this class automatically.
    darkMode: 'class',

    theme: {
        extend: {},
    },
    plugins: [],
};