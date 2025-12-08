/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    // 💡 It's often recommended to add autoprefixer, as Tailwind relies on it.
    tailwindcss: {},
    autoprefixer: {}, 
  },
};

export default config;