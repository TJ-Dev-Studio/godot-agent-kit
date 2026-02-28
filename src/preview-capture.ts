#!/usr/bin/env npx tsx
/**
 * preview-capture — Render a Godot scene to PNG via godot-preview.
 *
 * Usage: npx tsx src/preview-capture.ts <project> <scene> [options]
 */
import { checkEnvironment, resolveToolPath } from "./lib/env.js";
import { validateProject, validateScene, validateResolution } from "./lib/validator.js";
import { runSubTool } from "./lib/runner.js";
import { extractOutputPath, extractWarnings, extractErrors, extractLogPath } from "./lib/parser.js";
import { parseArgs, resolveFlags } from "./lib/args.js";
import type { CaptureResult } from "./lib/types.js";

function output(result: CaptureResult): void {
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const raw = parseArgs(process.argv.slice(2));
  const { flags, booleans } = resolveFlags(raw.flags, raw.booleans);

  const project = raw.positional[0];
  const scene = raw.positional[1];

  if (!project || !scene) {
    output({
      success: false,
      output_path: "",
      scene: scene || "",
      resolution: "",
      frame: 0,
      warnings: [],
      errors: ["Usage: preview-capture <project-path> <scene-path> [options]"],
    });
    process.exit(1);
  }

  // Validate inputs
  const projectCheck = validateProject(project);
  const sceneCheck = validateScene(scene);
  const resolution = flags.resolution || "1080x1920";
  const resCheck = validateResolution(resolution);

  const allErrors = [
    ...projectCheck.errors,
    ...sceneCheck.errors,
    ...resCheck.errors,
  ];

  if (allErrors.length > 0) {
    output({
      success: false,
      output_path: "",
      scene,
      resolution,
      frame: 0,
      warnings: [],
      errors: allErrors,
    });
    process.exit(1);
  }

  // Check environment
  const env = checkEnvironment();
  if (!env.ready) {
    output({
      success: false,
      output_path: "",
      scene,
      resolution,
      frame: 0,
      warnings: [],
      errors: env.missing,
    });
    process.exit(1);
  }

  // Build sub-tool args
  const toolPath = resolveToolPath(env.toolsDir, "godot-preview");
  const frame = parseInt(flags.frame || "5", 10);
  const seconds = parseInt(flags.seconds || "10", 10);
  const toolArgs = ["capture", project, scene];

  toolArgs.push("-r", resolution);
  toolArgs.push("-f", String(frame));
  toolArgs.push("-s", String(seconds));

  if (flags.fps) toolArgs.push("--fps", flags.fps);
  if (flags.output) toolArgs.push("-o", flags.output);
  if (booleans.has("verbose")) toolArgs.push("-v");

  // Run
  const result = await runSubTool(toolPath, toolArgs, {
    timeout: (seconds + 15) * 1000,
  });

  const combined = result.stdout + "\n" + result.stderr;
  const warnings = extractWarnings(combined);
  const errors = extractErrors(result);
  const outputPath = extractOutputPath(result.stdout);
  const logPath = extractLogPath(combined);

  const captureResult: CaptureResult = {
    success: result.exitCode === 0 && outputPath !== null,
    output_path: outputPath || flags.output || "",
    scene,
    resolution,
    frame,
    warnings,
    errors,
  };

  if (logPath) captureResult.log_path = logPath;

  output(captureResult);
  process.exit(captureResult.success ? 0 : 1);
}

main().catch((err) => {
  output({
    success: false,
    output_path: "",
    scene: "",
    resolution: "",
    frame: 0,
    warnings: [],
    errors: [String(err)],
  });
  process.exit(1);
});
