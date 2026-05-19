import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  site: 'https://aetherion-archive.netlify.app',
  srcDir: 'src',
  publicDir: 'public',
  outDir: 'dist',
  vite: {
    plugins: [tailwindcss()],
  },
});
