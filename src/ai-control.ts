#!/usr/bin/env npx tsx
/**
 * ai-control — Control a running Godot game via the AI Controller TCP server.
 *
 * Usage: npx tsx src/ai-control.ts <command> [options]
 *
 * Commands:
 *   ping                           Connection check
 *   state                          Full game state
 *   input --dx N --dy N --duration N  Movement input
 *   screenshot                     Capture viewport PNG
 *   scene [--depth N]              Scene tree overview
 *   teleport --x N --y N --z N     Move player
 *   navigate --scene <path>        Navigate to scene
 *   camera_yaw --yaw N             Set camera yaw
 *   camera_pitch --pitch N         Set camera pitch
 *   skin --frog_id N               Set player skin
 *   auto_connect                   Navigate splash→menu→lobby→match
 *   studio --action <state|select|move|rotate_y|place|export|generate_image> [options]
 *   world_edit --op <place|remove> --ref <ref> --position x,y,z [--zone name]
 */

import * as net from "net";

const PORT = 9876;
const HOST = "127.0.0.1";
const TIMEOUT_MS = 30000;

function sendCommand(cmd: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(PORT, HOST);
    let data = "";

    socket.setTimeout(TIMEOUT_MS);
    socket.on("connect", () => {
      socket.write(JSON.stringify(cmd) + "\n");
    });
    socket.on("data", (chunk) => {
      data += chunk.toString();
      const nl = data.indexOf("\n");
      if (nl >= 0) {
        socket.destroy();
        try {
          resolve(JSON.parse(data.slice(0, nl)));
        } catch (e) {
          reject(new Error("Invalid JSON response: " + data.slice(0, nl)));
        }
      }
    });
    socket.on("timeout", () => {
      socket.destroy();
      reject(new Error("Connection timed out after " + TIMEOUT_MS + "ms"));
    });
    socket.on("error", (err) => {
      reject(new Error("Connection error: " + err.message));
    });
  });
}

function parseArgs(argv: string[]): { command: string; flags: Record<string, string>; booleans: Set<string> } {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const booleans = new Set<string>();

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[key] = next;
        i += 2;
      } else {
        booleans.add(key);
        i += 1;
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }

  return { command: positional[0] || "", flags, booleans };
}

async function main() {
  const { command, flags, booleans } = parseArgs(process.argv.slice(2));

  if (!command) {
    console.error("Usage: ai-control <command> [options]");
    console.error("Commands: ping, state, input, screenshot, scene, teleport, navigate, camera_yaw, camera_pitch, skin, auto_connect, studio, world_edit");
    process.exit(1);
  }

  let cmd: Record<string, unknown> = { command };

  switch (command) {
    case "ping":
    case "state":
    case "screenshot":
    case "auto_connect":
      break;

    case "input":
      if (flags.dx !== undefined) cmd.dx = parseFloat(flags.dx);
      if (flags.dy !== undefined) cmd.dy = parseFloat(flags.dy);
      if (flags.duration !== undefined) cmd.duration = parseFloat(flags.duration);
      if (booleans.has("jump")) cmd.jump = true;
      if (booleans.has("tongue")) cmd.tongue = true;
      if (booleans.has("drop")) cmd.drop = true;
      break;

    case "scene":
      if (flags.depth !== undefined) cmd.depth = parseInt(flags.depth);
      break;

    case "teleport":
      if (flags.x !== undefined) cmd.x = parseFloat(flags.x);
      if (flags.y !== undefined) cmd.y = parseFloat(flags.y);
      if (flags.z !== undefined) cmd.z = parseFloat(flags.z);
      break;

    case "navigate":
      cmd.scene = flags.scene || "";
      break;

    case "camera_yaw":
      cmd.yaw = parseFloat(flags.yaw || "0");
      break;

    case "camera_pitch":
      cmd.pitch = parseFloat(flags.pitch || "0");
      break;

    case "skin":
      cmd.frog_id = parseInt(flags.frog_id || "0");
      break;

    case "studio":
      cmd.action = flags.action || "state";
      if (flags.ref !== undefined) cmd.ref = flags.ref;
      if (flags.dx !== undefined) cmd.dx = parseInt(flags.dx);
      if (flags.dy !== undefined) cmd.dy = parseInt(flags.dy);
      if (flags.dz !== undefined) cmd.dz = parseInt(flags.dz);
      if (flags.steps !== undefined) cmd.steps = parseInt(flags.steps);
      if (flags.name !== undefined) cmd.name = flags.name;
      if (flags.desc !== undefined) cmd.desc = flags.desc;
      if (flags.prompt !== undefined) cmd.prompt = flags.prompt;
      if (flags.yaw !== undefined) cmd.yaw = parseFloat(flags.yaw);
      if (flags.pitch !== undefined) cmd.pitch = parseFloat(flags.pitch);
      break;

    case "world_edit":
      cmd.op = flags.op || "place";
      cmd.ref = flags.ref || "";
      if (flags.position) {
        const parts = flags.position.split(",").map(Number);
        cmd.position = parts;
      }
      if (flags.rotation_y !== undefined) cmd.rotation_y = parseFloat(flags.rotation_y);
      if (flags.zone !== undefined) cmd.zone = flags.zone;
      break;

    default:
      console.error("Unknown command: " + command);
      process.exit(1);
  }

  try {
    const result = await sendCommand(cmd);
    console.log(JSON.stringify(result, null, 2));
    process.exit((result.ok === false) ? 1 : 0);
  } catch (err) {
    console.error(JSON.stringify({ ok: false, error: String(err) }, null, 2));
    process.exit(1);
  }
}

main();
