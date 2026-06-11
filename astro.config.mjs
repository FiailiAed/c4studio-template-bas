// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import clerk from '@clerk/astro';
import vercel from '@astrojs/vercel';
import svelte from '@astrojs/svelte';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Set SITE_URL in your deployment env vars (e.g. https://yourdomain.com)
  site: process.env.SITE_URL,
  output: 'server',
  adapter: vercel(),
  integrations: [clerk(), svelte(), sitemap()],
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: ['**/convex/_generated/**'],
      },
    },
  },
});
