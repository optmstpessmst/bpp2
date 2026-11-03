import type { APIRoute } from "astro";
import { stringifySetCookie } from "cookie";
import {
  createGitHubOAuthApp,
  getCallbackUrl,
  oauthErrorResponse,
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
        "Set-Cookie": stringifySetCookie({
          name: "decap_oauth_state",
          value: state,
          maxAge: 600,
          path: "/callback",
          httpOnly: true,
          sameSite: "lax",
          secure: new URL(request.url).protocol === "https:",
        }),
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return oauthErrorResponse("GitHub OAuth could not be started.", 503);
  }
};
