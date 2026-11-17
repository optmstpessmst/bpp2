import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { NonZeroExitError, x } from "tinyexec";
import { SITE_FONT_FAMILY, SITE_FONT_STYLESHEET } from "./fonts";

const projectRoot = process.cwd();
const iframeFontStyles = `
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${SITE_FONT_STYLESHEET}" rel="stylesheet">
<style>
  html, body { max-width: none !important; padding: 0 !important; } /* remove width limit and padding */
  body { font-family: ${SITE_FONT_FAMILY}; } 
</style>`;

function injectIframeFontStyles(html: string): string {
  if (/<\/head\s*>/i.test(html)) {
    return html.replace(/<\/head\s*>/i, `${iframeFontStyles}\n</head>`);
  }
  return `${iframeFontStyles}\n${html}`;
}

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function run(
  command: string,
  args: string[],
  options: { cwd?: string; timeout: number },
): Promise<void> {
  try {
    await x(command, args, {
      throwOnError: true,
      timeout: options.timeout,
      nodeOptions: { cwd: options.cwd },
    });
  } catch (error) {
    if (error instanceof NonZeroExitError) {
      const output = [error.output?.stderr, error.output?.stdout].filter(Boolean).join("\n");
      if (output) throw new Error(`${error.message}\n${output}`, { cause: error });
    }
    throw error;
  }
}

async function runMake4ht(
  sourceFile: string,
  directory: string,
  buildDir: string,
): Promise<string> {
  const base = path.basename(sourceFile);
  await fs.cp(directory, buildDir, { recursive: true });
  await run("make4ht", ["-u", base, "svg,pic-tabular"], {
    cwd: buildDir,
    timeout: 300_000,
  });
  return path.join(buildDir, path.parse(base).name + ".html");
}

async function runMonolith(input: string, output: string): Promise<void> {
  await run("monolith", ["--quiet", "--isolate", "--no-metadata", input, "--output", output], {
    timeout: 120_000,
  });
}

async function compileDocument(source: string): Promise<string> {
  // make4ht runs against a throwaway copy of the source directory so the
  // editorial tree is never written to (and never triggers file watchers).
  const directory = path.dirname(source);
  const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), "bpp2-tex-build-"));
  try {
    const outputHtml = await runMake4ht(source, directory, buildDir);
    const bundledOutput = outputHtml.replace(/\.html$/, ".self-contained.html");

    await runMonolith(outputHtml, bundledOutput);
    const html = await fs.readFile(bundledOutput, "utf8");
    return injectIframeFontStyles(html);
  } finally {
    await fs.rm(buildDir, { recursive: true, force: true });
  }
}


export async function compileTexSource(raw: string): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "bpp2-tex-source-"));
  const input = path.join(directory, "source.tex");
  try {
    await fs.writeFile(input, raw, "utf8");
    return await compileDocument(input);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

export async function compileTexDocument(file: string): Promise<string> {
  if (typeof file !== "string" || path.extname(file).toLowerCase() !== ".tex") {
    throw new Error("Markdoc tex tag must reference a .tex file path.");
  }

  const [source] = await Promise.all([
    fs.realpath(path.resolve(projectRoot, file)),
  ]).catch((error) => {
    throw new Error(`LaTeXML input does not exist or cannot be accessed: ${file}`, { cause: error });
  });
  if (!within(projectRoot, source)) throw new Error(`TeX documents must be inside ${projectRoot}: ${file}`);

  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error(`LaTeXML input is not a regular file: ${file}`);

  const html = compileDocument(source);
  return html;
}
