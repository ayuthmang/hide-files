import { execFile } from 'child_process'
import { readdir } from 'fs/promises'
import { homedir } from 'os'
import { join } from 'path'
import { promisify } from 'util'

export type Run = (file: string, args: string[]) => Promise<unknown>

const execFileAsync: Run = promisify(execFile)

export function getDesktopPath() {
  return join(homedir(), 'Desktop')
}

/**
 * Sets or clears the macOS `hidden` flag on every item in `dir`. Dotfiles are
 * skipped, like the shell's `*` glob, so `.DS_Store` and friends are untouched.
 *
 * `chflags` is called without a shell, so paths are passed through as-is no
 * matter which characters they contain.
 *
 * @returns the number of items whose flag was changed
 */
export async function setHidden(
  dir: string,
  hidden: boolean,
  run: Run = execFileAsync,
) {
  const names = (await readdir(dir)).filter((name) => !name.startsWith('.'))
  if (names.length === 0) {
    return 0
  }

  await run('chflags', [
    hidden ? 'hidden' : 'nohidden',
    ...names.map((name) => join(dir, name)),
  ])
  return names.length
}
