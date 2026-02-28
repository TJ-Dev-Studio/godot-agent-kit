#!/usr/bin/env npx tsx
/**
 * interact — Simulate player input in a Godot scene and capture the result.
 *
 * Usage: npx tsx src/interact.ts <project> <scene> --actions <json> [options]
 */
import { readFileSync, existsSync } from "node:fs";
import { checkEnvironment, resolveToolPath } from "./lib/env.js";
import {
  validateProject,
  validateScene,
  validateResolution,
  validateActions,
} from "./lib/validator.js";
import { runSubTool } from "./lib/runner.js";
import {
  extractOutputPath,
  extractWarnings,
  extractErrors,
  extractLogPath,
} from "./lib/parser.js";
import { parseArgs, resolveFlags } from "./lib/args.js";
import type { InteractResult } from "./lib/types.js";

function output(result: InteractResult): void {
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const raw = parseArgs(process.argv.slice(2));
  const { flags, booleans } = resolveFlags(raw.flags, raw.booleans);

  const project = raw.positional[0];
  const scene = raw.positional[1];
  let actionsStr = flags.actions || "";

  if (!project || !scene || !actionsStr) {
    output({
      success: false,
      output_path: "",
      scene: scene || "",
      resolution: "",
      actions_count: 0,
      warnings: [],
      errors: [
        "Usage: interact <project-path> <scene-path> --actions <json|file> [options]",
      ],
    });
    process.exit(1);
  }

  // Load actions from file if path
  if (existsSync(actionsStr)) {
    actionsStr = readFileSync(actionsStr, "utf-8");
  }

  // Validate inputs
  const projectCheck = validateProject(project);
  const sceneCheck = validateScene(scene);
  const resolution = flags.resolution || "1080x1920";
  const resCheck = validateResolution(resolution);
  const actionsCheck = validateActions(actionsStr);

  const allErrors = [
    ...projectCheck.errors,
    ...sceneCheck.errors,
    ...resCheck.errors,
    ...actionsCheck.errors,
  ];

  if (allErrors.length > 0) {
    output({
      success: false,
      output_path: "",
      scene,
      resolution,
      actions_count: 0,
      warnings: [],
      errors: allErrors,
    });
    process.exit(1);
  }

  // Count actions for the result
  const parsed = actionsCheck.parsed as { actions: unknown[] };
  const actionsCount = parsed.actions.length;

  // Check environment
  const env = checkEnvironment();
  if (!env.ready) {
    output({
      success: false,
      output_path: "",
      scene,
      resolution,
      actions_count: actionsCount,
      warnings: [],
      errors: env.missing,
    });
    process.exit(1);
  }

  // Build sub-tool args
  const toolPath = resolveToolPath(env.toolsDir, "godot-interact");
  const seconds = parseInt(flags.seconds || "15", 10);
  const toolArgs = [project, scene, "--actions", actionsStr];

  toolArgs.push("-r", resolution);
  toolArgs.push("-s", String(seconds));

  if (flags.frame) toolArgs.push("-f", flags.frame);
  if (flags.fps) toolArgs.push("--fps", flags.fps);
  if (flags.output) toolArgs.push("-o", flags.output);
  if (flags.capture) toolArgs.push("--capture", flags.capture);
  if (booleans.has("verbose")) toolArgs.push("-v");

  // Run
  const result = await runSubTool(toolPath, toolArgs, {
    timeout: (seconds + 20) * 1000,
  });

  const combined = result.stdout + "\n" + result.stderr;
  const warnings = extractWarnings(combined);
  const errors = extractErrors(result);
  const outputPath = extractOutputPath(result.stdout);
  const logPath = extractLogPath(combined);

  const interactResult: InteractResult = {
    success: result.exitCode === 0 && outputPath !== null,
    output_path: outputPath || flags.output || "",
    scene,
    resolution,
    actions_count: actionsCount,
    warnings,
    errors,
  };

  if (logPath) interactResult.log_path = logPath;

  output(interactResult);
  process.exit(interactResult.success ? 0 : 1);
}

main().catch((err) => {
  output({
    success: false,
    output_path: "",
    scene: "",
    resolution: "",
    actions_count: 0,
    warnings: [],
    errors: [String(err)],
  });
  process.exit(1);
});
