#!/usr/bin/env npx tsx
/**
 * preview-list — List all .tscn scenes in a Godot project.
 *
 * Usage: npx tsx src/preview-list.ts <project-path>
 */
import { checkEnvironment, resolveToolPath } from "./lib/env.js";
import { validateProject } from "./lib/validator.js";
import { runSubTool } from "./lib/runner.js";
import { parseSceneList, extractErrors } from "./lib/parser.js";
import type { SceneListResult } from "./lib/types.js";

function output(result: SceneListResult): void {
  console.log(JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const project = process.argv[2];

  if (!project) {
    output({
      success: false,
      project: "",
      scenes: [],
      count: 0,
      warnings: [],
      errors: ["Usage: preview-list <project-path>"],
    });
    process.exit(1);
  }

  const projectCheck = validateProject(project);
  if (!projectCheck.valid) {
    output({
      success: false,
      project,
      scenes: [],
      count: 0,
      warnings: [],
      errors: projectCheck.errors,
    });
    process.exit(1);
  }

  const env = checkEnvironment();
  const toolPath = resolveToolPath(env.toolsDir, "godot-preview");

  const result = await runSubTool(toolPath, ["list", project]);
  const errors = extractErrors(result);

  if (errors.length > 0) {
    output({
      success: false,
      project,
      scenes: [],
      count: 0,
      warnings: [],
      errors,
    });
    process.exit(1);
  }

  const scenes = parseSceneList(result.stdout);

  output({
    success: true,
    project,
    scenes,
    count: scenes.length,
    warnings: [],
    errors: [],
  });
}

main().catch((err) => {
  output({
    success: false,
    project: "",
    scenes: [],
    count: 0,
    warnings: [],
    errors: [String(err)],
  });
  process.exit(1);
});
