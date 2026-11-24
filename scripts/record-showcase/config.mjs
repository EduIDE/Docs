import os from "node:os";
import path from "node:path";

export const LANDING =
  process.env.LANDING ?? "https://eduide.artemis.cit.tum.de/";
export const OUT = process.env.OUT ?? path.join(os.tmpdir(), "eduide-showcase");
export const VIEWPORT = { width: 1440, height: 900 };
export const CLONE_REPO =
  "https://github.com/microsoft/vscode-remote-try-java.git";
