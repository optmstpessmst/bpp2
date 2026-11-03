// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import markdoc from '@astrojs/markdoc';

import cloudflare from '@astrojs/cloudflare';
import latexml from './src/integrations/latexml';
import decapLocal from './src/integrations/decap-local';
import { inlineTexExtension } from './src/lib/inline-math-tokenizer.mjs';

export default defineConfig({
  output: 'static',
  integrations: [react(), markdoc({ tokenizerExtension: inlineTexExtension }), latexml(), decapLocal()],
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
});
