import { tex } from '@mdit/plugin-tex';

const MARKER_START = '\uE000BPP2MATH:';
const MARKER_END = '\uE001';

function encodeMath(source) {
  return `${MARKER_START}${Buffer.from(source, 'utf8').toString('base64')}${MARKER_END}`;
}

function normalizeInlineMath(tokens) {
  for (const token of tokens) {
    if (token.type === 'math_inline') {
      token.type = 'text';
      token.content = encodeMath(token.content);
      token.children = null;
      continue;
    }
    if (token.children) normalizeInlineMath(token.children);
  }
  return tokens;
}

export const inlineTexExtension = {
  setup(parser) {
    parser.use(tex, {
      delimiters: 'dollars',
      // Required option; the renderer is never invoked since Markdoc builds its
      // AST straight from tokens, but the plugin validates it as a function.
      render: () => '',
    });

    // Use tex fence for block math instead of $$$
    parser.block.ruler.disable(['math_block_dollar']);

    // The tex plugin emits `math_inline` tokens at parse time, but Markdoc builds
    // its AST straight from tokens and never runs markdown-it's renderer, so
    // rewrite them into protected markers as a core rule.
    parser.core.ruler.push('bpp2_math_normalize', (state) => {
      normalizeInlineMath(state.tokens);
    });
  },
};

export function transformInlineMathText(content, Tag, render) {
  const markerPattern = /\uE000BPP2MATH:([A-Za-z0-9+/]+={0,2})\uE001/g;
  const children = [];
  let lastIndex = 0;
  let match;

  while ((match = markerPattern.exec(content))) {
    if (match.index > lastIndex) children.push(content.slice(lastIndex, match.index));
    children.push(new Tag(render, {
      raw: Buffer.from(match[1], 'base64').toString('utf8'),
    }, []));
    lastIndex = markerPattern.lastIndex;
  }

  if (lastIndex === 0) return content;
  if (lastIndex < content.length) children.push(content.slice(lastIndex));
  return children;
}
