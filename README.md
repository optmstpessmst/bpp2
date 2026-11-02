# Welcome to BPP2

BPP2 is a repository of editorials for Philippine competitive programming competitions and olympiads.

## Content administration

Local CMS saves write directly to files in this checkout. To skip the local proxy, set `BPP2_SKIP_DECAP_PROXY=1` when starting Astro, for example: `BPP2_SKIP_DECAP_PROXY=1 astro dev --background`.

On the deployed site, the Decap CMS admin at `/admin/` edits the `main` branch through GitHub and uses the editorial workflow to create pull requests. Editors need write access to this repository.

Register a GitHub OAuth App for the deployed site, using the site URL as its homepage and `https://<site-host>/callback` as its authorization callback URL.
``