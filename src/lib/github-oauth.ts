import { OAuthApp } from "@octokit/oauth-app";
import { env } from "cloudflare:workers";

export function createGitHubOAuthApp() {
  const { GITHUB_OAUTH_CLIENT_ID: clientId, GITHUB_OAUTH_CLIENT_SECRET: clientSecret } = env;
  if (!clientId || !clientSecret) {
    throw new Error("GitHub OAuth is not configured on this deployment.");
  }

  return new OAuthApp({
    clientType: "oauth-app",
    clientId,
    clientSecret,
    defaultScopes: ["public_repo"],
  });
}

export function getCallbackUrl(request: Request): string {
  return new URL("/callback", request.url).toString();
}

export function popupResponse(message: string, status = 200): Response {
  const serializedMessage = JSON.stringify(message).replace(/</g, "\\u003c");
  const html = `<!doctype html>
<html><body><script>
  const message = ${serializedMessage};
  const provider = "github";

  function onMessage(event) {
    if (event.origin !== window.location.origin) return;
    if (event.data !== "authorizing:" + provider) return;
    window.removeEventListener("message", onMessage);
    window.opener.postMessage(message, event.origin);
  }

  if (window.opener) {
    window.addEventListener("message", onMessage);
    window.opener.postMessage("authorizing:" + provider, window.location.origin);
  } else {
    document.body.textContent = "Authorization finished...";
  }
</script></body></html>`;

  return new Response(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export function oauthErrorResponse(message: string, status = 400): Response {
  return popupResponse(
    `authorization:github:error:${JSON.stringify({ message })}`,
    status,
  );
}

export function readCookie(request: Request, name: string): string | undefined {
  const cookieHeader = request.headers.get("Cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    if (part.slice(0, separator).trim() === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }
  return undefined;
}

export function stateCookie(state: string, request: Request, clear = false): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  const value = clear ? "" : encodeURIComponent(state);
  const maxAge = clear ? 0 : 600;
  return `decap_oauth_state=${value}; Path=/callback; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}
