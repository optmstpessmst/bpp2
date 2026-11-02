import type { APIRoute } from "astro";

export const prerender = false;

const yamlString = (value: string) => JSON.stringify(value);

export const GET: APIRoute = ({ request }) => {
  const origin = new URL(request.url).origin;
  const host = new URL(request.url).host;
  const backend = import.meta.env.DEV
    ? `backend:\n  name: git-gateway\n\nlocal_backend: true`
    : `backend:\n  name: github\n  repo: optmstpessmst/bpp2\n  branch: main\n  auth_scope: public_repo\n  base_url: ${yamlString(origin)}\n  auth_endpoint: auth\n  site_domain: ${yamlString(host)}\n\npublish_mode: editorial_workflow`;
  const config = `
${backend}

media_folder: public/uploads
public_folder: /uploads

collections:
  - name: editorials
    label: Editorials
    folder: src/content/editorials
    create: true
    extension: mdoc
    format: frontmatter
    identifier_field: title
    slug: "{{slug}}"
    fields:
      - { label: Problem Title, name: title, widget: string }
      - { label: Contest / Platform, name: contest, widget: string, required: false }
      - label: Tags
        name: tags
        widget: list
        required: false
      - label: Authors
        name: authors
        widget: list
        required: false
        fields:
          - { label: Author Name, name: name, widget: string }
          - { label: Website / Profile URL, name: url, widget: string, required: false }
      - { label: Editorial Body, name: body, widget: markdown }

  - name: problems
    label: Problems
    folder: src/content/problems
    create: true
    extension: mdoc
    format: frontmatter
    identifier_field: title
    slug: "{{slug}}"
    fields:
      - { label: Problem Title, name: title, widget: string }
      - { label: Contest / Platform, name: contest, widget: string, required: false }
      - label: Authors
        name: authors
        widget: list
        required: false
        fields:
          - { label: Author Name, name: name, widget: string }
          - { label: Role, name: role, widget: string, required: false }
          - { label: Website / Profile URL, name: url, widget: string, required: false }
      - { label: Problem Statement, name: body, widget: markdown }
`;

  return new Response(config, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
};
