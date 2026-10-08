import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getDesktopPath, setHidden } from './desktop'
import { program } from './program'

jest.mock('./desktop')

const desktopPath = '/Users/test/Desktop'
const originalPlatform = process.platform

function setPlatform(platform: NodeJS.Platform) {
  Object.defineProperty(process, 'platform', { value: platform })
}

function cli(...args: string[]) {
  return program.parseAsync(args, { from: 'user' })
}

describe('program', () => {
  let log: jest.SpiedFunction<typeof console.log>
  let error: jest.SpiedFunction<typeof console.error>

  beforeEach(() => {
    setPlatform('darwin')
    jest.mocked(getDesktopPath).mockReturnValue(desktopPath)
    jest.mocked(setHidden).mockResolvedValue(2)
    log = jest.spyOn(console, 'log').mockImplementation(() => undefined)
    error = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    setPlatform(originalPlatform)
    process.exitCode = undefined
    jest.resetAllMocks()
    jest.restoreAllMocks()
  })

  it('prints the package version', async () => {
    const pkg = JSON.parse(
      readFileSync(join(__dirname, '..', 'package.json'), 'utf8'),
    )
    const writeOut = jest.fn<(str: string) => void>()
    program.exitOverride().configureOutput({ writeOut })

    await expect(cli('--version')).rejects.toMatchObject({
      code: 'commander.version',
    })
    expect(writeOut).toHaveBeenCalledWith(`${pkg.version}\n`)
  })

  it('hides the Desktop items', async () => {
    await cli('hide')

    expect(setHidden).toHaveBeenCalledWith(desktopPath, true)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('hidden!'))
    expect(process.exitCode).toBeUndefined()
  })

  it('unhides the Desktop items', async () => {
    await cli('unhide')

    expect(setHidden).toHaveBeenCalledWith(desktopPath, false)
    expect(log).toHaveBeenCalledWith(expect.stringContaining('shown!'))
    expect(process.exitCode).toBeUndefined()
  })

  it('says so when the Desktop has nothing to hide', async () => {
    jest.mocked(setHidden).mockResolvedValue(0)

    await cli('hide')

    expect(log).toHaveBeenCalledWith(
      'There is nothing on your Desktop to hide.',
    )
  })

  it('fails with a clear message outside macOS', async () => {
    setPlatform('linux')

    await cli('hide')

    expect(setHidden).not.toHaveBeenCalled()
    expect(log).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('only works on macOS'),
    )
    expect(process.exitCode).toBe(1)
  })

  it('reports chflags errors instead of claiming success', async () => {
    jest.mocked(setHidden).mockRejectedValue(
      Object.assign(new Error('Command failed: chflags hidden ...'), {
        stderr: 'chflags: /Users/test/Desktop/a.png: Operation not permitted\n',
      }),
    )

    await cli('hide')

    expect(log).not.toHaveBeenCalled()
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining(
        'chflags: /Users/test/Desktop/a.png: Operation not permitted',
      ),
    )
    expect(process.exitCode).toBe(1)
  })

  it('falls back to the error message when there is no stderr', async () => {
    jest
      .mocked(setHidden)
      .mockRejectedValue(
        new Error(
          "ENOENT: no such file or directory, scandir '/Users/test/Desktop'",
        ),
      )

    await cli('unhide')

    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('Could not unhide your Desktop items.'),
    )
    expect(error).toHaveBeenCalledWith(
      expect.stringContaining('ENOENT: no such file or directory'),
    )
    expect(process.exitCode).toBe(1)
  })
})
