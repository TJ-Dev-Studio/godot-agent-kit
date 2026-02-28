# Godot Agent Kit (GAK)

AI-agent toolkit for visual iteration on Godot 4 projects. Capture screenshots, simulate input, and iterate on game visuals — all without a display.

Built for [Claude Code](https://claude.ai/code) and similar AI coding agents.

## Install

```bash
git clone https://github.com/TJ-Dev-Studio/godot-agent-kit.git
cd godot-agent-kit
chmod +x gak
./gak setup   # clones sub-tools
```

**Requirements:** Godot 4.x, ffmpeg (`brew install ffmpeg`)

## Usage

```bash
# Capture a scene at phone resolution
./gak preview capture ./my_game res://scenes/lobby.tscn

# Simulate touch input and capture
./gak interact ./my_game res://scenes/lobby.tscn \
  --actions '{"actions":[{"type":"wait","seconds":2},{"type":"touch","position":[540,960]}]}'

# List scenes
./gak preview list ./my_game
```

## Architecture

GAK is a thin CLI router over specialized sub-tools:

```
gak (this repo)
├── tools/
│   ├── godot-preview/    → visual capture
│   ├── godot-interact/   → input simulation + capture
│   └── claude-swarm/     → parallel agent orchestration
```

Each sub-tool is an independent repo that can be used standalone. GAK provides the unified `gak <tool> <command>` interface and handles installation.

## Sub-Tools

| Tool | Description | Repo |
|------|-------------|------|
| [godot-preview](https://github.com/TJ-Dev-Studio/godot-preview) | Render scenes to PNG without a display | Standalone |
| [godot-interact](https://github.com/TJ-Dev-Studio/godot-interact) | Simulate player input + capture results | Standalone |
| [claude-swarm](https://github.com/TJ-Dev-Studio/claude-swarm) | Orchestrate parallel Claude Code instances | Standalone |

## How It Works

1. **godot-preview** launches Godot with `--write-movie` to render frames offscreen, extracts PNGs with ffmpeg
2. **godot-interact** injects an input-replay script into the scene, runs Godot with `--write-movie`, captures the result
3. **claude-swarm** splits large builds across multiple Claude Code sessions with task claiming, file ownership, and git worktree isolation
4. **gak** routes commands to the right sub-tool and manages installation

No display, no screen recording permissions, no GPU window required.

See [CLAUDE.md](CLAUDE.md) for the full AI agent workflow guide.

## License

MIT
