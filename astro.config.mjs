// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import markdoc from '@astrojs/markdoc';

import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'static',
  integrations: [react(), keystatic(), markdoc()],
  adapter: cloudflare(),
});