import { z } from "zod";

// --- Result Types ---

export interface GakResult {
  success: boolean;
  warnings: string[];
  errors: string[];
}

export interface CaptureResult extends GakResult {
  output_path: string;
  scene: string;
  resolution: string;
  frame: number;
  log_path?: string;
}

export interface SceneListResult extends GakResult {
  project: string;
  scenes: string[];
  count: number;
}

export interface InteractResult extends GakResult {
  output_path: string;
  scene: string;
  resolution: string;
  actions_count: number;
  log_path?: string;
}

export interface SwarmTask {
  number: number;
  title: string;
  status: "available" | "claimed" | "complete";
  branch?: string;
}

export interface SwarmStatusResult extends GakResult {
  total: number;
  available: number;
  claimed: number;
  complete: number;
  tasks: SwarmTask[];
}

export interface SwarmClaimResult extends GakResult {
  task_number: number;
  title: string;
  branch: string;
  worktree_path: string;
  task_file: string;
  spec_file: string;
}

export interface SwarmGenericResult extends GakResult {
  output: string;
}

export interface MgwResult extends GakResult {
  subcommand: string;
  output: string;
}

// --- Input Schemas (Zod) ---

export const ActionWaitSchema = z.object({
  type: z.literal("wait"),
  seconds: z.number().positive(),
});

export const ActionTouchSchema = z.object({
  type: z.literal("touch"),
  position: z.tuple([z.number(), z.number()]),
});

export const ActionDragSchema = z.object({
  type: z.literal("drag"),
  from: z.tuple([z.number(), z.number()]),
  to: z.tuple([z.number(), z.number()]),
  duration: z.number().positive().default(0.5),
});

export const ActionKeySchema = z.object({
  type: z.literal("key"),
  key: z.string().min(1),
  duration: z.number().nonnegative().optional(),
});

export const ActionScrollSchema = z.object({
  type: z.literal("scroll"),
  position: z.tuple([z.number(), z.number()]),
  direction: z.enum(["up", "down", "left", "right"]),
  amount: z.number().int().positive().default(3),
});

export const ActionSchema = z.discriminatedUnion("type", [
  ActionWaitSchema,
  ActionTouchSchema,
  ActionDragSchema,
  ActionKeySchema,
  ActionScrollSchema,
]);

export const ActionsPayloadSchema = z.object({
  actions: z.array(ActionSchema).min(1),
});

export type Action = z.infer<typeof ActionSchema>;
export type ActionsPayload = z.infer<typeof ActionsPayloadSchema>;

// --- Option Types ---

export interface PreviewCaptureOptions {
  project: string;
  scene: string;
  resolution?: string;
  frame?: number;
  seconds?: number;
  fps?: number;
  output?: string;
  verbose?: boolean;
}

export interface InteractOptions {
  project: string;
  scene: string;
  actions: string; // JSON string or file path
  resolution?: string;
  frame?: string;
  seconds?: number;
  fps?: number;
  output?: string;
  capture?: string;
  verbose?: boolean;
}
