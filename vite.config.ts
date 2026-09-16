import { defineConfig } from 'vite';

// relative base so the build works both locally and under GitHub Pages /<repo>/
export default defineConfig({
  base: './',
  server: { port: 5173 },
});
