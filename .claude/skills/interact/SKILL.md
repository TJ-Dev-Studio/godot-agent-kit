---
name: interact
description: Simulate player input (touch, drag, key press, scroll) in a Godot 4 scene and capture the result as PNG. Use when you need to test how a scene responds to user interaction.
argument-hint: <project-path> <scene-path> --actions <json> [options]
allowed-tools: Bash(npx tsx *), Read
---

# Interact — Simulate Input and Capture

Simulate player input in a Godot 4 scene and capture the rendered result.

## Run

```bash
npx tsx src/interact.ts $ARGUMENTS
```

## Action Format

Pass actions as a JSON string with `--actions`:

```json
{
  "actions": [
    {"type": "wait", "seconds": 2},
    {"type": "touch", "position": [540, 960]},
    {"type": "drag", "from": [540, 960], "to": [200, 960], "duration": 0.5},
    {"type": "key", "key": "ui_accept"},
    {"type": "scroll", "position": [540, 960], "direction": "up", "amount": 3}
  ]
}
```

### Action Types

| Type | Fields | Description |
|------|--------|-------------|
| `wait` | `seconds` | Pause before next action |
| `touch` | `position: [x, y]` | Tap at viewport coordinates |
| `drag` | `from, to, duration` | Touch-drag between points |
| `key` | `key, duration?` | Press a Godot input action |
| `scroll` | `position, direction, amount` | Scroll wheel at position |

## Structured Output

```json
{
  "success": true,
  "output_path": "/tmp/godot-interact/lobby_interact.png",
  "scene": "res://scenes/lobby.tscn",
  "actions_count": 3,
  "warnings": [],
  "errors": []
}
```

## After Interaction

Read the output PNG to see the result of the simulated interaction.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-r, --resolution WxH` | `1080x1920` | Viewport resolution |
| `-f, --frame N` | `last` | Frame to extract |
| `-s, --seconds N` | `15` | Total render time |
| `--fps N` | `2` | Render FPS |
| `--capture WHEN` | `last` | When to capture: last, after-each |
| `-v, --verbose` | off | Include Godot log |

## Tips

- Viewport coordinates match resolution: [540, 960] is center of 1080x1920
- 1-second startup delay lets scene initialize before input begins
- Use `--fps 2` or higher for smooth drag simulations
