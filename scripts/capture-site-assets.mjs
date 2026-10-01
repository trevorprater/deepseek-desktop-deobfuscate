#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outputRoot = join(projectRoot, 'original', 'site')
const pageUrl = 'https://deepseek.com/en/harness/'

function runBrowser(args) {
  const result = spawnSync('agent-browser', args, {
    cwd: projectRoot,
    encoding: 'utf8',
    maxBuffer: 256 * 1024 * 1024,
  })
  if (result.error !== undefined) throw result.error
  if (result.status !== 0) {
    throw new Error(`agent-browser ${args[0]} failed: ${result.stderr || result.stdout}`)
  }
  return result.stdout.trim()
}

function evaluate(expression) {
  const encoded = Buffer.from(expression).toString('base64')
  return JSON.parse(runBrowser(['eval', '-b', encoded]))
}

function sha256(contents) {
  return createHash('sha256').update(contents).digest('hex')
}

function localPath(url) {
  const parsed = new URL(url)
  let path = decodeURIComponent(parsed.pathname)
  if (path.endsWith('/')) path += 'index.html'
  path = path.replace(/^\/+/, '').replaceAll('..', '__')
  if (parsed.search !== '') {
    const suffix = createHash('sha256').update(parsed.search).digest('hex').slice(0, 10)
    path += `.query-${suffix}`
  }
  return join(outputRoot, path)
}

function isTextAsset(url) {
  const parsed = new URL(url)
  return /\.(?:css|html|js|json|mjs|txt)$/iu.test(parsed.pathname)
    || parsed.pathname === '/harness/'
    || parsed.pathname === '/en/harness/'
}

async function main() {
  await mkdir(outputRoot, { recursive: true })
  try {
    runBrowser(['open', pageUrl])
    runBrowser(['wait', '--fn', 'document.readyState === "complete"'])

    const resources = evaluate(`[
      ...performance.getEntriesByType('resource').map(entry => entry.name),
      ...Array.from(document.querySelectorAll('script[src],link[href]')).map(node => node.src || node.href),
      'https://deepseek.com/harness/',
      'https://deepseek.com/en/harness/'
    ]`)
    const urls = [...new Set(resources)]
      .filter(value => typeof value === 'string')
      .map(value => new URL(value, pageUrl).href)
      .filter(value => new URL(value).origin === 'https://deepseek.com')
      .filter(isTextAsset)
      .sort()

    const index = []
    for (const url of urls) {
      const response = evaluate(`fetch(${JSON.stringify(url)}, { cache: 'force-cache' }).then(async response => ({
        status: response.status,
        contentType: response.headers.get('content-type'),
        body: await response.text()
      }))`)
      if (response.status !== 200) {
        index.push({ url, status: response.status, contentType: response.contentType, path: null })
        continue
      }
      const path = localPath(url)
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, response.body)
      index.push({
        url,
        status: response.status,
        contentType: response.contentType,
        path: path.slice(projectRoot.length + 1),
        bytes: Buffer.byteLength(response.body),
        sha256: sha256(response.body),
      })
    }
    await writeFile(join(outputRoot, 'resources.json'), `${JSON.stringify({
      schemaVersion: 1,
      capturedAt: new Date().toISOString(),
      pageUrl,
      resources: index,
    }, null, 2)}\n`)
    process.stdout.write(`${JSON.stringify({ captured: index.filter(row => row.status === 200).length,
      failed: index.filter(row => row.status !== 200) }, null, 2)}\n`)
  } finally {
    spawnSync('agent-browser', ['close'], { cwd: projectRoot, encoding: 'utf8' })
  }
}

await main()
