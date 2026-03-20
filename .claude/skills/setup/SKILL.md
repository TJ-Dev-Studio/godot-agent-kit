---
name: setup
description: Install or update GAK sub-tools and dependencies. Run this once before using other GAK skills.
disable-model-invocation: true
argument-hint:
allowed-tools: Bash(./gak *), Bash(npm *)
---

# GAK Setup

Install sub-tool repositories and Node.js dependencies.

## Run

```bash
./gak setup && npm install
```

This will:

1. Clone or update sub-tool repos into `tools/`:
   - `godot-preview` — scene screenshot capture
   - `godot-interact` — input simulation + capture
2. Install Node.js dependencies for the TypeScript abstraction layer

## Verify

After setup, check that everything is ready:

```bash
./gak tools
```

All tools should show "ready" status.

## Requirements

- **Godot 4.x**: Set `GODOT_BIN` env var if not at default macOS path
- **ffmpeg**: Install with `brew install ffmpeg`
- **Node.js 18+**: For the TypeScript skill layer
- **git**: For sub-tool cloning
