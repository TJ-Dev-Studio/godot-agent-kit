---
name: swarm
description: Orchestrate parallel Claude Code instances for large-scale Godot builds. Use when a task decomposes into 3+ independent work streams with clear file ownership boundaries, or when the user mentions spinning up multiple agents.
disable-model-invocation: true
argument-hint: <subcommand> [args]
allowed-tools: Bash(npx tsx *), Read, Write, Edit
---

# Swarm — Parallel Build Orchestration

Split large builds across multiple Claude Code instances with task claiming, file ownership, and git worktree isolation.

## Subcommands

### Initialize swarm

```bash
npx tsx src/swarm.ts init
```

Creates `.swarm/` scaffold with SPEC.md template, task directory, and agent instructions.

### Add a task

```bash
npx tsx src/swarm.ts task-add "Build terrain system"
```

Creates a numbered task file. Edit it to fill in objective, file ownership, and acceptance criteria.

### List tasks

```bash
npx tsx src/swarm.ts task-list
```

### Claim a task

```bash
npx tsx src/swarm.ts claim        # Next available
npx tsx src/swarm.ts claim 3      # Specific task
```

Creates a git worktree and claim lock. Returns structured JSON with worktree path and task file location.

### Check status

```bash
npx tsx src/swarm.ts status
```

Returns structured JSON with task counts and per-task status.

### Generate startup prompt

```bash
npx tsx src/swarm.ts prompt
```

Generates text to paste into fresh Claude Code sessions.

### Validate task

```bash
npx tsx src/swarm.ts validate 1
```

Checks file ownership compliance for a completed task.

### Mark task complete

```bash
npx tsx src/swarm.ts complete 1
```

### Merge task branch

```bash
npx tsx src/swarm.ts merge 1
```

Merges the completed task's worktree branch into the current branch.

## Workflow

1. `/swarm init` to scaffold
2. `/swarm task-add "Build terrain"` (repeat per task)
3. Edit task files: objective, file ownership, acceptance criteria
4. Edit `.swarm/SPEC.md` with shared conventions
5. `/swarm prompt` to generate agent startup text
6. Paste into fresh Claude Code sessions
7. `/swarm status` to monitor
8. `/swarm validate N` then `/swarm merge N` for each completed task

## Key Concepts

- **File Ownership**: Each task exclusively owns files. No two tasks write the same file.
- **Shared Spec**: `.swarm/SPEC.md` has conventions — all agents read, none modify.
- **Worktrees**: Each agent works in an isolated git worktree branch.
- **Claim Locks**: File-based locks prevent double-claiming.
