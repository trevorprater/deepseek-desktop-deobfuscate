#!/usr/bin/env node

import { spawnSync } from 'node:child_process'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = join(projectRoot, 'upstream-source')
const kitRoot = join(projectRoot, 'dependencies', 'libreoffice-kit-source')

function run(command, args, cwd, environment = process.env) {
  const result = spawnSync(command, args, { cwd, env: environment, stdio: 'inherit' })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} exited with ${String(result.status)}`)
  }
}

const installEnvironment = { ...process.env, CI: 'true' }
run('pnpm', ['install', '--frozen-lockfile'], sourceRoot, installEnvironment)
run('pnpm', ['run', 'build:official'], sourceRoot, {
  ...process.env,
  DSH_CLIENT_COMMIT_HASH: '639ed01',
})

run('pnpm', ['install', '--frozen-lockfile'], kitRoot, installEnvironment)
run('pnpm', ['run', 'build:adapter'], kitRoot)
