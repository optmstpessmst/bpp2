import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { stringify } from "yaml";
import { collectionDefinitions } from "../../lib/content-schema";
import { decapFields } from "../../lib/decap";

export const prerender = false;

const collections = Object.entries(collectionDefinitions).map(([name, def]) => {
  const fields = decapFields(
    z.toJSONSchema(def.schema, {
      io: "input",
      unrepresentable: "any",
      reused: "inline",
    })
  );

  if (name === "problems") {
    const idField = fields.find((field) => field.name === "id");
    if (idField) {
      idField.label = "ID (generated from filename)";
      idField.widget = "hidden";
    }
  }

  if (name === "editorials") {
    const problemField = fields.find((field) => field.name === "problemId");
    if (problemField) {
      Object.assign(problemField, {
        label: "Problem",
        widget: "relation",
        collection: "problems",
        search_fields: ["title", "id"],
        display_fields: ["title"],
        value_field: "id",
      });
    }
  }

  return {
    name,
    label: def.label,
    folder: def.folder,
    media_folder: "/" + def.folder + "/uploads",
    public_folder: def.folder + "/uploads",
    create: true,
    extension: "mdoc",
    format: "frontmatter",
    identifier_field: "title",
    slug: "{{slug}}",
    fields: [
      ...fields,
      { label: def.body, name: "body", widget: "markdown" },
    ],
  };
});

export const GET: APIRoute = ({ request }) => {
  const { origin, host } = new URL(request.url);
  const isDev = import.meta.env.DEV;
  const config = {
    backend: isDev
      ? { name: "git-gateway" }
      : {
          name: "github",
          repo: "optmstpessmst/bpp2",
          branch: "main",
          auth_scope: "public_repo",
          base_url: origin,
          auth_endpoint: "auth",
          site_domain: host,
        },
    ...(isDev
      ? { local_backend: { url: "http://127.0.0.1:8082/api/v1" } }
      : { publish_mode: "editorial_workflow" }),
    media_folder: "public",
    public_folder: "/public",
    collections,
  };

  return new Response(stringify(config), {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
