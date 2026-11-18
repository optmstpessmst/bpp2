import path from "node:path";
import type { AstroIntegration } from "astro";

export default function latexml(): AstroIntegration {
  return {
    name: "bpp2-latexml",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.watcher.add(path.resolve(server.config.root, "src", "content"));

        const reload = (changed: string) => {
          if (path.extname(changed).toLowerCase() === ".tex") {
            server.ws.send({ type: "full-reload" });
          }
        };

        server.watcher.on("add", reload);
        server.watcher.on("change", reload);
        server.watcher.on("unlink", reload);
      },
    },
  };
}
