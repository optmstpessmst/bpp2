import assert from 'node:assert/strict';
import test from 'node:test';
import { Markdoc } from '@astrojs/markdoc/config';
import {
  installInlineMathRule,
  transformInlineMathText,
} from '../src/lib/inline-math-tokenizer.mjs';

installInlineMathRule(Markdoc);

function collectTokens(tokens, seen = new Set()) {
  const collected = [];
  for (const token of tokens) {
    if (seen.has(token)) continue;
    seen.add(token);
    collected.push(token);
    if (token.children) collected.push(...collectTokens(token.children, seen));
  }
  return collected;
}

function inlineTokens(source) {
  return collectTokens(new Markdoc.Tokenizer().tokenize(source));
}

function mathSources(tokens) {
  return collectTokens(tokens)
    .filter((token) => token.type === 'text')
    .flatMap((token) => [...token.content.matchAll(/\uE000BPP2MATH:([A-Za-z0-9+/]+={0,2})\uE001/g)])
    .map((match) => Buffer.from(match[1], 'base64').toString('utf8'));
}

test('captures raw TeX before Markdown escape processing', () => {
  const tokens = new Markdoc.Tokenizer().tokenize(String.raw`Use $\{x\}$ and $\frac{1}{2}$`);
  assert.deepEqual(mathSources(tokens), [String.raw`\{x\}`, String.raw`\frac{1}{2}`]);

  const ast = Markdoc.parse(tokens);
  const textNodes = ast.walk().filter((node) => node.type === 'text');
  assert.ok(textNodes.some((node) => node.attributes.content.includes('BPP2MATH:')));
});

test('leaves escaped dollars and unmatched delimiters as prose', () => {
  const tokens = inlineTokens(String.raw`Price: \$5; math: $x$; unfinished: $open`);
  assert.deepEqual(mathSources(tokens), ['x']);
  assert.ok(collectTokens(tokens).some((token) => token.content.includes('$5')));
});

test('does not parse math inside inline code or fenced code in nested blocks', () => {
  const source = [
    '> quoted `$inline-code$` and $quoted-math$',
    '',
    '- ```math',
    '  $fenced-code$',
    '  ```',
    '- $list-math$',
  ].join('\n');
  const tokens = inlineTokens(source);

  assert.deepEqual(mathSources(tokens), ['quoted-math', 'list-math']);
  assert.ok(collectTokens(tokens).some((token) => token.type === 'code_inline' && token.content === '$inline-code$'));
  assert.ok(collectTokens(tokens).some((token) => token.type === 'fence' && token.content.includes('$fenced-code$')));
});

test('transforms protected math markers into inline component tags', () => {
  const marker = `before \uE000BPP2MATH:${Buffer.from(String.raw`\{x\}`).toString('base64')}\uE001 after`;
  const result = transformInlineMathText(marker, Markdoc.Tag, 'InlineMathComponent');

  assert.equal(result.length, 3);
  assert.equal(result[0], 'before ');
  assert.equal(result[1].name, 'InlineMathComponent');
  assert.equal(result[1].attributes.raw, String.raw`\{x\}`);
  assert.equal(result[2], ' after');
});
