import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { resolveTexPath } from "../src/lib/latexml.ts";

const editorialSource = "src/content/editorials/algolympics-2026-m.mdoc";

test("resolves a relative editorial TeX attachment", async () => {
  const resolved = await resolveTexPath(
    "./uploads/algolympics-2026-m.tex",
    editorialSource,
  );

  assert.equal(
    resolved,
    path.resolve("src/content/editorials/uploads/algolympics-2026-m.tex"),
  );
});

test("rejects absolute paths and invalid characters", async () => {
  await assert.rejects(
    resolveTexPath(
      "/src/content/editorials/uploads/algolympics-2026-m.tex",
      editorialSource,
    ),
    /relative paths/,
  );
  await assert.rejects(
    resolveTexPath("./uploads\\algolympics-2026-m.tex", editorialSource),
    /invalid characters/,
  );
});

test("rejects non-TeX files and missing files", async () => {
  await assert.rejects(
    resolveTexPath("./uploads/algolympics-2026-m.txt", editorialSource),
    /\.tex file/,
  );
  await assert.rejects(
    resolveTexPath("./uploads/missing.tex", editorialSource),
  );
});
