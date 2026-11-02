import renderMathInElement from "katex/contrib/auto-render";
const escapedDollar = "\uE000";

function replaceTextNodes(
  search: RegExp,
  replacement: string,
): void {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
  );

  let node: Node | null;

  while ((node = walker.nextNode())) {
    node.textContent =
      node.textContent?.replace(search, () => replacement) ?? "";
  }
}

replaceTextNodes(/\\\$/g, escapedDollar);
renderMathInElement(document.body, {
  delimiters: [
    { left: "$$", right: "$$", display: true },
    { left: "$", right: "$", display: false },
  ],
  throwOnError: false,
});
replaceTextNodes(/\uE000/g, "$");