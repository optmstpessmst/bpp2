// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import keystatic from '@keystatic/astro';

import markdoc from '@astrojs/markdoc';

import cloudflare from '@astrojs/cloudflare';
import node from '@astrojs/node';
import latexml from './src/integrations/latexml';

const isDev = process.env.NODE_ENV === 'development';

export default defineConfig({
  output: 'static',
  integrations: [react(), keystatic(), markdoc(), latexml()],
  adapter:
    isDev
      ? node({ mode: 'standalone' })
      : cloudflare({ prerenderEnvironment: 'node' }),
});
