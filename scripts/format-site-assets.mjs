#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { cp, rm } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(projectRoot, 'original', 'site')
const destination = join(projectRoot, 'deobfuscated', 'site')

await rm(destination, { recursive: true, force: true })
await cp(source, destination, { recursive: true, force: true })

const result = spawnSync('npx', [
  '--yes',
  'prettier@3.6.2',
  '--write',
  `${destination}/**/*.{js,css,html,json}`,
], { cwd: projectRoot, stdio: 'inherit' })
if (result.error !== undefined) throw result.error
if (result.status !== 0) throw new Error(`Prettier exited with ${String(result.status)}`)
