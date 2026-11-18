import { Markdoc, component, defineMarkdocConfig } from '@astrojs/markdoc/config';
import { transformInlineMathText } from './src/lib/inline-math-tokenizer.mjs';

const inlineMathRender = component('./src/components/InlineMath.astro');

export default defineMarkdocConfig({
  tags: {
    tex: {
      render: component('./src/components/Latexml.astro'),
      selfClosing: true,
      attributes: {
        file: { type: String },
      },
      transform(node, config) {
        return new Markdoc.Tag(
          config.tags.tex.render,
          {
            file: node.attributes.file,
            sourceFilePath: node.__sourceFilePath, //  this relies on a patch to the markdoc integration
          },
          []
        );
      },
    },
  },
  nodes: {
    text: {
      ...Markdoc.nodes.text,
      render: inlineMathRender,
      transform(node, config) {
        return transformInlineMathText(node.attributes.content, Markdoc.Tag, config.nodes.text.render);
      },
    },
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
