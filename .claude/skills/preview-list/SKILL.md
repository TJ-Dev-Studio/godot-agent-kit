---
name: preview-list
description: List all .tscn scene files in a Godot project. Use when you need to discover what scenes are available before capturing or interacting with them.
argument-hint: <project-path>
allowed-tools: Bash(npx tsx *)
---

# List Godot Scenes

Enumerate all `.tscn` scene files in a Godot project.

## Run

```bash
npx tsx src/preview-list.ts $ARGUMENTS
```

Returns structured JSON:

```json
{
  "success": true,
  "project": "./my_project",
  "scenes": [
    "res://scenes/lobby.tscn",
    "res://scenes/arena.tscn",
    "res://ui/main_menu.tscn"
  ],
  "count": 3
}
```
