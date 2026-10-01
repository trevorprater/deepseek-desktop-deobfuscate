#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const inventories = [
  {
    name: 'DeepSeek Harness',
    root: join(projectRoot, 'upstream-source'),
    manifest: join(projectRoot, 'vendor-manifests', 'deepseek-harness.git-index'),
  },
  {
    name: 'LibreOffice kit',
    root: join(projectRoot, 'dependencies', 'libreoffice-kit-source'),
    manifest: join(projectRoot, 'vendor-manifests', 'libreoffice-kit.git-index'),
  },
]

function indexEntries(root) {
  const prefix = `${relative(projectRoot, root).split(sep).join('/')}/`
  const output = execFileSync('git', ['ls-files', '-s', '-z', '--', prefix], {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  })
  return new Map(output.split('\0').filter(Boolean).map(line => {
    const match = /^(?<mode>\d{6}) (?<hash>[0-9a-f]{40}) 0\t(?<path>.+)$/u.exec(line)
    if (match?.groups === undefined || !match.groups.path.startsWith(prefix)) {
      throw new Error(`invalid Git index row: ${line}`)
    }
    return [match.groups.path.slice(prefix.length), {
      mode: match.groups.mode,
      hash: match.groups.hash,
    }]
  }))
}

async function verifyInventory(inventory) {
  const lines = (await readFile(inventory.manifest, 'utf8')).trimEnd().split('\n')
  const indexed = indexEntries(inventory.root)
  for (const line of lines) {
    const match = /^(?<mode>\d{6}) (?<hash>[0-9a-f]{40}) 0\t(?<path>.+)$/u.exec(line)
    if (match?.groups === undefined) throw new Error(`invalid manifest row: ${line}`)
    const actual = indexed.get(match.groups.path)
    if (actual?.mode !== match.groups.mode || actual.hash !== match.groups.hash) {
      throw new Error(`${inventory.name}: ${match.groups.path} differs from its pinned source blob`)
    }
  }
  const worktree = spawnSync('git', ['diff', '--quiet', '--', relative(projectRoot, inventory.root)], {
    cwd: projectRoot,
  })
  if (worktree.status !== 0) throw new Error(`${inventory.name}: tracked vendored files have working-tree changes`)
  process.stdout.write(`${inventory.name}: ${String(lines.length)} vendored paths verified\n`)
}

for (const inventory of inventories) await verifyInventory(inventory)
