import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";


const execFileAsync = promisify(execFile);

const projectRoot = process.cwd();
const editorialRoot = path.join(projectRoot, "src", "content", "editorials");

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

async function runMake4ht(
  sourceFile: string,
  directory: string,
  buildDir: string,
): Promise<string> {
  const base = path.basename(sourceFile);
  try {
    await fs.cp(directory, buildDir, { recursive: true });
    await execFileAsync("make4ht", ["-u", base, "svg,pic-tabular"], {
      cwd: buildDir,
      timeout: 300_000,
    });
  } catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string; stderr?: string };
    const details = [failure.stderr, failure.stdout, failure.message].filter(Boolean).join("\n");
    const hint = failure.code === "ENOENT"
      ? " Is make4ht installed and in PATH? (It's usually part of TeX Live)"
      : "";
    throw new Error(`make4ht failed compiling ${sourceFile}.${hint}\n${details}`, { cause: error });
  }
  return path.join(buildDir, path.parse(base).name + ".html");
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
  // make4ht runs against a throwaway copy of the source directory so the
  // editorial tree is never written to (and never triggers file watchers).
  const directory = path.dirname(source);
  const buildDir = await fs.mkdtemp(path.join(os.tmpdir(), "bpp2-tex-build-"));
  try {
    const outputHtml = await runMake4ht(source, directory, buildDir);
    const bundledOutput = outputHtml.replace(/\.html$/, ".self-contained.html");

    await runMonolith(outputHtml, bundledOutput);
    return await fs.readFile(bundledOutput, "utf8");
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

  const [root, source] = await Promise.all([
    fs.realpath(editorialRoot),
    fs.realpath(path.resolve(projectRoot, file)),
  ]).catch((error) => {
    throw new Error(`LaTeXML input does not exist or cannot be accessed: ${file}`, { cause: error });
  });
  if (!within(root, source)) throw new Error(`TeX documents must be inside ${editorialRoot}: ${file}`);

  const stat = await fs.stat(source);
  if (!stat.isFile()) throw new Error(`LaTeXML input is not a regular file: ${file}`);

  const html = compileDocument(source);
  return html;
}
