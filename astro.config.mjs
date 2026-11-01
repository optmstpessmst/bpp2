// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import markdoc from '@astrojs/markdoc';

import cloudflare from '@astrojs/cloudflare';
import latexml from './src/integrations/latexml';

export default defineConfig({
  output: 'static',
  integrations: [react(), keystatic(), markdoc(), latexml()],
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
});
