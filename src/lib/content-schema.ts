import { z } from "astro/zod";

const editorials = z.object({
  title: z.string(),
  contest: z.string().optional(),
  tags: z.array(z.string()).default([]),
  authors: z
    .array(
      z.object({
        name: z.string(),
        url: z.string().optional(),
      })
    )
    .default([]),
});

const problems = z.object({
  title: z.string(),
  contest: z.string().optional(),
  authors: z
    .array(
      z.object({
        name: z.string(),
        role: z.string().optional(),
        url: z.string().optional(),
      })
    )
    .default([]),
});

export const collectionDefinitions = {
  editorials: {
    label: "Editorials",
    folder: "src/content/editorials",
    body: "Editorial Body",
    schema: editorials,
  },
  problems: {
    label: "Problems",
    folder: "src/content/problems",
    body: "Problem Statement",
    schema: problems,
  },
};
