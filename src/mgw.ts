#!/usr/bin/env npx tsx
/**
 * mgw — GitHub issue-to-PR automation via MGW (My GSD Workflow).
 *
 * Usage: npx tsx src/mgw.ts <subcommand> [args]
 *
 * Subcommands: issues, issue, next, run, milestone, status, sync,
 *              init, project, pr, update, review, link, help
 */
import { checkEnvironment, resolveToolPath } from "./lib/env.js";
import { runSubTool } from "./lib/runner.js";
import type { MgwResult } from "./lib/types.js";

function output(result: MgwResult): void {
  console.log(JSON.stringify(result, null, 2));
}

function mgwResult(
  success: boolean,
  subcommand: string,
  stdout: string,
  errors: string[],
  warnings: string[]
): MgwResult {
  return { success, subcommand, output: stdout.trim(), warnings, errors };
}

const VALID_SUBCOMMANDS = new Set([
  "issues",
  "issue",
  "next",
  "run",
  "milestone",
  "status",
  "sync",
  "init",
  "project",
  "pr",
  "update",
  "review",
  "link",
  "ask",
  "help",
]);

// AI-powered commands can take much longer
const LONG_RUNNING = new Set([
  "run",
  "milestone",
  "init",
  "project",
  "issue",
  "next",
  "pr",
  "update",
]);

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand) {
    output(
      mgwResult(false, "", "", [
        "Usage: mgw <subcommand> [args]",
        "Subcommands: issues, issue <n>, next, run <n>, milestone [n], status, sync, init, project, pr [n], update <n>, review <n>, link <ref> <ref>, help",
      ], [])
    );
    process.exit(1);
  }

  if (!VALID_SUBCOMMANDS.has(subcommand)) {
    output(
      mgwResult(false, subcommand, "", [`Unknown subcommand: ${subcommand}`], [])
    );
    process.exit(1);
  }

  // Check environment (triggers auto-update with 1hr cooldown)
  const env = checkEnvironment();
  const toolPath = resolveToolPath(env.toolsDir, "mgw");

  // MGW is a Node.js CLI — run with node
  const toolArgs = args; // pass all args through (subcommand + rest)
  const timeout = LONG_RUNNING.has(subcommand) ? 600_000 : 60_000; // 10min for AI commands

  const result = await runSubTool("node", [toolPath, ...toolArgs], {
    timeout,
  });

  const success = result.exitCode === 0;
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!success && result.stderr.trim()) {
    errors.push(result.stderr.trim());
  }

  // Combine stdout for output (MGW already formats its own output)
  const combined = result.stdout.trim();

  output(mgwResult(success, subcommand, combined, errors, warnings));
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  output(mgwResult(false, "", "", [String(err)], []));
  process.exit(1);
});
