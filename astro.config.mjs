import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
export default defineConfig({
  build: { inlineStylesheets: 'always', assets: 'assets', format: 'file' },
  vite: { plugins: [tailwindcss()], build: { assetsInlineLimit: 0 } },
});
