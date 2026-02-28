# Godot Agent Kit (GAK)

Unified CLI toolkit for AI agents working with Godot 4 projects. Provides visual capture, input simulation, and iteration workflows — all without needing display access.

## Quick Start

```bash
# One-time setup: install sub-tools
./gak setup

# Capture a scene screenshot
./gak preview capture ./my_project res://scenes/lobby.tscn

# Simulate player input and capture result
./gak interact ./my_project res://scenes/lobby.tscn \
  --actions '{"actions":[{"type":"wait","seconds":2},{"type":"touch","position":[540,960]}]}'
```

## Visual Iteration Loop

This is the core workflow GAK enables:

```
1. Read .tscn/.gd files to understand the scene
2. Run: ./gak preview capture <project> <scene>
3. Read the output PNG — you can SEE the rendered 3D scene
4. Identify issues (camera, lighting, layout, etc.)
5. Edit source files to fix issues
6. Go to step 2 and verify
```

## Adding GAK to a Project

In your project's CLAUDE.md, add:

```markdown
## Visual Preview

This project uses Godot Agent Kit for visual iteration:

    # Capture any scene
    /path/to/gak preview capture ./godot_project res://scenes/my_scene.tscn

    # Read the result
    # Use Read tool on /tmp/godot-preview/<scene_name>.png
```

## Commands

### `gak preview capture <project> <scene> [options]`

Renders a scene and extracts PNG frame(s). Wraps `godot-preview`.

| Flag | Default | Description |
|------|---------|-------------|
| `-r, --resolution` | `1080x1920` | Viewport resolution (WxH) |
| `-f, --frame` | `5` | Frame number(s) to extract |
| `-s, --seconds` | `10` | Render duration |
| `--fps` | `1` | Render FPS |
| `-o, --output` | `/tmp/godot-preview/<scene>.png` | Output path |
| `-v, --verbose` | off | Show Godot output |

### `gak interact <project> <scene> --actions <json> [options]`

Simulates player input (touch, drag, keys) and captures the result. Wraps `godot-interact`.

### `gak setup`

Clones/updates sub-tool repos into `tools/`.

### `gak tools`

Lists installed sub-tools and their status.

## Sub-Tools

GAK is a thin router over specialized sub-tools:

| Tool | Repo | Purpose |
|------|------|---------|
| `godot-preview` | [TJ-Dev-Studio/godot-preview](https://github.com/TJ-Dev-Studio/godot-preview) | Scene capture (screenshot) |
| `godot-interact` | [TJ-Dev-Studio/godot-interact](https://github.com/TJ-Dev-Studio/godot-interact) | Input simulation + capture |

Each sub-tool can also be used standalone. GAK provides the unified interface.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GODOT_BIN` | `/Applications/Godot.app/Contents/MacOS/Godot` | Path to Godot binary |
| `GAK_TOOLS_DIR` | `<gak-dir>/tools` | Override tools directory |

## Tips

- Frame 0 is often blank — use frame 3-5 for a settled scene
- Use `-r 1080x1920` for portrait mobile, `-r 1280x720` for landscape
- Increase `--seconds` for scenes with animations or orbit cameras
- The tool auto-detects script errors in Godot's output
- Output PNGs land in `/tmp/godot-preview/` by default
