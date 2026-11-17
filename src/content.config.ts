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

const authors = defineCollection({
  loader: loader(collectionDefinitions.authors.folder),
  schema: collectionDefinitions.authors.schema,
});

const tags = defineCollection({
  loader: loader(collectionDefinitions.tags.folder),
  schema: collectionDefinitions.tags.schema,
});

const contests = defineCollection({
  loader: loader(collectionDefinitions.contests.folder),
  schema: collectionDefinitions.contests.schema,
});

export const collections = { editorials, problems, authors, tags, contests };
