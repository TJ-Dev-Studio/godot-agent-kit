---
name: swarm-guide
description: Knowledge about when and how to use parallel build orchestration with claude-swarm. Use when the user mentions spinning up multiple instances, when a task naturally decomposes into 3+ work streams, or when building multiple independent Godot scenes that compose into a whole.
user-invocable: false
---

# When to Suggest Swarm Orchestration

Suggest swarm when:

- The task naturally decomposes into 3+ independent work streams
- Multiple scenes/components need to be built that compose into a whole
- The user mentions wanting to "spin up multiple instances"
- File boundaries are clear (different agents own different files)
- The scope is very large for a single Claude instance

## How It Works

1. `/swarm init` scaffolds the orchestration directory
2. `/swarm task-add "Build terrain"` for each parallel task
3. Edit task files with objective, file ownership, acceptance criteria
4. Write shared spec in `.swarm/SPEC.md` with coordinates, materials, conventions
5. `/swarm prompt` generates startup text for new Claude instances
6. Paste prompt into fresh Claude Code sessions
7. Each agent claims a task and works in an isolated git worktree
8. `/swarm status` to monitor progress
9. `/swarm validate N` then `/swarm merge N` for each completed task

## Key Principle: File Ownership

Every file must be owned by exactly one task. No two tasks may modify the same file. The shared spec (`.swarm/SPEC.md`) is read-only for all agents.

## Task Definition Template

Each task file (`.swarm/tasks/N.md`) includes:

- **Objective**: What to build
- **File Ownership**: Exclusive write access to specific files/directories
- **Shared Read**: Read-only references (always includes SPEC.md)
- **Acceptance Criteria**: Checklist for completion

## When NOT to Swarm

- Tasks with heavy cross-file dependencies
- Tasks where the decomposition is unclear
- Quick fixes or single-file changes
- Fewer than 3 independent work streams
