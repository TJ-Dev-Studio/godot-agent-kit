import { execFile } from "node:child_process";

export interface RunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

/** Strip ANSI escape codes from a string */
export function stripAnsi(str: string): string {
  return str.replace(
    /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
    ""
  );
}

/** Run a sub-tool script and capture output */
export function runSubTool(
  scriptPath: string,
  args: string[],
  options?: { timeout?: number; cwd?: string }
): Promise<RunResult> {
  const timeout = options?.timeout ?? 120_000;

  return new Promise((resolve) => {
    execFile(
      scriptPath,
      args,
      {
        timeout,
        cwd: options?.cwd,
        env: { ...process.env },
        maxBuffer: 10 * 1024 * 1024, // 10MB
      },
      (error, stdout, stderr) => {
        const exitCode =
          error && "code" in error ? (error.code as number) ?? 1 : 0;

        resolve({
          stdout: stripAnsi(stdout || ""),
          stderr: stripAnsi(stderr || ""),
          exitCode,
        });
      }
    );
  });
}
