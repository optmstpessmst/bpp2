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

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
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
        `--css=${path.join(directory, "bpp2-latexml.css")}`,
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
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "bpp2-latexml-"));
  try {
    await fs.writeFile(path.join(directory, "bpp2-latexml.css"), latexmlCss);
    const output = path.join(directory, "index.html");
    const bundledOutput = path.join(directory, "index.self-contained.html");
    await runLatexml(source, output, directory);
    await runMonolith(output, bundledOutput);
    return await fs.readFile(bundledOutput, "utf8");
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
