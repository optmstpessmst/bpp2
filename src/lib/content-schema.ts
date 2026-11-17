import { z } from "astro/zod";
import type { Field } from "@sveltia/cms";

const authorReference = z.object({
  author: z.string(),
  role: z.string().nullish(),
});

const editorials = z.object({
  title: z.string(),
  problemId: z.string().nullish(),
  contest: z.string().nullish(),
  tags: z.array(z.string()).default([]),
  authors: z.array(authorReference).default([]),
});

const problems = z.object({
  title: z.string(),
  id: z.string().optional(),
  contest: z.string().nullish(),
  authors: z.array(authorReference).default([]),
});

const authors = z.object({
  name: z.string(),
  url: z.string().nullish(),
});

const tags = z.object({
  title: z.string(),
});

const contests = z.object({
  title: z.string(),
});

const authorReferenceField = {
  name: "author",
  label: "Author",
  widget: "relation",
  collection: "authors",
  search_fields: ["name"],
  display_fields: ["name"],
  required: true,
} satisfies Field;

const authorsField = {
  name: "authors",
  label: "Authors",
  widget: "list",
  required: false,
  default: [],
  fields: [
    authorReferenceField,
    {
      name: "role",
      label: "Role",
      widget: "string",
      required: false,
    },
  ],
} satisfies Field;

const tagsField = {
  name: "tags",
  label: "Tags",
  widget: "relation",
  multiple: true,
  collection: "tags",
  search_fields: ["title"],
  display_fields: ["title"],
  required: false,
  default: [],
} satisfies Field;

const contestField = {
  name: "contest",
  label: "Contest",
  widget: "relation",
  collection: "contests",
  search_fields: ["title"],
  display_fields: ["title"],
  required: false,
} satisfies Field;

export const collectionDefinitions = {
  editorials: {
    label: "Editorials",
    icon: "article",
    folder: "src/content/editorials",
    identifierField: "title",
    body: "Editorial Body",
    schema: editorials,
    cmsFields: [
      { name: "title", label: "Title", widget: "string" },
      {
        name: "problemId",
        label: "Problem",
        widget: "relation",
        collection: "problems",
        search_fields: ["title", "id"],
        display_fields: ["title"],
        value_field: "id",
        required: false,
      },
      contestField,
      tagsField,
      authorsField,
    ] satisfies Field[],
  },
  problems: {
    label: "Problems",
    icon: "task",
    folder: "src/content/problems",
    identifierField: "title",
    body: "Problem Statement",
    schema: problems,
    cmsFields: [
      { name: "title", label: "Title", widget: "string" },
      {
        name: "id",
        label: "ID (generated from filename)",
        widget: "hidden",
        required: false,
      },
      contestField,
      authorsField,
    ] satisfies Field[],
  },
  authors: {
    label: "Authors",
    icon: "person",
    folder: "src/content/authors",
    identifierField: "name",
    body: null,
    schema: authors,
    cmsFields: [
      { name: "name", label: "Name", widget: "string" },
      {
        name: "url",
        label: "URL",
        widget: "string",
        required: false,
      },
    ] satisfies Field[],
  },
  tags: {
    label: "Tags",
    icon: "sell",
    folder: "src/content/tags",
    identifierField: "title",
    body: null,
    schema: tags,
    cmsFields: [
      { name: "title", label: "Title", widget: "string" },
    ] satisfies Field[],
  },
  contests: {
    label: "Contests",
    icon: "emoji_events",
    folder: "src/content/contests",
    identifierField: "title",
    body: null,
    schema: contests,
    cmsFields: [
      { name: "title", label: "Name", widget: "string" },
    ] satisfies Field[],
  },
};
