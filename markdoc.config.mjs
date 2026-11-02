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
      render: component('./src/components/Latexml.astro'),
      transform(node, config) {
        if (node.attributes.language === 'tex') {
          return new Markdoc.Tag(config.nodes.fence.render, {
            raw: node.attributes.content,
          }, []);
        }
        return Markdoc.nodes.fence.transform(node, config);
      },
    },
  },
});
