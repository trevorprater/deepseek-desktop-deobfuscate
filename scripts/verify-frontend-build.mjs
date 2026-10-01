#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { readFile, readdir } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = join(projectRoot, 'upstream-source')
const buildRoot = join(projectRoot, 'frontend-build')

async function files(root) {
  const output = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) output.push(path)
    }
  }
  await visit(root)
  return output.sort()
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

async function compareTree(source, target, normalize = contents => contents) {
  const sourceFiles = await files(source)
  const targetFiles = await files(target)
  const sourceNames = sourceFiles.map(path => relative(source, path).split(sep).join('/'))
  const targetNames = targetFiles.map(path => relative(target, path).split(sep).join('/'))
  if (JSON.stringify(sourceNames) !== JSON.stringify(targetNames)) {
    throw new Error(`${relative(projectRoot, target)} has a different file inventory from its source build`)
  }
  for (let index = 0; index < sourceFiles.length; index += 1) {
    const sourceContents = normalize(await readFile(sourceFiles[index]), sourceFiles[index])
    const targetContents = await readFile(targetFiles[index])
    if (sha256(sourceContents) !== sha256(targetContents)) {
      throw new Error(`${relative(projectRoot, targetFiles[index])} differs from its source build`)
    }
  }
  return sourceFiles.length
}

const web = await compareTree(
  join(sourceRoot, 'apps', 'web', 'dist'),
  join(buildRoot, 'web'),
)
const desktop = await compareTree(
  join(sourceRoot, 'apps', 'desktop', 'lib'),
  join(buildRoot, 'desktop-shell'),
)

const clientSourceFiles = (await files(join(sourceRoot, 'packages')))
  .filter(path => /\/lib\/(?:[^/]+\/)*client(?:\.[^/]+)?\.js(?:\.map)?$/u.test(path))
const clientTargetRoot = join(buildRoot, 'client-plugins')
const clientTargetFiles = (await files(clientTargetRoot))
const clientNames = clientSourceFiles.map(path => relative(sourceRoot, path).split(sep).join('/'))
const clientTargetNames = clientTargetFiles.map(path => relative(clientTargetRoot, path).split(sep).join('/'))
if (JSON.stringify(clientNames) !== JSON.stringify(clientTargetNames)) {
  throw new Error('frontend-build/client-plugins has a different file inventory from the client build')
}
for (let index = 0; index < clientSourceFiles.length; index += 1) {
  const source = (await readFile(clientSourceFiles[index], 'utf8'))
    .replaceAll(sourceRoot, '<vendored-source>')
  const target = await readFile(clientTargetFiles[index], 'utf8')
  if (sha256(source) !== sha256(target)) {
    throw new Error(`${clientTargetNames[index]} differs from its source build`)
  }
}

const environmentSource = await readFile(join(sourceRoot, '.dsh-build', 'client-build-environment.json'))
const environmentTarget = await readFile(join(buildRoot, 'client-build-environment.json'))
if (sha256(environmentSource) !== sha256(environmentTarget)) {
  throw new Error('frontend-build/client-build-environment.json differs from the current official build')
}

process.stdout.write(`frontend build verified: ${String(web)} Web files, ${String(desktop)} desktop files, ${String(clientSourceFiles.length)} client plugin files\n`)
