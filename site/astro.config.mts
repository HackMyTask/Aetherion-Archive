import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  output: 'static',
  site: 'https://aetherion-archive.pages.dev',
  srcDir: 'src',
  publicDir: 'public',
  outDir: 'dist',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
