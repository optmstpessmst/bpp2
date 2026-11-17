// @ts-check
import { defineConfig } from 'astro/config';
import markdoc from '@astrojs/markdoc';

import cloudflare from '@astrojs/cloudflare';
import latexml from './src/integrations/latexml';
import { inlineTexExtension } from './src/lib/inline-math-tokenizer.mjs';

export default defineConfig({
  output: 'static',
  integrations: [markdoc({ allowHTML: true, tokenizerExtension: inlineTexExtension }), latexml()],
  adapter: cloudflare({ prerenderEnvironment: 'node' }),
});
