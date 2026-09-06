import { spawn } from "node:child_process";

// Next uses --hostname while the supervised preview forwards Vite-compatible
// --host and --strictPort flags. Translate them without changing local UX.
const forwarded = process.argv.slice(2).flatMap((argument) => {
  if (argument === "--host") return ["--hostname"];
  if (argument === "--strictPort") return [];
  return [argument];
});

const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev", ...forwarded], {
  stdio: "inherit",
});

child.on("exit", (code) => process.exit(code ?? 1));
