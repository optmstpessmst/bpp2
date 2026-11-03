import { OAuthApp } from "@octokit/oauth-app";
import { env } from "cloudflare:workers";
import { z } from "astro/zod";

const oauthEnvSchema = z.object({
  GITHUB_OAUTH_CLIENT_ID: z.string().min(1),
  GITHUB_OAUTH_CLIENT_SECRET: z.string().min(1),
});

export function createGitHubOAuthApp() {
  const parsed = oauthEnvSchema.safeParse(env);
  if (!parsed.success) {
    throw new Error("GitHub OAuth is not configured on this deployment.", { cause: parsed.error });
  }

  const { GITHUB_OAUTH_CLIENT_ID: clientId, GITHUB_OAUTH_CLIENT_SECRET: clientSecret } = parsed.data;

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

