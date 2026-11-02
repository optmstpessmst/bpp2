import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { collectionDefinitions } from "./lib/content-schema";

const loader = (folder: string) =>
  glob({ pattern: "**/*.{md,mdoc}", base: `./${folder}` });

const editorials = defineCollection({
  loader: loader(collectionDefinitions.editorials.folder),
  schema: collectionDefinitions.editorials.schema,
});

const problems = defineCollection({
  loader: loader(collectionDefinitions.problems.folder),
  schema: collectionDefinitions.problems.schema,
});

export const collections = { editorials, problems };
