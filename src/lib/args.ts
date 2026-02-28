/** Minimal argument parser for GAK orchestrators */
export function parseArgs(argv: string[]): {
  positional: string[];
  flags: Record<string, string>;
  booleans: Set<string>;
} {
  const positional: string[] = [];
  const flags: Record<string, string> = {};
  const booleans = new Set<string>();

  let i = 0;
  while (i < argv.length) {
    const arg = argv[i];

    if (arg.startsWith("--") || (arg.startsWith("-") && arg.length === 2)) {
      const key = arg.replace(/^-+/, "");
      const next = argv[i + 1];

      // If next arg exists and doesn't look like a flag, treat as value
      if (next && !next.startsWith("-")) {
        flags[key] = next;
        i += 2;
      } else {
        booleans.add(key);
        i += 1;
      }
    } else {
      positional.push(arg);
      i += 1;
    }
  }

  return { positional, flags, booleans };
}

/** Shorthand flag aliases */
export const FLAG_ALIASES: Record<string, string> = {
  r: "resolution",
  f: "frame",
  s: "seconds",
  o: "output",
  g: "godot",
  v: "verbose",
  a: "actions",
};

/** Resolve flag aliases to canonical names */
export function resolveFlags(
  flags: Record<string, string>,
  booleans: Set<string>
): { flags: Record<string, string>; booleans: Set<string> } {
  const resolved: Record<string, string> = {};
  const resolvedBools = new Set<string>();

  for (const [key, value] of Object.entries(flags)) {
    const canonical = FLAG_ALIASES[key] || key;
    resolved[canonical] = value;
  }

  for (const key of booleans) {
    const canonical = FLAG_ALIASES[key] || key;
    resolvedBools.add(canonical);
  }

  return { flags: resolved, booleans: resolvedBools };
}
