import type { RunResult } from "./runner.js";

/** Extract warnings from sub-tool output (e.g., script error counts) */
export function extractWarnings(output: string): string[] {
  const warnings: string[] = [];
  const lines = output.split("\n");

  for (const line of lines) {
    // godot-preview/interact warning format: [tool-name] N script error(s) detected
    const scriptErrorMatch = line.match(
      /(\d+) script error\(s\) detected/
    );
    if (scriptErrorMatch) {
      warnings.push(
        `${scriptErrorMatch[1]} Godot script error(s) detected in log`
      );
    }

    // Generic warnings from sub-tools
    if (
      line.includes("[godot-preview]") &&
      line.includes("Failed to extract frame")
    ) {
      warnings.push(line.trim());
    }
    if (
      line.includes("[godot-interact]") &&
      line.includes("Failed to extract frame")
    ) {
      warnings.push(line.trim());
    }
  }

  return warnings;
}

/** Extract errors from sub-tool output */
export function extractErrors(result: RunResult): string[] {
  const errors: string[] = [];
  const combined = result.stdout + "\n" + result.stderr;

  if (result.exitCode !== 0) {
    // Look for specific error messages
    const lines = combined.split("\n");
    for (const line of lines) {
      const stripped = line
        .replace(/\[godot-preview\]\s*/, "")
        .replace(/\[godot-interact\]\s*/, "")
        .replace(/\[gak\]\s*/, "")
        .trim();

      if (
        stripped &&
        (line.includes("Error") ||
          line.includes("error") ||
          line.includes("not found") ||
          line.includes("failed") ||
          line.includes("No project.godot"))
      ) {
        errors.push(stripped);
      }
    }

    // If no specific errors extracted, add generic
    if (errors.length === 0) {
      errors.push(`Sub-tool exited with code ${result.exitCode}`);
    }
  }

  return errors;
}

/** Extract the output file path from the last line of stdout */
export function extractOutputPath(stdout: string): string | null {
  const lines = stdout.trim().split("\n");

  // The sub-tools print the output path as the last line (bare path)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    // Match file paths (absolute or relative, ending in .png)
    if (line.match(/^\/.*\.png$/) || line.match(/^\..*\.png$/)) {
      return line;
    }
  }

  return null;
}

/** Extract log file path from output */
export function extractLogPath(output: string): string | null {
  const match = output.match(/check (?:log: )?(\S+\.log)/i);
  return match ? match[1] : null;
}

/** Parse scene list output from godot-preview list */
export function parseSceneList(stdout: string): string[] {
  const scenes: string[] = [];
  const lines = stdout.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("res://") && trimmed.endsWith(".tscn")) {
      scenes.push(trimmed);
    }
  }

  return scenes;
}

