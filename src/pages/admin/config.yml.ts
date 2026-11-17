import type { APIRoute } from "astro";
import { stringify } from "yaml";
import { collectionDefinitions } from "../../lib/content-schema";

export const prerender = false;

const collections = Object.entries(collectionDefinitions).map(
  ([name, def]) => ({
    name,
    label: def.label,
    icon: def.icon,
    folder: def.folder,
    media_folder: "/" + def.folder + "/uploads",
    public_folder: "/" + def.folder + "/uploads",
    create: true,
    extension: "mdoc",
    format: "frontmatter",
    identifier_field: def.identifierField,
    slug: "{{slug}}",
    fields: [
      ...def.cmsFields,
      ...(def.body
        ? [
            {
              label: def.body,
              name: "body",
              widget: "markdown",
              modes: ["rich_text", "raw"],
            },
          ]
        : []),
    ],
  })
);

export const GET: APIRoute = ({ request }) => {
  const { origin, host } = new URL(request.url);

  const config = {
    backend: {
      name: "github",
      repo: "optmstpessmst/bpp2",
      branch: "main",
      auth_scope: "public_repo",
      base_url: origin,
      auth_endpoint: "auth",
      site_domain: host,
    },
    publish_mode: "editorial_workflow",
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
