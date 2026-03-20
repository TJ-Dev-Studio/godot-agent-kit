---
name: visual-iteration
description: Knowledge about the Godot visual iteration workflow — how to use preview capture and interact to see and verify rendered 3D scenes during development. Use when working with Godot projects, modifying .tscn or .gd files, or when the user asks about visual verification.
user-invocable: false
---

# Godot Visual Iteration Workflow

When working with Godot 4 projects, you can SEE rendered scenes using GAK skills.

## The Loop

1. Read `.tscn` and `.gd` files to understand the scene
2. Use `/preview-capture <project> <scene>` to render the scene to PNG
3. Read the output PNG to see the actual rendered 3D result
4. Identify issues (camera angle, lighting, layout, missing assets)
5. Edit source files to fix issues
6. Capture again to verify the fix

## When to Suggest This Workflow

- After modifying any `.tscn` scene file
- After changing lighting, camera, or material properties
- After adding or repositioning 3D nodes
- When the user asks "what does the scene look like?"
- When debugging visual glitches or layout problems

## Testing Interaction

When you need to verify how a scene responds to input:

1. Use `/interact <project> <scene> --actions '<json>'`
2. Read the output PNG to see the post-interaction state
3. Adjust scripts/scenes based on what you see

## Key Tips

- Frame 0 is often blank — use frame 3-5
- Use `1080x1920` for portrait mobile, `1280x720` for landscape
- Increase render seconds for scenes with animations
- Output PNGs land in `/tmp/godot-preview/` by default

