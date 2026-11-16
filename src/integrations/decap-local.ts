import { createRequire } from "node:module";
import type { Server } from "node:http";
import type { AstroIntegration } from "astro";

const require = createRequire(import.meta.url);
const { runDevServer } = require("@decap/cli/dev") as {
  runDevServer: (options: {
    dir: string;
    host: "127.0.0.1";
    mode: "fs";
    port: number;
  }) => Promise<Server>;
};

export default function decapLocal(): AstroIntegration {
  let proxy: Server | undefined;

  return {
    name: "bpp2-decap-local",
    hooks: {
      "astro:server:setup": async ({ server, logger }) => {
        if (process.env.BPP2_SKIP_DECAP_PROXY === "1") {
          logger.info("Decap local proxy skipped by BPP2_SKIP_DECAP_PROXY=1.");
          return;
        }

        proxy = await runDevServer({
          dir: server.config.root,
          host: "127.0.0.1",
          mode: "fs",
          port: 8082,
        });
        logger.info("Decap local proxy started in filesystem mode.");
      },
      "astro:server:done": async () => {
        if (!proxy) return;

        const localProxy = proxy;
        proxy = undefined;
        await new Promise<void>((resolve, reject) => {
          localProxy.close((error) => (error ? reject(error) : resolve()));
        });
      },
    },
  };
}
