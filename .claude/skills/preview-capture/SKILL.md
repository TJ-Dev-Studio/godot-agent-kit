---
name: preview-capture
description: Capture a rendered screenshot of a Godot 4 scene as PNG. Use when you need to see what a scene looks like, verify visual changes, or check camera/lighting/layout. Works without display access.
argument-hint: <project-path> <scene-path> [options]
allowed-tools: Bash(npx tsx *), Read
---

# Preview Capture

Render a Godot 4 scene and extract a PNG screenshot.

## Run

```bash
npx tsx src/preview-capture.ts $ARGUMENTS
```

This returns structured JSON:

```json
{
  "success": true,
  "output_path": "/tmp/godot-preview/lobby.png",
  "scene": "res://scenes/lobby.tscn",
  "resolution": "1080x1920",
  "frame": 5,
  "warnings": [],
  "errors": []
}
```

## After Capture

Read the output PNG with the Read tool to visually inspect the rendered scene.

## Options

| Flag | Default | Description |
|------|---------|-------------|
| `-r, --resolution WxH` | `1080x1920` | Viewport resolution |
| `-f, --frame N` | `5` | Frame number to extract (0 is often blank) |
| `-s, --seconds N` | `10` | Render duration |
| `--fps N` | `1` | Render FPS |
| `-o, --output PATH` | `/tmp/godot-preview/<scene>.png` | Output file |
| `-v, --verbose` | off | Include Godot log |

## Tips

- Frame 0 is often blank — use frame 3-5 for a settled scene
- Use `1080x1920` for portrait mobile, `1280x720` for landscape
- Increase `--seconds` for scenes with animations or orbit cameras
