import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals'
import { mkdir, mkdtemp, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { Run, setHidden } from './desktop'

describe('setHidden', () => {
  let dir: string
  let run: jest.Mock<Run>

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'hide-files-'))
    run = jest.fn<Run>().mockResolvedValue(undefined)
  })

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true })
  })

  it('passes every visible item to chflags without shell quoting', async () => {
    const names = ['Screenshot 1.png', 'My Folder', `$HOME "quoted" 'it'.txt`]
    await writeFile(join(dir, names[0]), '')
    await mkdir(join(dir, names[1]))
    await writeFile(join(dir, names[2]), '')

    await expect(setHidden(dir, true, run)).resolves.toBe(3)

    expect(run).toHaveBeenCalledTimes(1)
    const [file, [flag, ...paths]] = run.mock.calls[0]
    expect(file).toBe('chflags')
    expect(flag).toBe('hidden')
    expect(paths.sort()).toEqual(names.map((name) => join(dir, name)).sort())
  })

  it('clears the flag when unhiding', async () => {
    await writeFile(join(dir, 'notes.txt'), '')

    await setHidden(dir, false, run)

    expect(run).toHaveBeenCalledWith('chflags', [
      'nohidden',
      join(dir, 'notes.txt'),
    ])
  })

  it('leaves dotfiles alone', async () => {
    await writeFile(join(dir, '.DS_Store'), '')
    await writeFile(join(dir, '.localized'), '')
    await writeFile(join(dir, 'notes.txt'), '')

    await setHidden(dir, true, run)

    expect(run).toHaveBeenCalledWith('chflags', [
      'hidden',
      join(dir, 'notes.txt'),
    ])
  })

  it('does not run chflags when there is nothing to change', async () => {
    await writeFile(join(dir, '.DS_Store'), '')

    await expect(setHidden(dir, true, run)).resolves.toBe(0)
    expect(run).not.toHaveBeenCalled()
  })

  it('rejects when chflags fails', async () => {
    await writeFile(join(dir, 'notes.txt'), '')
    const error = new Error('Command failed')
    run.mockRejectedValue(error)

    await expect(setHidden(dir, true, run)).rejects.toBe(error)
  })

  it('rejects when the directory does not exist', async () => {
    await expect(
      setHidden(join(dir, 'missing'), true, run),
    ).rejects.toMatchObject({ code: 'ENOENT' })
    expect(run).not.toHaveBeenCalled()
  })
})
