#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdtemp, mkdir, readFile, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distributionRoot = join(projectRoot, 'original', 'distribution')
const dmgPath = join(distributionRoot, 'deepseek-harness-latest-macos-arm64.dmg')
const appPath = join(distributionRoot, 'DeepSeek Harness.app')
const asarPath = join(appPath, 'Contents', 'Resources', 'app.asar')
const extractedPath = join(projectRoot, 'deobfuscated', 'app-asar')
const installerUrl = 'https://download.deepseek.com/desktop/dsh-latest-macos-arm64.dmg'
const feedUrl = 'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml'
const expectedDmgSha256 = '7c32c459c403d8a035ac60600f240ed2025312f0a7afde283f454f30ec4ed96e'

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: options.quiet ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} exited with ${String(result.status)}${result.stderr ? `: ${result.stderr}` : ''}`)
  }
}

async function sha256(path) {
  return createHash('sha256').update(await readFile(path)).digest('hex')
}

async function main() {
  if (process.platform !== 'darwin' || process.arch !== 'arm64') {
    throw new Error('this reproducer requires macOS on Apple silicon')
  }
  await mkdir(distributionRoot, { recursive: true })
  run('curl', ['--fail', '--show-error', '--location', '--continue-at', '-', '--output', dmgPath, installerUrl])
  run('curl', ['--fail', '--show-error', '--location', '--output', join(distributionRoot, 'nightly-mac.yml'), feedUrl])
  const actual = await sha256(dmgPath)
  if (actual !== expectedDmgSha256) {
    throw new Error(`installer SHA-256 changed: expected ${expectedDmgSha256}, got ${actual}`)
  }

  const mount = await mkdtemp(join(tmpdir(), 'dsh-audit-mount-'))
  try {
    run('hdiutil', ['attach', '-readonly', '-nobrowse', '-mountpoint', mount, dmgPath])
    await rm(appPath, { recursive: true, force: true })
    run('ditto', [join(mount, 'DeepSeek Harness.app'), appPath])
  } finally {
    spawnSync('hdiutil', ['detach', mount], { stdio: 'ignore' })
    await rm(mount, { recursive: true, force: true })
  }

  run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath])
  run('spctl', ['--assess', '--type', 'execute', '--verbose=4', appPath])
  await mkdir(dirname(extractedPath), { recursive: true })
  await rm(extractedPath, { recursive: true, force: true })
  run('npx', ['--yes', '@electron/asar@4.1.1', 'extract', asarPath, extractedPath])
  process.stdout.write(`verified and extracted DeepSeek Harness 0.2.0-rc.2\n`)
}

await main()
