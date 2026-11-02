# Welcome to BPP2

BPP2 is a repository of editorials for Philippine competitive programming competitions and olympiads.

## Content administration

The Decap CMS admin is available at `/admin/`. It edits the `main` branch through GitHub and uses the editorial workflow to create pull requests. Editors need write access to this repository.

Register a GitHub OAuth App for the deployed site, using the site URL as its homepage and `https://<site-host>/callback` as its authorization callback URL. After `npm run build`, configure these Cloudflare Worker secrets using the generated Wrangler configuration:

```sh
npx wrangler secret put GITHUB_OAUTH_CLIENT_ID --config dist/server/wrangler.json
npx wrangler secret put GITHUB_OAUTH_CLIENT_SECRET --config dist/server/wrangler.json
```

The OAuth app requests the `public_repo` scope. Decap derives its OAuth host from the request origin, so the callback must use the exact production hostname serving `/admin/`.
