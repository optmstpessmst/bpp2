import path from "node:path";
import type { AstroIntegration } from "astro";

function within(root: string, target: string): boolean {
  const relative = path.relative(root, target);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export default function latexml(): AstroIntegration {
  return {
    name: "bpp2-latexml",
    hooks: {
      "astro:server:setup": ({ server }) => {
        const root = path.resolve(server.config.root, "src", "content", "editorials");
        server.watcher.add(root);
        server.watcher.on("change", (changed) => {
          const file = path.resolve(changed);
          if (file.toLowerCase().endsWith(".tex") && within(root, file)) {
            server.ws.send({ type: "full-reload" });
          }
        });
      },
    },
  };
}
