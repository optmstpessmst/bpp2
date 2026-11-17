import { z } from "astro/zod";
import type { Field } from "@sveltia/cms";

const editorials = z.object({
  title: z.string(),
  problemId: z.string().optional(),
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
  id: z.string().optional(),
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
      {
        name: "contest",
        label: "Contest",
        widget: "string",
        required: false,
      },
      {
        name: "tags",
        label: "Tags",
        widget: "list",
        required: false,
        default: [],
        field: {
          name: "value",
          label: "Tag",
          widget: "string",
        },
      },
      {
        name: "authors",
        label: "Authors",
        widget: "list",
        required: false,
        default: [],
        fields: [
          { name: "name", label: "Name", widget: "string" },
          {
            name: "url",
            label: "URL",
            widget: "string",
            required: false,
          },
        ],
      },
    ] satisfies Field[],
  },
  problems: {
    label: "Problems",
    folder: "src/content/problems",
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
      {
        name: "contest",
        label: "Contest",
        widget: "string",
        required: false,
      },
      {
        name: "authors",
        label: "Authors",
        widget: "list",
        required: false,
        default: [],
        fields: [
          { name: "name", label: "Name", widget: "string" },
          {
            name: "role",
            label: "Role",
            widget: "string",
            required: false,
          },
          {
            name: "url",
            label: "URL",
            widget: "string",
            required: false,
          },
        ],
      },
    ] satisfies Field[],
  },
};
