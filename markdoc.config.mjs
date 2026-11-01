import { component, defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  tags: {
    tex: {
      render: component('./src/components/Latexml.astro'),
      attributes: {
        file: { type: String },
        width: { type: String },
        height: { type: String },
      },
    },
  },
});
