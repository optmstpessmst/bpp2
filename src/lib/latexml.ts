import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import latexmlCss from "../integrations/latexml.css?raw";

const execFileAsync = promisify(execFile);

const projectRoot = process.cwd();
const editorialRoot = path.join(projectRoot, "src", "content", "editorials");
const cssHash = createHash("sha256").update(latexmlCss).digest("hex");

type CacheEntry = { signature: string; html: Promise<string> };
const cache = new Map<string, CacheEntry>();

const mimeTypes: Record<string, string> = {
  ".css": "text/css",
  ".eot": "application/vnd.ms-fontobject",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".otf": "font/otf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
};

const mimeType = (file: string) =>
  mimeTypes[path.extname(file).toLowerCase()] ?? "application/octet-stream";

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

function isExternal(resource: string): boolean {
  return /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(resource);
}

function localResource(root: string, resource: string): string | null {
  if (isExternal(resource)) return null;
  const decoded = decodeURIComponent(resource.split(/[?#]/, 1)[0]).replace(/^[/\\]+/, "");
  const file = path.resolve(root, decoded);
  return within(root, file) ? file : null;
}

function attribute(tag: string, name: string): string | undefined {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, "i"));
  return match?.[2];
}

async function runLatexml(source: string, output: string, directory: string): Promise<void> {
  try {
    await execFileAsync(
      "latexmlc",
      [
        "--format=html5",
        "--timestamp=0",
        `--dest=${output}`,
        `--log=${path.join(directory, "latexml.log")}`,
        `--path=${path.dirname(source)}`,
        source,
      ],
      { cwd: directory, timeout: 120_000, maxBuffer: 32 * 1024 * 1024 },
    );
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const details = [failure.stderr, failure.stdout, failure.message].filter(Boolean).join("\n");
    const hint = failure.code === "ENOENT" ? " Is latexmlc installed and in PATH?" : "";
    throw new Error(`LaTeXML failed compiling ${source}.${hint}\n${details}`, { cause: error });
  }
}

async function makeSelfContained(html: string, directory: string): Promise<string> {
  for (const tag of html.match(/<link\b[^>]*\brel=["']stylesheet["'][^>]*>/gi) ?? []) {
    const href = attribute(tag, "href");
    const file = href ? localResource(directory, href) : null;
    if (!file) continue;

    const css = await fs.readFile(file, "utf8").catch(() => null);
    if (css === null) throw new Error(`LaTeXML referenced a stylesheet that was not generated: ${href}`);
    const media = attribute(tag, "media");
    const mediaAttribute = media ? ` media="${media}"` : "";
    html = html.replace(
      tag,
      () => `<style${mediaAttribute}>${css.replace(/<\/style/gi, "<\\/style")}</style>`,
    );
  }

  for (const [tag, prefix, resource, suffix] of html.matchAll(
    /(<[a-z][^>]*\b(?:src|poster|data)=["'])(.*?)(["'][^>]*>)/gi,
  )) {
    const file = localResource(directory, resource);
    if (!file) continue;

    const data = await fs.readFile(file).catch(() => null);
    if (data === null) throw new Error(`LaTeXML referenced a generated asset that was not found: ${resource}`);
    html = html.replace(
      tag,
      () => `${prefix}data:${mimeType(file)};base64,${data.toString("base64")}${suffix}`,
    );
  }

  if (!/<\/head>/i.test(html)) throw new Error("LaTeXML produced HTML without a closing head element.");
  const customStyles = `<style>${latexmlCss.replace(/<\/style/gi, "<\\/style")}</style>`;
  return html.replace(/<\/head>/i, () => `${customStyles}</head>`);
}

async function compileDocument(source: string): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "bpp2-latexml-"));
  try {
    const output = path.join(directory, "index.html");
    await runLatexml(source, output, directory);
    return await makeSelfContained(await fs.readFile(output, "utf8"), directory);
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
}

export async function compileTexDocument(file: string): Promise<string> {
  if (typeof file !== "string" || path.extname(file).toLowerCase() !== ".tex") {
    throw new Error("Markdoc tex tag must reference a .tex file path.");
  }

  const [root, source] = await Promise.all([
    fs.realpath(editorialRoot),
    fs.realpath(path.resolve(projectRoot, file)),
  ]).catch((error) => {
    throw new Error(`LaTeXML input does not exist or cannot be accessed: ${file}`, { cause: error });
  });
  if (!within(root, source)) throw new Error(`TeX documents must be inside ${editorialRoot}: ${file}`);

  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error(`LaTeXML input is not a regular file: ${file}`);

  const signature = `${stat.mtimeMs}:${stat.size}:${cssHash}`;
  const cached = cache.get(source);
  if (cached?.signature === signature) return cached.html;

  const html = compileDocument(source);
  const entry = { signature, html };
  cache.set(source, entry);
  html.catch(() => {
    if (cache.get(source) === entry) cache.delete(source);
  });
  return html;
}
