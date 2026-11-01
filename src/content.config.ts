import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const editorials = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdoc}", base: "./src/content/editorials" }),
  schema: z.object({
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
  }),
});

const problems = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdoc}", base: "./src/content/problems" }),
  schema: z.object({
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
  }),
});

export const collections = { editorials, problems };
