import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { ActionsPayloadSchema } from "./types.js";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a Godot project directory */
export function validateProject(projectPath: string): ValidationResult {
  const errors: string[] = [];
  const abs = resolve(projectPath);

  if (!existsSync(abs)) {
    errors.push(`Project directory does not exist: ${abs}`);
  } else if (!existsSync(resolve(abs, "project.godot"))) {
    errors.push(
      `No project.godot found in: ${abs}. Is this a Godot project?`
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a Godot scene path */
export function validateScene(scenePath: string): ValidationResult {
  const errors: string[] = [];

  if (!scenePath.startsWith("res://")) {
    errors.push(
      `Scene path must start with res:// — got: ${scenePath}`
    );
  }
  if (!scenePath.endsWith(".tscn")) {
    errors.push(
      `Scene path must end with .tscn — got: ${scenePath}`
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Validate resolution string */
export function validateResolution(resolution: string): ValidationResult {
  const errors: string[] = [];

  if (!/^\d+x\d+$/.test(resolution)) {
    errors.push(
      `Resolution must be WxH (e.g., 1080x1920) — got: ${resolution}`
    );
  }

  return { valid: errors.length === 0, errors };
}

/** Validate and parse actions JSON */
export function validateActions(
  actionsStr: string
): ValidationResult & { parsed?: unknown } {
  const errors: string[] = [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(actionsStr);
  } catch {
    return {
      valid: false,
      errors: [`Invalid JSON: ${actionsStr.slice(0, 100)}...`],
    };
  }

  const result = ActionsPayloadSchema.safeParse(parsed);
  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push(`actions${issue.path.length ? "." + issue.path.join(".") : ""}: ${issue.message}`);
    }
    return { valid: false, errors };
  }

  return { valid: true, errors: [], parsed: result.data };
}
