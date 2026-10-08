import { program } from 'commander'
import chalk from 'chalk'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getDesktopPath, setHidden } from './desktop'

const { version } = JSON.parse(
  readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
)

async function run(hidden: boolean) {
  const verb = hidden ? 'hide' : 'unhide'

  if (process.platform !== 'darwin') {
    console.error(chalk.red('hide-files only works on macOS.'))
    process.exitCode = 1
    return
  }

  try {
    const count = await setHidden(getDesktopPath(), hidden)
    if (count === 0) {
      console.log(`There is nothing on your Desktop to ${verb}.`)
    } else if (hidden) {
      console.log(
        `Your files and folders have been ${chalk.yellow('hidden! 🤫')}`,
      )
    } else {
      console.log(
        `Your files and folders have been ${chalk.yellow('shown! 🫣')}`,
      )
    }
  } catch (error) {
    // chflags reports per-file problems on stderr; fall back to the error
    // itself for failures such as a missing Desktop folder.
    const detail = error.stderr?.trim() || error.message
    console.error(chalk.red(`Could not ${verb} your Desktop items.\n${detail}`))
    process.exitCode = 1
  }
}

program
  .name('hide-files')
  .description('Hide or show the files and folders on your macOS Desktop')
  .version(version)

program
  .command('hide')
  .description('Hide all files and folders in desktop')
  .action(() => run(true))

program
  .command('unhide')
  .description('Unhide all files and folders in desktop')
  .action(() => run(false))

export { program }
