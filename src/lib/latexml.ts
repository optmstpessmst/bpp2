import { execFile } from "node:child_process";
import { createHash, Hash } from "node:crypto";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { run } from "node:test";

const execFileAsync = promisify(execFile);

const projectRoot = process.cwd();
const editorialRoot = path.join(projectRoot, "src", "content", "editorials");

type CacheEntry = { hash: Hash; html: Promise<string> };
const cache = new Map<string, CacheEntry>();

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function runMake4ht(sourceFile: string, directory: string): Promise<string> {
  const base = path.basename(sourceFile);
  try {
    await execFileAsync(
      "make4ht",
      ["-u", base],
      {
        cwd: directory,
        timeout: 300_000,
      },
    );
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const details = [failure.stderr, failure.stdout, failure.message].filter(Boolean).join("\n");
    const hint = failure.code === "ENOENT"
      ? " Is make4ht installed and in PATH? (It's usually part of TeX Live)"
      : "";
    throw new Error(`make4ht failed compiling ${sourceFile}.${hint}\n${details}`, { cause: error });
  }
  return path.join(directory, path.parse(base).name + ".html");
}


async function runMonolith(input: string, output: string): Promise<void> {
  try {
    await execFileAsync("monolith", ["--quiet", "--isolate", "--no-metadata", input, "--output", output], {
      timeout: 120_000,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const details = [failure.stderr, failure.stdout, failure.message].filter(Boolean).join("\n");
    const hint = failure.code === "ENOENT" ? " Is Monolith installed and in PATH?" : "";
    throw new Error(`Monolith failed bundling ${input}.${hint}\n${details}`, { cause: error });
  }
}

async function compileDocument(source: string): Promise<string> {
  // Run make4ht in the directory that contains the source so it can find
  // any \input, images, and so the output .html lands next to it.
  const directory = path.dirname(source);
  const outputHtml = await runMake4ht(source, directory);
  const bundledOutput = outputHtml.replace(/\.html$/, ".self-contained.html");

  await runMonolith(outputHtml, bundledOutput);
  return await fs.readFile(bundledOutput, "utf8");
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

  const [root, source] = await Promise.all([
    fs.realpath(editorialRoot),
    fs.realpath(path.resolve(projectRoot, file)),
  ]).catch((error) => {
    throw new Error(`LaTeXML input does not exist or cannot be accessed: ${file}`, { cause: error });
  });
  if (!within(root, source)) throw new Error(`TeX documents must be inside ${editorialRoot}: ${file}`);

  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error(`LaTeXML input is not a regular file: ${file}`);

  const hash = createHash(source);
  const cached = cache.get(source);
  if (cached?.hash === hash) return cached.html;

  const html = compileDocument(source);
  const entry = { hash, html };
  cache.set(source, entry);
  html.catch(() => {
    if (cache.get(source) === entry) cache.delete(source);
  });
  return html;
}
