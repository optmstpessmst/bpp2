# Welcome to BPP2

BPP2 is a repository of editorials for Philippine competitive programming competitions and olympiads.

## Content administration

Local CMS saves write directly to files in this checkout. To skip the local proxy, set `BPP2_SKIP_DECAP_PROXY=1` when starting Astro, for example: `BPP2_SKIP_DECAP_PROXY=1 astro dev --background`.

On the deployed site, the Decap CMS admin at `/admin/` edits the `main` branch through GitHub and uses the editorial workflow to create pull requests. Editors need write access to this repository.

To enable in production, register a GitHub OAuth App using the site URL as its homepage and `https://<site-host>/callback` as its authorization callback URL.

## Math and TeX

Editorials and problems are written in Markdoc (`.mdoc`). There are four ways to include math or TeX.

| Syntax | Rendered by | Best for |
| --- | --- | --- |
| `$...$` | KaTeX in the browser | Inline math in prose |
| A `math` code fence | KaTeX at build time | Display equations, matrices, aligned blocks |
| A `tex` code fence | make4ht | Full LaTeX documents, TikZ, complex layouts |
| `{% tex file="..." /%}` | make4ht | Long TeX documents |

### Inline math

Wrap inline math in single dollar signs:

```mdoc
The input consists of $n$ integers.
```

### Display math

To display math blocks, use a code fence with the language `math`.

````mdoc
```math
\begin{matrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{matrix}
```
````

Display math is rendered at build time.

### TeX source in a code fence

Use a code fence with the language `tex` to compile LaTeX directly in the document. The fence must contain a complete LaTeX document, including `\documentclass` and `\begin{document}`.

````mdoc
```tex
\documentclass[11pt,a4paper]{article}
\usepackage[margin=25mm]{geometry}
\usepackage{amsmath,amssymb}
\begin{document}
  Hello World
\end{document}
```
````

The document is compiled with `make4ht`, bundled with Monolith, and displayed in an iframe, which is more complex than the math code fence. This is useful for TikZ figures, tables, and layouts that KaTeX cannot handle.

Local development requires `make4ht` and `monolith` to be installed and available on `PATH`.

### TeX from a file

For longer documents, keep the LaTeX in a `.tex` file and reference it with the `tex` tag:

```mdoc
{% tex file="src/content/editorials/uploads/editorial.tex" /%}
```

Only the `file` attribute is available on the tag. To provide TeX inline, use a `tex` code fence instead.

### Other code fences

Any other fence language is rendered as a normal syntax-highlighted code block:

````mdoc
```cpp
int main() {
  return 0;
}
```
````

### Common mistakes
- The fence languages are case-sensitive: use `math` and `tex`, not `Math` or `TeX`.
- Do not add `$` or `$$` around the contents of a `math` fence.
- Use `\$` for a literal dollar sign in prose.

## Additional Dependencies

TeX rendering requires `make4ht` and `monolith`. To replicate the configuation used in production, install with:

```
sudo apt-get install -y texlive-plain-generic texlive-pictures texlive-extra-utils dvisvgm

curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install monolith --version 2.11.7 --locked
```