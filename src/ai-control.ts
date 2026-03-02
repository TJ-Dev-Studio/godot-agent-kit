#!/usr/bin/env npx tsx
/**
 * ai-control — TCP client for the Godot AiController autoload.
 *
 * Connects to localhost:9876, sends a JSON command, reads the JSON response.
 *
 * Usage:
 *   npx tsx tools/gak/src/ai-control.ts ping
 *   npx tsx tools/gak/src/ai-control.ts state
 *   npx tsx tools/gak/src/ai-control.ts input --dx 1 --dy 0 --duration 2
 *   npx tsx tools/gak/src/ai-control.ts input --jump --duration 0.1
 *   npx tsx tools/gak/src/ai-control.ts screenshot
 *   npx tsx tools/gak/src/ai-control.ts auto-connect
 *   npx tsx tools/gak/src/ai-control.ts teleport --x 40 --y 8 --z -30
 *   npx tsx tools/gak/src/ai-control.ts scene --depth 4
 */
import * as net from "node:net";
import { parseArgs, resolveFlags } from "./lib/args.js";
import type { AiControlResult } from "./lib/types.js";

const PORT = 9876;
const HOST = "127.0.0.1";

function output(result: AiControlResult): void {
  console.log(JSON.stringify(result, null, 2));
}

function buildCommand(
  subcommand: string,
  flags: Record<string, string>,
  booleans: Set<string>
): Record<string, unknown> {
  switch (subcommand) {
    case "ping":
      return { command: "ping" };

    case "state":
      return { command: "state" };

    case "input":
      return {
        command: "input",
        dx: parseFloat(flags.dx || "0"),
        dy: parseFloat(flags.dy || "0"),
        jump: booleans.has("jump"),
        tongue: booleans.has("tongue"),
        drop: booleans.has("drop"),
        duration: parseFloat(flags.duration || "0.5"),
      };

    case "screenshot":
      return { command: "screenshot" };

    case "navigate":
      return { command: "navigate", scene: flags.scene || "" };

    case "scene":
      return {
        command: "scene",
        depth: parseInt(flags.depth || "3", 10),
      };

    case "auto-connect":
      return { command: "auto_connect" };

    case "teleport":
      return {
        command: "teleport",
        x: parseFloat(flags.x || "0"),
        y: parseFloat(flags.y || "0"),
        z: parseFloat(flags.z || "0"),
      };

    case "camera-yaw":
      return {
        command: "camera_yaw",
        yaw: parseFloat(flags.yaw || "0"),
      };

    default:
      throw new Error(`Unknown subcommand: ${subcommand}`);
  }
}

function getTimeout(subcommand: string, flags: Record<string, string>): number {
  switch (subcommand) {
    case "input": {
      const duration = parseFloat(flags.duration || "0.5");
      return (duration + 10) * 1000;
    }
    case "auto-connect":
      return 60_000;
    default:
      return 10_000;
  }
}

async function sendCommand(
  command: Record<string, unknown>,
  timeoutMs: number
): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ port: PORT, host: HOST }, () => {
      socket.write(JSON.stringify(command) + "\n");
    });

    let data = "";
    const timer = setTimeout(() => {
      socket.destroy();
      reject(new Error(`Connection timeout after ${timeoutMs}ms`));
    }, timeoutMs);

    socket.on("data", (chunk) => {
      data += chunk.toString();
      // Check for complete JSON line
      const newlineIdx = data.indexOf("\n");
      if (newlineIdx >= 0) {
        clearTimeout(timer);
        const line = data.slice(0, newlineIdx).trim();
        socket.destroy();
        try {
          resolve(JSON.parse(line));
        } catch {
          reject(new Error(`Invalid JSON response: ${line}`));
        }
      }
    });

    socket.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `TCP connection failed: ${err.message}. Is the game running with AiController enabled?`
        )
      );
    });

    socket.on("close", () => {
      clearTimeout(timer);
      if (data.trim()) {
        try {
          resolve(JSON.parse(data.trim()));
        } catch {
          reject(new Error(`Incomplete response: ${data.trim()}`));
        }
      }
    });
  });
}

async function main(): Promise<void> {
  const raw = parseArgs(process.argv.slice(2));
  const { flags, booleans } = resolveFlags(raw.flags, raw.booleans);

  const subcommand = raw.positional[0];

  if (!subcommand) {
    output({
      success: false,
      subcommand: "",
      response: {},
      warnings: [],
      errors: [
        "Usage: ai-control <command> [options]",
        "Commands: ping, state, input, screenshot, scene, auto-connect, teleport, camera-yaw",
      ],
    });
    process.exit(1);
  }

  try {
    const command = buildCommand(subcommand, flags, booleans);
    const timeoutMs = getTimeout(subcommand, flags);
    const response = await sendCommand(command, timeoutMs);

    const warnings: string[] = [];
    const ok = response.ok === true;

    if (!ok && response.error) {
      output({
        success: false,
        subcommand,
        response: response as Record<string, unknown>,
        warnings,
        errors: [String(response.error)],
      });
      process.exit(1);
    }

    output({
      success: ok,
      subcommand,
      response: response as Record<string, unknown>,
      warnings,
      errors: [],
    });
    process.exit(ok ? 0 : 1);
  } catch (err) {
    output({
      success: false,
      subcommand,
      response: {},
      warnings: [],
      errors: [String(err)],
    });
    process.exit(1);
  }
}

main();
