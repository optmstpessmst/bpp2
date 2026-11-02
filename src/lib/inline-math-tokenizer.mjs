const MARKER_START = "\uE000BPP2MATH:";
const MARKER_END = "\uE001";
const INSTALL_FLAG = "__bpp2InlineMathInstanceRuleInstalled";
const RULE_NAME = "bpp2_inline_math";
const PROTOTYPE_FLAG = "__bpp2InlineMathPrototypePatched";

function encodeMath(source) {
  return `${MARKER_START}${Buffer.from(source, "utf8").toString("base64")}${MARKER_END}`;
}

function isEscaped(source, index) {
  let backslashes = 0;
  for (let i = index - 1; i >= 0 && source[i] === "\\"; i--) backslashes++;
  return backslashes % 2 === 1;
}

function inlineMathRule(state, silent) {
  const { src, pos } = state;
  if (
    src[pos] !== "$" ||
    src[pos + 1] === "$" ||
    src[pos - 1] === "$" ||
    isEscaped(src, pos)
  ) return false;

  let end = pos + 1;
  while (end < src.length && src[end] !== "\n") {
    if (
      src[end] === "$" &&
      src[end - 1] !== "$" &&
      src[end + 1] !== "$" &&
      !isEscaped(src, end)
    ) break;
    end++;
  }

  if (end === src.length || src[end] !== "$" || end === pos + 1) return false;
  if (silent) return true;

  const token = state.push("text", "", 0);
  token.content = encodeMath(src.slice(pos + 1, end));
  state.pos = end + 1;
  return true;
}

export function installInlineMathRule(Markdoc) {
  const prototype = Markdoc.Tokenizer.prototype;
  if (prototype[PROTOTYPE_FLAG]) return;

  const tokenize = prototype.tokenize;
  prototype.tokenize = function (source, ...args) {
    if (!this[INSTALL_FLAG]) {
      const ruler = this.parser?.inline?.ruler;
      if (!ruler?.before) {
        throw new Error("Cannot install inline math: Markdoc tokenizer no longer exposes its Markdown-it parser.");
      }
      ruler.before("escape", RULE_NAME, inlineMathRule);
      Object.defineProperty(this, INSTALL_FLAG, { value: true });
    }

    return tokenize.call(this, source, ...args);
  };

  Object.defineProperty(prototype, PROTOTYPE_FLAG, { value: true });
}

export function transformInlineMathText(content, Tag, render) {
  const markerPattern = /\uE000BPP2MATH:([A-Za-z0-9+/]+={0,2})\uE001/g;
  const children = [];
  let lastIndex = 0;
  let match;

  while ((match = markerPattern.exec(content))) {
    if (match.index > lastIndex) children.push(content.slice(lastIndex, match.index));
    children.push(new Tag(render, {
      raw: Buffer.from(match[1], "base64").toString("utf8"),
    }, []));
    lastIndex = markerPattern.lastIndex;
  }

  if (lastIndex === 0) return content;
  if (lastIndex < content.length) children.push(content.slice(lastIndex));
  return children;
}
