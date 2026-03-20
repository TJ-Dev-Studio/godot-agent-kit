import { existsSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const UPDATE_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour

export interface Environment {
  ready: boolean;
  gakDir: string;
  toolsDir: string;
  godotBin: string;
  missing: string[];
  updated: boolean;
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

/** Check if a directory is a git repo */
function isGitRepo(dir: string): boolean {
  return existsSync(resolve(dir, ".git"));
}

/** Pull latest for a git repo. Returns true if changes were fetched. */
function gitPull(dir: string): boolean {
  try {
    const before = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: dir,
      stdio: "pipe",
    }).toString().trim();

    execFileSync("git", ["pull", "--quiet", "--ff-only"], {
      cwd: dir,
      stdio: "pipe",
      timeout: 15_000,
    });

    const after = execFileSync("git", ["rev-parse", "HEAD"], {
      cwd: dir,
      stdio: "pipe",
    }).toString().trim();

    return before !== after;
  } catch {
    return false;
  }
}

/**
 * Auto-update GAK and all sub-tools if cooldown has elapsed.
 * Runs silently — never throws, never blocks on failure.
 * Returns true if any repo was updated.
 */
function ensureUpToDate(gakDir: string, toolsDir: string): boolean {
  const stampFile = resolve(gakDir, ".gak-last-update");

  // Check cooldown
  try {
    if (existsSync(stampFile)) {
      const stamp = parseInt(readFileSync(stampFile, "utf-8").trim(), 10);
      if (Date.now() - stamp < UPDATE_COOLDOWN_MS) {
        return false; // Within cooldown — skip
      }
    }
  } catch {
    // Stamp unreadable — proceed with update
  }

  let anyUpdated = false;

  try {
    // Pull GAK itself
    if (isGitRepo(gakDir)) {
      const lockBefore = existsSync(resolve(gakDir, "package-lock.json"))
        ? statSync(resolve(gakDir, "package-lock.json")).mtimeMs
        : 0;

      if (gitPull(gakDir)) {
        anyUpdated = true;

        // Re-install npm deps if package-lock changed
        const lockAfter = existsSync(resolve(gakDir, "package-lock.json"))
          ? statSync(resolve(gakDir, "package-lock.json")).mtimeMs
          : 0;

        if (lockAfter !== lockBefore) {
          try {
            execFileSync("npm", ["install", "--silent"], {
              cwd: gakDir,
              stdio: "pipe",
              timeout: 30_000,
            });
          } catch {
            // Non-fatal
          }
        }
      }
    }

    // Pull each sub-tool
    const subToolDirs = ["godot-preview", "godot-interact", "mgw"];
    for (const name of subToolDirs) {
      const dir = resolve(toolsDir, name);
      if (isGitRepo(dir)) {
        const subLockBefore = existsSync(resolve(dir, "package-lock.json"))
          ? statSync(resolve(dir, "package-lock.json")).mtimeMs
          : 0;

        if (gitPull(dir)) {
          anyUpdated = true;

          // Re-install npm deps if package-lock changed (mgw has node deps)
          if (subLockBefore > 0) {
            const subLockAfter = existsSync(resolve(dir, "package-lock.json"))
              ? statSync(resolve(dir, "package-lock.json")).mtimeMs
              : 0;
            if (subLockAfter !== subLockBefore) {
              try {
                execFileSync("npm", ["install", "--silent"], {
                  cwd: dir,
                  stdio: "pipe",
                  timeout: 30_000,
                });
              } catch {
                // Non-fatal
              }
            }
          }
        }
      }
    }

    // Write new timestamp
    writeFileSync(stampFile, String(Date.now()), "utf-8");
  } catch {
    // Never fail the main flow
  }

  return anyUpdated;
}

export function checkEnvironment(): Environment {
  const gakDir = findGakDir();
  const toolsDir = process.env.GAK_TOOLS_DIR || resolve(gakDir, "tools");
  const godotBin =
    process.env.GODOT_BIN ||
    "/Applications/Godot.app/Contents/MacOS/Godot";

  // Auto-update (silent, best-effort, 1hr cooldown)
  const updated = ensureUpToDate(gakDir, toolsDir);

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
    { name: "mgw", script: "bin/mgw.cjs" },
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
    updated,
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
    "mgw": "mgw/bin/mgw.cjs",
  };

  const rel = map[toolName];
  if (!rel) throw new Error(`Unknown tool: ${toolName}`);

  return resolve(toolsDir, rel);
}
