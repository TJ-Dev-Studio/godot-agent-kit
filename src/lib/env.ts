import { existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

export interface Environment {
  ready: boolean;
  gakDir: string;
  toolsDir: string;
  godotBin: string;
  missing: string[];
}

/** Find the GAK root directory (where `gak` script lives) */
function findGakDir(): string {
  // src/lib/env.ts → two levels up is the GAK root
  const thisFile = fileURLToPath(import.meta.url);
  return resolve(dirname(thisFile), "..", "..");
}

/** Check if a command exists on PATH */
function commandExists(cmd: string): boolean {
  try {
    execFileSync("which", [cmd], { stdio: "pipe" });
    return true;
  } catch {
    return false;
  }
}

export function checkEnvironment(): Environment {
  const gakDir = findGakDir();
  const toolsDir = process.env.GAK_TOOLS_DIR || resolve(gakDir, "tools");
  const godotBin =
    process.env.GODOT_BIN ||
    "/Applications/Godot.app/Contents/MacOS/Godot";

  const missing: string[] = [];

  // Check Godot
  if (!existsSync(godotBin) && !commandExists(godotBin)) {
    missing.push(
      `Godot not found at: ${godotBin}. Set GODOT_BIN or install Godot 4.x.`
    );
  }

  // Check ffmpeg
  if (!commandExists("ffmpeg")) {
    missing.push("ffmpeg not found. Install with: brew install ffmpeg");
  }

  // Check sub-tools
  const subTools = [
    { name: "godot-preview", script: "godot_preview.sh" },
    { name: "godot-interact", script: "godot_interact.sh" },
    { name: "claude-swarm", script: "swarm" },
  ];

  for (const tool of subTools) {
    const toolPath = resolve(toolsDir, tool.name, tool.script);
    if (!existsSync(toolPath)) {
      missing.push(
        `${tool.name} not installed at ${toolPath}. Run: ./gak setup`
      );
    }
  }

  return {
    ready: missing.length === 0,
    gakDir,
    toolsDir,
    godotBin,
    missing,
  };
}

/** Resolve path to a specific sub-tool script */
export function resolveToolPath(
  toolsDir: string,
  toolName: string
): string {
  const map: Record<string, string> = {
    "godot-preview": "godot-preview/godot_preview.sh",
    "godot-interact": "godot-interact/godot_interact.sh",
    "claude-swarm": "claude-swarm/swarm",
  };

  const rel = map[toolName];
  if (!rel) throw new Error(`Unknown tool: ${toolName}`);

  return resolve(toolsDir, rel);
}
