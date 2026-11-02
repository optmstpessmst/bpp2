import { Markdoc, component, defineMarkdocConfig } from '@astrojs/markdoc/config';

export default defineMarkdocConfig({
  tags: {
    tex: {
      render: component('./src/components/Latexml.astro'),
      selfClosing: true,
      attributes: {
        file: { type: String },
      },
    },
  },
  nodes: {
    fence: {
      ...Markdoc.nodes.fence,
      render: component('./src/components/MarkdocFence.astro'),
      transform(node, config) {
        return new Markdoc.Tag(
          config.nodes.fence.render,
          {
            language: node.attributes.language,
            content: node.attributes.content,
          },
          []
        );
      },
    }
  },
});