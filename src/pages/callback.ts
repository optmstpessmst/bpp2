import type { APIRoute } from "astro";
import {
  createGitHubOAuthApp,
  getCallbackUrl,
  oauthErrorResponse,
  popupResponse,
  readCookie,
  stateCookie,
} from "../lib/github-oauth";

export const prerender = false;

export const GET: APIRoute = async ({ request, url }) => {
  const state = url.searchParams.get("state");
  const expectedState = readCookie(request, "decap_oauth_state");
  const clearStateCookie = (response: Response) => {
    response.headers.append("Set-Cookie", stateCookie("", request, true));
    return response;
  };

  if (url.searchParams.has("error")) {
    const description = url.searchParams.get("error_description") ?? "GitHub authorization was declined.";
    return clearStateCookie(oauthErrorResponse(description));
  }

  if (!state || !expectedState || state !== expectedState) {
    return clearStateCookie(oauthErrorResponse("The OAuth state did not match. Please try again."));
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return clearStateCookie(oauthErrorResponse("GitHub did not return an authorization code."));
  }

  try {
    const app = createGitHubOAuthApp();
    const { authentication } = await app.createToken({
      code,
      state,
      redirectUrl: getCallbackUrl(request),
    });
    return clearStateCookie(popupResponse(
      `authorization:github:success:${JSON.stringify({ token: authentication.token, provider: "github" })}`,
    ));
  } catch {
    return clearStateCookie(oauthErrorResponse("GitHub authorization could not be completed.", 502));
  }
};
