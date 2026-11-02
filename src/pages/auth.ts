import type { APIRoute } from "astro";
import {
  createGitHubOAuthApp,
  getCallbackUrl,
  oauthErrorResponse,
  stateCookie,
} from "../lib/github-oauth";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  try {
    const app = createGitHubOAuthApp();
    const stateBytes = crypto.getRandomValues(new Uint8Array(32));
    const state = Array.from(stateBytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { url } = app.getWebFlowAuthorizationUrl({
      scopes: ["public_repo"],
      state,
      redirectUrl: getCallbackUrl(request),
    });

    return new Response(null, {
      status: 302,
      headers: {
        Location: url,
        "Set-Cookie": stateCookie(state, request),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return oauthErrorResponse("GitHub OAuth could not be started.", 503);
  }
};
