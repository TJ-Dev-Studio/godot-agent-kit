# Godot Agent Kit (GAK)

Skills abstraction layer for AI agents working with Godot 4 projects. Imports functionality from dependency repos (godot-preview, godot-interact, claude-swarm, mgw) and exposes them as structured Claude Code Skills that agents discover and invoke naturally.

## Architecture

```
LLM Agent
    ↓ invokes skill
.claude/skills/<skill>/SKILL.md
    ↓ calls TypeScript orchestrator
src/<skill>.ts  (validates inputs, runs sub-tool, parses output → JSON)
    ↓ shells out to
tools/godot-preview/  |  tools/godot-interact/  |  tools/claude-swarm/  |  tools/mgw/
```

All skills return structured JSON with `{ success, warnings, errors, ... }`. The agent never needs to know CLI syntax or parse raw stdout.

## Quick Start

```bash
# One-time setup
/setup

# Capture a scene screenshot
/preview-capture ./my_project res://scenes/lobby.tscn

# List available scenes
/preview-list ./my_project

# Simulate player input and capture result
/interact ./my_project res://scenes/lobby.tscn --actions '{"actions":[{"type":"wait","seconds":2},{"type":"touch","position":[540,960]}]}'
```

## Skills

### User-Invocable

| Skill | Command | Purpose |
|-------|---------|---------|
| `preview-capture` | `/preview-capture <project> <scene>` | Render scene to PNG |
| `preview-list` | `/preview-list <project>` | List .tscn scenes |
| `interact` | `/interact <project> <scene> --actions <json>` | Simulate input + capture |
| `swarm` | `/swarm <subcommand>` | Parallel build orchestration |
| `mgw` | `/mgw <subcommand>` | GitHub issue-to-PR automation |
| `setup` | `/setup` | Install sub-tools + Node deps |

### Model-Invocable (auto-discovered by context)

| Skill | Purpose |
|-------|---------|
| `visual-iteration` | Teaches the capture→inspect→edit→re-capture loop |
| `swarm-guide` | Teaches when to suggest parallel orchestration |

## Visual Iteration Loop

```
1. Read .tscn/.gd files to understand the scene
2. /preview-capture <project> <scene>
3. Read the output PNG — you can SEE the rendered 3D scene
4. Identify issues (camera, lighting, layout, etc.)
5. Edit source files to fix issues
6. Go to step 2 and verify
```

## Installing GAK in a Godot Project

```bash
# Clone GAK as a dependency
git clone https://github.com/TJ-Dev-Studio/godot-agent-kit.git tools/gak

# Wire skills into your project (one-time)
./tools/gak/gak init .
```

This installs skills into your project's `.claude/skills/` with correct paths. From then on, any Claude Code session in your project automatically discovers the skills.

### What `gak init` does

1. Clones sub-tool repos (godot-preview, godot-interact, claude-swarm, mgw) if missing
2. Installs Node.js dependencies for the TypeScript layer
3. Generates `.claude/skills/*/SKILL.md` files with paths relative to your project
4. Claude agents auto-discover the skills on startup

## Parallel Build Orchestration

For tasks too large for a single Claude instance:

```bash
/swarm init                              # Scaffold .swarm/
/swarm task-add "Build terrain"          # Add tasks
# Edit .swarm/tasks/N.md and .swarm/SPEC.md
/swarm prompt                            # Generate startup text for new agents
/swarm status                            # Monitor progress
/swarm validate 1 && /swarm merge 1     # Validate and merge
```

### When to Use Swarm

- Task decomposes into 3+ independent work streams
- Multiple scenes/components compose into a whole
- File boundaries are clear (different agents own different files)

### Key Concepts

- **File Ownership**: Each task exclusively owns files. No two tasks write the same file.
- **Shared Spec**: `.swarm/SPEC.md` — all agents read, none modify.
- **Worktrees**: Each agent works in an isolated git worktree branch.
- **Claim Locks**: File-based locks prevent double-claiming.

## GitHub Issue-to-PR Automation

MGW automates the full development pipeline from GitHub issues to pull requests:

```bash
/mgw issues                             # Browse open issues
/mgw issue 42                           # Deep triage analysis
/mgw next                               # Next unblocked issue
/mgw run 42                             # Full pipeline: triage → plan → execute → verify → PR
/mgw milestone 3                        # Execute entire milestone in dependency order
/mgw status                             # Project dashboard
/mgw sync                               # Reconcile local state with GitHub
```

### When to Use MGW

- Working with GitHub issues that need implementation
- Automating the plan-execute-verify-PR cycle
- Running milestones with multiple dependent issues
- Keeping project state in sync across team members

## Sub-Tools (Dependencies)

| Tool | Repo | Purpose |
|------|------|---------|
| `godot-preview` | TJ-Dev-Studio/godot-preview | Scene capture (screenshot) |
| `godot-interact` | TJ-Dev-Studio/godot-interact | Input simulation + capture |
| `claude-swarm` | TJ-Dev-Studio/claude-swarm | Parallel agent orchestration |
| `mgw` | snipcodeit/mgw | GitHub issue-to-PR automation |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GODOT_BIN` | `/Applications/Godot.app/Contents/MacOS/Godot` | Path to Godot binary |
| `GAK_TOOLS_DIR` | `<gak-dir>/tools` | Override tools directory |

## Tips

- Frame 0 is often blank — use frame 3-5 for a settled scene
- Use `-r 1080x1920` for portrait mobile, `-r 1280x720` for landscape
- Increase `--seconds` for scenes with animations or orbit cameras
- All skills return structured JSON with success/error/warning fields
- Output PNGs land in `/tmp/godot-preview/` by default
- For large builds, always suggest swarm orchestration before attempting solo
