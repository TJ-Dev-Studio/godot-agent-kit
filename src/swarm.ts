#!/usr/bin/env npx tsx
/**
 * swarm — Orchestrate parallel Claude Code instances via claude-swarm.
 *
 * Usage: npx tsx src/swarm.ts <subcommand> [args]
 *
 * Subcommands: init, claim, status, task-add, task-list, prompt,
 *              validate, complete, merge
 */
import { resolve } from "node:path";
import { checkEnvironment, resolveToolPath } from "./lib/env.js";
import { runSubTool } from "./lib/runner.js";
import {
  extractErrors,
  extractWarnings,
  parseSwarmStatus,
  parseSwarmClaim,
} from "./lib/parser.js";
import type {
  SwarmStatusResult,
  SwarmClaimResult,
  SwarmGenericResult,
} from "./lib/types.js";

type SwarmResult = SwarmStatusResult | SwarmClaimResult | SwarmGenericResult;

function output(result: SwarmResult): void {
  console.log(JSON.stringify(result, null, 2));
}

function genericResult(
  success: boolean,
  stdout: string,
  errors: string[],
  warnings: string[]
): SwarmGenericResult {
  return { success, output: stdout.trim(), warnings, errors };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (!subcommand) {
    output(
      genericResult(false, "", [
        "Usage: swarm <subcommand> [args]",
        "Subcommands: init, claim, status, task-add, task-list, prompt, validate, complete, merge",
      ], [])
    );
    process.exit(1);
  }

  // Check environment
  const env = checkEnvironment();
  const toolPath = resolveToolPath(env.toolsDir, "claude-swarm");

  // Map our subcommands to swarm CLI args
  let toolArgs: string[];

  switch (subcommand) {
    case "init":
      toolArgs = ["init", ...args.slice(1)];
      break;
    case "claim":
      toolArgs = ["claim", ...args.slice(1)];
      break;
    case "status":
      toolArgs = ["status", ...args.slice(1)];
      break;
    case "task-add":
      toolArgs = ["task", "add", ...args.slice(1)];
      break;
    case "task-list":
      toolArgs = ["task", "list", ...args.slice(1)];
      break;
    case "prompt":
      toolArgs = ["prompt", ...args.slice(1)];
      break;
    case "validate":
      toolArgs = ["validate", ...args.slice(1)];
      break;
    case "complete":
      toolArgs = ["complete", ...args.slice(1)];
      break;
    case "merge":
      toolArgs = ["merge", ...args.slice(1)];
      break;
    default:
      output(
        genericResult(false, "", [`Unknown subcommand: ${subcommand}`], [])
      );
      process.exit(1);
  }

  const result = await runSubTool(toolPath, toolArgs, {
    timeout: 60_000,
  });

  const combined = result.stdout + "\n" + result.stderr;
  const warnings = extractWarnings(combined);
  const errors = extractErrors(result);
  const success = result.exitCode === 0;

  // Route to specialized parsers for structured output
  switch (subcommand) {
    case "status":
    case "task-list": {
      const parsed = parseSwarmStatus(result.stdout);
      const statusResult: SwarmStatusResult = {
        success,
        total: parsed.tasks.length,
        available: parsed.tasks.filter((t) => t.status === "available").length,
        claimed: parsed.tasks.filter((t) => t.status === "claimed").length,
        complete: parsed.tasks.filter((t) => t.status === "complete").length,
        tasks: parsed.tasks.map((t) => ({
          number: t.number,
          title: t.title,
          status: t.status as "available" | "claimed" | "complete",
          branch: t.branch,
        })),
        warnings,
        errors,
      };
      output(statusResult);
      break;
    }

    case "claim": {
      const parsed = parseSwarmClaim(result.stdout);
      const claimResult: SwarmClaimResult = {
        success,
        task_number: parsed.task_number || 0,
        title: parsed.title || "",
        branch: parsed.branch || "",
        worktree_path: parsed.worktree_path || "",
        task_file: parsed.task_number
          ? resolve(".swarm", "tasks", `${parsed.task_number}.md`)
          : "",
        spec_file: resolve(".swarm", "SPEC.md"),
        warnings,
        errors,
      };
      output(claimResult);
      break;
    }

    default:
      output(genericResult(success, result.stdout, errors, warnings));
  }

  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  output(genericResult(false, "", [String(err)], []));
  process.exit(1);
});
