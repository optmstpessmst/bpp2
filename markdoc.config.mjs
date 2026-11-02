import { Markdoc, component, defineMarkdocConfig } from '@astrojs/markdoc/config';
const Latexml = component('./src/components/Latexml.astro');
const Math = component('./src/components/Math.astro');

export default defineMarkdocConfig({
  tags: {
    tex: {
      render: Latexml,
      selfClosing: true,
      attributes: {
        file: { type: String },
      },
    },
    math: {
      render: Math,
      selfClosing: true,
      attributes: {
        formula: { type: String },
      },
    },
  },
  nodes: {
    fence: {
      ...Markdoc.nodes.fence,
      transform(node, config) {
        if (node.attributes.language === 'tex') {
          return new Markdoc.Tag(
            config.tags.tex.render, 
            { raw: node.attributes.content }, 
            []
          );
        } 
        
        if (node.attributes.language === 'math') {
          return new Markdoc.Tag(
            config.tags.math.render, 
            { raw: node.attributes.content }, 
            []
          );
        }

        return Markdoc.nodes.fence.transform(node, config);
      },
    },
  },
});