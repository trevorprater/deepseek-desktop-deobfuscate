#!/usr/bin/env node

import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { DeepSeekHarness } from '../upstream-source/packages/sdk/client/lib/index.js'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const dshBin = resolve(projectRoot, 'upstream-source/apps/cli/lib/bin.js')

/**
 * Run one prompt through the source-built DeepSeek Harness SDK profile.
 * @param {string} prompt Prompt supplied by the supervising harness.
 * @returns {Promise<import('../upstream-source/packages/sdk/client/lib/types/types.js').RunResult>}
 */
export async function runPrompt(prompt) {
  const workspace = resolve(process.env.DSH_BRIDGE_WORKSPACE ?? process.cwd())
  const dshHome = resolve(process.env.DSH_BRIDGE_HOME ?? '.dsh-bridge-home')
  const patch = process.env.DSH_BRIDGE_PATCH
  const harness = new DeepSeekHarness({
    dshBin,
    profile: process.env.DSH_BRIDGE_PROFILE ?? 'sdk',
    ...(patch === undefined ? {} : { patches: [resolve(patch)] }),
    processCwd: workspace,
    cwd: workspace,
    dshHome,
    provider: process.env.DSH_BRIDGE_PROVIDER ?? 'deepseek-official',
    model: process.env.DSH_BRIDGE_MODEL ?? 'deepseek-v4-flash',
  })
  try {
    return await harness.run(prompt, {
      ...(process.env.DSH_BRIDGE_SESSION === undefined
        ? {}
        : { sessionId: process.env.DSH_BRIDGE_SESSION }),
    })
  } finally {
    await harness.close()
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const prompt = process.argv.slice(2).join(' ').trim()
  if (prompt === '') {
    process.stderr.write('usage: node examples/typescript-sdk-bridge.mjs <prompt>\n')
    process.exitCode = 2
  } else {
    const result = await runPrompt(prompt)
    process.stdout.write(`${result.finalResponse}\n`)
  }
}
