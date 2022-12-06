#! /usr/bin/env node

import { program } from 'commander'
import chalk from 'chalk'
import { spawn } from 'child_process'
import { homedir } from 'os'
import { join, sep } from 'path'

program
  .command('hide')
  .description('Hide all files and folders in desktop')
  .action(() => {
    console.log(
      `Your files and folders have been ${chalk.yellow('hidden! 🤫')}`,
    )
    const desktopPath = join(homedir(), 'Desktop', sep)
    spawn('chflags', ['hidden', `${desktopPath.replaceAll(' ', `" "`)}*`], {
      shell: true,
    })
  })

program
  .command('unhide')
  .description('Unhide all files and folders in desktop')
  .action(() => {
    console.log(`Your files and folders have been ${chalk.yellow('shown! 🫣')}`)
    const desktopPath = join(homedir(), 'Desktop', sep)
    spawn('chflags', ['nohidden', `${desktopPath.replaceAll(' ', `" "`)}*`], {
      shell: true,
    })
  })

export { program }
