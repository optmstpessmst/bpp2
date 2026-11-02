import type { APIRoute } from "astro";
import { z } from "astro/zod";
import { stringify } from "yaml";
import { collectionDefinitions } from "../../lib/content-schema";
import { decapFields } from "../../lib/decap";

export const prerender = false;

const collections = Object.entries(collectionDefinitions).map(([name, def]) => ({
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
    ...decapFields(
      z.toJSONSchema(def.schema, {
        io: "input",
        unrepresentable: "any",
        reused: "inline",
      })
    ),
    { label: def.body, name: "body", widget: "markdown" },
  ],
}));

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
    ...(isDev ? { local_backend: true } : { publish_mode: "editorial_workflow" }),
    media_folder: "public/uploads",
    public_folder: "/uploads",
    collections,
  };

  return new Response(stringify(config), {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
