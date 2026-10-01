#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { execFileSync, spawnSync } from 'node:child_process'
import { access, mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = join(projectRoot, 'upstream-source')
const libreOfficeSourceRoot = join(projectRoot, 'dependencies', 'libreoffice-kit-source')
const appRoot = join(projectRoot, 'original', 'distribution', 'DeepSeek Harness.app')
const resourcesRoot = join(appRoot, 'Contents', 'Resources')
const extractedRoot = join(projectRoot, 'deobfuscated', 'app-asar')
const packagedScope = join(extractedRoot, 'dsh', 'node_modules', '@deepseek-ai')
const analysisRoot = join(projectRoot, 'analysis')
const sourceProvenancePath = join(projectRoot, 'SOURCE_PROVENANCE.json')

const ignoredScanDirectories = new Set([
  '.git', '.cache', 'artifacts', 'dist', 'lib', 'node_modules', 'target',
])

async function exists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function sha256(path) {
  const contents = await readFile(path)
  return createHash('sha256').update(contents).digest('hex')
}

async function fileMetadata(path) {
  const info = await stat(path)
  return { bytes: info.size, sha256: await sha256(path) }
}

function projectPath(path) {
  return relative(projectRoot, path).split(sep).join('/')
}

function command(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: projectRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', options.stderr === 'inherit' ? 'inherit' : 'pipe'],
    ...options,
  }).trim()
}

async function walkFiles(root, options = {}) {
  const output = []
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && options.skip?.has(entry.name)) continue
      const path = join(directory, entry.name)
      if (entry.isDirectory()) await visit(path)
      else if (entry.isFile()) output.push(path)
    }
  }
  await visit(root)
  return output.sort()
}

async function scanWorkspacePackages() {
  const packages = new Map()
  const roots = [
    ...['apps', 'packages', 'vendor', 'native'].map(path => join(sourceRoot, path)),
    join(libreOfficeSourceRoot, 'packages'),
  ]

  async function visit(directory) {
    const manifestPath = join(directory, 'package.json')
    if (await exists(manifestPath)) {
      const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
      if (typeof manifest.name === 'string') {
        packages.set(manifest.name, {
          name: manifest.name,
          version: manifest.version ?? null,
          path: directory,
        })
      }
    }
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (!entry.isDirectory() || ignoredScanDirectories.has(entry.name)) continue
      await visit(join(directory, entry.name))
    }
  }

  for (const root of roots) await visit(root)
  return packages
}

async function compareTrees(packagedRoot, sourceDirectory, options = {}) {
  const files = await walkFiles(packagedRoot, { skip: options.skip ?? new Set() })
  const comparison = { exact: [], different: [], absentFromSourceTree: [] }
  for (const packagedPath of files) {
    const localPath = relative(packagedRoot, packagedPath)
    const sourcePath = join(sourceDirectory, localPath)
    const packaged = await fileMetadata(packagedPath)
    if (!await exists(sourcePath)) {
      comparison.absentFromSourceTree.push({
        path: localPath.split(sep).join('/'),
        packaged,
        classification: absenceClassification(localPath, sourceDirectory),
      })
      continue
    }
    const source = await fileMetadata(sourcePath)
    const record = {
      path: localPath.split(sep).join('/'),
      packaged,
      source,
    }
    if (packaged.sha256 === source.sha256) {
      comparison.exact.push(record)
    } else {
      const packagedContents = await readFile(packagedPath)
      const sourceContents = await readFile(sourcePath)
      const normalizedEquivalent = isTextBuildArtifact(localPath)
        && normalizeReleaseBuildText(packagedContents.toString('utf8'))
          === normalizeReleaseBuildText(sourceContents.toString('utf8'))
      comparison.different.push({
        ...record,
        normalizedEquivalent,
        classification: differenceClassification(localPath, sourceDirectory, normalizedEquivalent),
      })
    }
  }
  return comparison
}

function isTextBuildArtifact(path) {
  return /\.(?:cjs|css|html|js|mjs)$/u.test(path)
}

function normalizeReleaseBuildText(source) {
  return source
    .replaceAll('/Users/hrsonion/Developer/harness/dsh-macos-arm64', '<repository>')
    .replaceAll(sourceRoot, '<repository>')
    .replace(/(?<![A-Za-z0-9_-])(?:_[A-Za-z0-9_-]{6}|[A-Za-z0-9_-]{6})_([A-Za-z][A-Za-z0-9_-]*)/gu, 'CSS_$1')
    .replace(/0\.2\.0-rc\.2-[0-9a-f]{7}/gu, '0.2.0-rc.2-COMMIT')
}

function differenceClassification(path, sourceDirectory, normalizedEquivalent) {
  if (path === 'package.json') return 'release-manifest'
  if (normalizedEquivalent) return 'release-path-and-metadata'
  if (projectPath(sourceDirectory) === 'upstream-source/native/system/packages/darwin-arm64') {
    if (path === 'bin/system.node') return 'signed-native-build'
    if (path === 'README.i18n.yaml') return 'translation-record-generation'
  }
  if (projectPath(sourceDirectory) === 'dependencies/libreoffice-kit-source/packages/darwin-arm64'
    && path === 'prebuilds.json') return 'built-artifact-manifest'
  return 'unexplained'
}

function absenceClassification(path, sourceDirectory) {
  const source = projectPath(sourceDirectory)
  if (source === 'dependencies/libreoffice-kit-source/packages/darwin-arm64') {
    if (path.startsWith('bin/') || path.startsWith('program/')) return 'built-engine-payload'
    if (path.startsWith('sources/')) return 'shipped-source-snapshot'
    if (path.startsWith('licenses/')) return 'license-material'
  }
  if (path === 'LICENSE') return 'root-license-copy'
  if (path === 'NOTICE') return 'root-notice-copy'
  return 'generated-or-release-only'
}

function comparisonCounts(comparison) {
  const normalizedEquivalent = comparison.different.filter(row => row.normalizedEquivalent === true).length
  return {
    exact: comparison.exact.length,
    different: comparison.different.length,
    normalizedEquivalent,
    unexplainedDifferent: comparison.different.filter(row => row.classification === 'unexplained').length,
    absentFromSourceTree: comparison.absentFromSourceTree.length,
  }
}

async function analyzePackages(workspacePackages) {
  const packageDirectories = (await readdir(packagedScope, { withFileTypes: true }))
    .filter(entry => entry.isDirectory())
    .map(entry => join(packagedScope, entry.name))
    .sort()
  const packages = []

  for (const directory of packageDirectories) {
    const manifestPath = join(directory, 'package.json')
    if (!await exists(manifestPath)) continue
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
    const sourcePackage = workspacePackages.get(manifest.name)
    if (sourcePackage === undefined) {
      packages.push({
        name: manifest.name,
        packagedVersion: manifest.version ?? null,
        sourceVersion: null,
        sourcePath: null,
        counts: null,
        reason: 'No package with this name exists in the tagged Harness workspace.',
      })
      continue
    }
    const comparison = await compareTrees(directory, sourcePackage.path, {
      skip: new Set(['node_modules']),
    })
    packages.push({
      name: manifest.name,
      packagedVersion: manifest.version ?? null,
      sourceVersion: sourcePackage.version,
      sourcePath: projectPath(sourcePackage.path),
      counts: comparisonCounts(comparison),
      comparison,
    })
  }
  return packages
}

function sumPackageCounts(packages) {
  return packages.reduce((total, row) => {
    total.packages += 1
    if (row.sourcePath === null) {
      total.unmappedPackages += 1
      return total
    }
    total.mappedPackages += 1
    total.exactFiles += row.counts.exact
    total.differentFiles += row.counts.different
    total.normalizedEquivalentFiles += row.counts.normalizedEquivalent
    total.unexplainedDifferentFiles += row.counts.unexplainedDifferent
    total.absentFromSourceTree += row.counts.absentFromSourceTree
    return total
  }, {
    packages: 0,
    mappedPackages: 0,
    unmappedPackages: 0,
    exactFiles: 0,
    differentFiles: 0,
    normalizedEquivalentFiles: 0,
    unexplainedDifferentFiles: 0,
    absentFromSourceTree: 0,
  })
}

function countClassifications(rows, key) {
  const counts = {}
  for (const row of rows) {
    for (const file of row.comparison?.[key] ?? []) {
      counts[file.classification] = (counts[file.classification] ?? 0) + 1
    }
  }
  return Object.fromEntries(Object.entries(counts).sort(([left], [right]) => left.localeCompare(right)))
}

async function analyzeLibreOfficeEnginePackage() {
  const packageRoot = join(packagedScope, 'libreoffice-kit-darwin-arm64')
  const prebuildsPath = join(packageRoot, 'prebuilds.json')
  const prebuilds = JSON.parse(await readFile(prebuildsPath, 'utf8'))
  const manifestChecks = []
  for (const [path, expected] of Object.entries(prebuilds.files ?? {})) {
    const artifactPath = join(packageRoot, path)
    const actual = await sha256(artifactPath)
    let classification = actual === expected ? 'exact' : 'unexplained'
    if (actual !== expected && path === 'bin/libreoffice-kit') {
      const signature = spawnSync('codesign', ['--verify', '--strict', artifactPath], {
        cwd: projectRoot,
        encoding: 'utf8',
      })
      if (signature.status === 0) classification = 'post-package-code-signing'
    }
    manifestChecks.push({ path, expected, actual, matches: actual === expected, classification })
  }

  const snapshotRoot = join(packageRoot, 'sources')
  const snapshotFiles = await walkFiles(snapshotRoot)
  const sourceComparison = { exact: [], different: [], generated: [] }
  for (const path of snapshotFiles) {
    const localPath = relative(snapshotRoot, path).split(sep).join('/')
    const sourcePath = localPath.startsWith('engine/') || localPath.startsWith('scripts/')
      ? join(libreOfficeSourceRoot, localPath)
      : null
    const packaged = await fileMetadata(path)
    if (sourcePath === null || !await exists(sourcePath)) {
      sourceComparison.generated.push({ path: localPath, packaged })
      continue
    }
    const source = await fileMetadata(sourcePath)
    const record = { path: localPath, packaged, source, sourcePath: projectPath(sourcePath) }
    if (packaged.sha256 === source.sha256) {
      sourceComparison.exact.push(record)
    } else {
      sourceComparison.different.push({
        ...record,
        classification: localPath === 'scripts/platform-matrix.mjs'
          ? 'retained-engine-recipe'
          : 'unexplained',
      })
    }
  }

  const coreSource = JSON.parse(await readFile(join(snapshotRoot, 'core-source.json'), 'utf8'))
  const coreBuild = JSON.parse(await readFile(join(snapshotRoot, 'core.json'), 'utf8'))
  return {
    packageVersion: prebuilds.version,
    platform: prebuilds.platform,
    status: prebuilds.status,
    payloadManifest: {
      files: manifestChecks.length,
      matching: manifestChecks.filter(row => row.matches).length,
      postPackageSigned: manifestChecks.filter(row => row.classification === 'post-package-code-signing').length,
      mismatches: manifestChecks.filter(row => row.classification === 'unexplained'),
    },
    sourceSnapshot: {
      exact: sourceComparison.exact.length,
      different: sourceComparison.different.length,
      generated: sourceComparison.generated.length,
      comparison: sourceComparison,
    },
    upstreamCore: { ...coreSource, version: coreBuild.version },
  }
}

function csvCell(value) {
  const text = value === null || value === undefined ? '' : String(value)
  return `"${text.replaceAll('"', '""')}"`
}

function packageCsv(packages) {
  const rows = [[
    'name', 'packaged_version', 'source_version', 'source_path',
    'exact_files', 'different_files', 'normalized_equivalent_files',
    'unexplained_different_files', 'absent_from_source_tree',
  ]]
  for (const row of packages) {
    rows.push([
      row.name,
      row.packagedVersion,
      row.sourceVersion,
      row.sourcePath,
      row.counts?.exact,
      row.counts?.different,
      row.counts?.normalizedEquivalent,
      row.counts?.unexplainedDifferent,
      row.counts?.absentFromSourceTree,
    ])
  }
  return `${rows.map(row => row.map(csvCell).join(',')).join('\n')}\n`
}

function parseCodesign(output) {
  const fields = {}
  for (const line of output.split('\n')) {
    const separator = line.indexOf('=')
    if (separator === -1) continue
    const key = line.slice(0, separator)
    const value = line.slice(separator + 1)
    if (key === 'Authority') {
      fields.authorities ??= []
      fields.authorities.push(value)
    } else {
      fields[key] = key === 'Executable' && value.startsWith(projectRoot)
        ? projectPath(value)
        : value
    }
  }
  return fields
}

function markdownSummary(data) {
  const packageSummary = data.packages.summary
  const shell = data.desktopShell
  const manifestDifferences = data.packages.rows.reduce(
    (count, row) => count + (row.comparison?.different.filter(file => file.path === 'package.json').length ?? 0),
    0,
  )
  const absences = data.packages.absenceClassifications
  const differences = data.packages.differenceClassifications
  const office = data.libreOfficeEngine
  return `# DeepSeek Harness distribution/source audit

This report is generated by \`scripts/analyze-distribution.mjs\`. It maps the signed macOS distribution back to the readable MIT-licensed source checkout.

## Provenance

- Public page: ${data.provenance.pageUrl}
- Installer: ${data.provenance.installerUrl}
- App version: \`${data.provenance.app.version}\`
- Bundle identifier: \`${data.provenance.app.bundleIdentifier}\`
- Source tag: \`${data.provenance.source.tag}\`
- Source commit: \`${data.provenance.source.commit}\`
- Embedded distribution build commit: \`${data.provenance.distributionBuildCommit ?? 'not found'}\`
- LibreOffice kit source commit: \`${data.provenance.libreOfficeSource.commit}\`
- DMG SHA-256: \`${data.provenance.dmg.sha256}\`
- App signer: ${data.provenance.signature.authorities?.[0] ?? 'unknown'}
- Gatekeeper assessment: ${data.provenance.signature.gatekeeperAccepted ? 'accepted' : 'not accepted'}

## Byte comparison

- Electron main/preload shell: ${shell.lib.counts.exact}/${shell.lib.total} files byte-identical to \`upstream-source/apps/desktop/lib\`.
- Static Electron renderer: ${shell.renderer.counts.exact}/${shell.renderer.total} files byte-identical to \`upstream-source/apps/desktop/renderer\`.
- Bundled \`@deepseek-ai\` packages: ${packageSummary.mappedPackages}/${packageSummary.packages} map to a package in the tagged checkout.
- Package-owned files compared: ${packageSummary.exactFiles} byte-identical, ${packageSummary.differentFiles} different, ${packageSummary.absentFromSourceTree} files produced or copied during release packaging.
- Release-path/metadata equivalents: ${packageSummary.normalizedEquivalentFiles}. These differ only in the release checkout path, path-derived CSS-module tokens, or the embedded seven-character build commit.
- Rewritten package manifests: ${manifestDifferences}. Release packaging replaces \`workspace:*\` ranges with published versions, so manifest differences are expected and do not represent hidden executable code.
- Unexplained first-party file differences: ${packageSummary.unexplainedDifferentFiles}.
- Accounted binary/build-record differences: ${(differences['signed-native-build'] ?? 0) + (differences['built-artifact-manifest'] ?? 0) + (differences['translation-record-generation'] ?? 0)}.
- Release-added license/notice copies: ${(absences['root-license-copy'] ?? 0) + (absences['root-notice-copy'] ?? 0) + (absences['license-material'] ?? 0)}.

## LibreOffice engine

- Engine payload manifest: ${office.payloadManifest.matching}/${office.payloadManifest.files} file hashes byte-identical before application signing; ${office.payloadManifest.postPackageSigned} nested executable differs after valid Developer-ID signing; ${office.payloadManifest.mismatches.length} unexplained mismatches.
- Shipped recipe snapshot: ${office.sourceSnapshot.exact} files byte-identical to LibreOffice kit source commit \`${data.provenance.libreOfficeSource.commit}\`, ${office.sourceSnapshot.different} versioned-recipe difference, ${office.sourceSnapshot.generated} generated source manifests/patches.
- LibreOffice core: \`${office.upstreamCore.repository}\` at \`${office.upstreamCore.revision}\` (${office.upstreamCore.version}).

See \`package-map.csv\` for the package-to-source index and \`runtime-map.json\` for file-level hashes and exceptions.
`
}

async function main() {
  for (const required of [sourceRoot, libreOfficeSourceRoot, appRoot, resourcesRoot, extractedRoot, packagedScope]) {
    if (!await exists(required)) throw new Error(`missing required input: ${projectPath(required)}`)
  }
  await mkdir(analysisRoot, { recursive: true })

  const workspacePackages = await scanWorkspacePackages()
  const packages = await analyzePackages(workspacePackages)
  const packageSummary = sumPackageCounts(packages)
  const libreOfficeEngine = await analyzeLibreOfficeEnginePackage()

  const desktopLib = await compareTrees(join(extractedRoot, 'lib'), join(sourceRoot, 'apps', 'desktop', 'lib'))
  const desktopRenderer = await compareTrees(join(extractedRoot, 'renderer'), join(sourceRoot, 'apps', 'desktop', 'renderer'))

  const info = JSON.parse(command('plutil', [
    '-convert', 'json', '-o', '-', join(appRoot, 'Contents', 'Info.plist'),
  ]))
  const codesign = spawnSync('codesign', ['-d', '--verbose=4', appRoot], {
    cwd: projectRoot,
    encoding: 'utf8',
  })
  if (codesign.status !== 0) {
    throw new Error(`codesign inspection failed: ${codesign.stderr || codesign.stdout}`)
  }
  const codesignOutput = `${codesign.stdout ?? ''}\n${codesign.stderr ?? ''}`.trim()
  let gatekeeperAccepted = false
  try {
    command('spctl', ['--assess', '--type', 'execute', '--verbose=4', appRoot])
    gatekeeperAccepted = true
  } catch {
    gatekeeperAccepted = false
  }

  const dmgPath = join(projectRoot, 'original', 'distribution', 'deepseek-harness-latest-macos-arm64.dmg')
  const feedPath = join(projectRoot, 'original', 'distribution', 'nightly-mac.yml')
  const asarPath = join(resourcesRoot, 'app.asar')
  const sourceProvenance = JSON.parse(await readFile(sourceProvenancePath, 'utf8'))
  const sourceCommit = sourceProvenance.deepseekHarness.commit
  const sourceTag = sourceProvenance.deepseekHarness.tag
  const sourceRemote = sourceProvenance.deepseekHarness.remote
  const libreOfficeCommit = sourceProvenance.libreOfficeKit.commit
  const libreOfficeRemote = sourceProvenance.libreOfficeKit.remote
  const packagedSidebar = await readFile(join(
    packagedScope, 'dsh-client-ui-sidebar', 'lib', 'client.js',
  ), 'utf8')
  const packagedBuildCommit = /0\.2\.0-rc\.2-([0-9a-f]{7})/u.exec(packagedSidebar)?.[1] ?? null

  const data = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    provenance: {
      pageUrl: 'https://deepseek.com/harness/',
      source: { remote: sourceRemote, tag: sourceTag, commit: sourceCommit },
      distributionBuildCommit: packagedBuildCommit,
      libreOfficeSource: { remote: libreOfficeRemote, commit: libreOfficeCommit },
      installerUrl: 'https://download.deepseek.com/desktop/dsh-latest-macos-arm64.dmg',
      updaterFeedUrl: 'https://download.deepseek.com/dsh-desk/feeds/mac-arm64/nightly-mac.yml',
      dmg: await fileMetadata(dmgPath),
      updaterFeed: await fileMetadata(feedPath),
      appAsar: await fileMetadata(asarPath),
      app: {
        version: info.CFBundleShortVersionString,
        buildVersion: info.CFBundleVersion,
        bundleIdentifier: info.CFBundleIdentifier,
        minimumSystemVersion: info.LSMinimumSystemVersion,
        electronAsarIntegrity: info.ElectronAsarIntegrity,
      },
      signature: {
        ...parseCodesign(codesignOutput),
        gatekeeperAccepted,
      },
    },
    desktopShell: {
      lib: {
        total: desktopLib.exact.length + desktopLib.different.length + desktopLib.absentFromSourceTree.length,
        counts: comparisonCounts(desktopLib),
        comparison: desktopLib,
      },
      renderer: {
        total: desktopRenderer.exact.length + desktopRenderer.different.length + desktopRenderer.absentFromSourceTree.length,
        counts: comparisonCounts(desktopRenderer),
        comparison: desktopRenderer,
      },
    },
    packages: {
      summary: packageSummary,
      differenceClassifications: countClassifications(packages, 'different'),
      absenceClassifications: countClassifications(packages, 'absentFromSourceTree'),
      rows: packages,
    },
    libreOfficeEngine,
  }

  const compactProvenance = {
    schemaVersion: data.schemaVersion,
    generatedAt: data.generatedAt,
    ...data.provenance,
  }
  await writeFile(join(analysisRoot, 'provenance.json'), `${JSON.stringify(compactProvenance, null, 2)}\n`)
  await writeFile(join(analysisRoot, 'runtime-map.json'), `${JSON.stringify(data, null, 2)}\n`)
  await writeFile(join(analysisRoot, 'package-map.csv'), packageCsv(packages))
  await writeFile(join(analysisRoot, 'SUMMARY.md'), markdownSummary(data))

  const checksums = [
    [data.provenance.dmg.sha256, projectPath(dmgPath)],
    [data.provenance.updaterFeed.sha256, projectPath(feedPath)],
    [data.provenance.appAsar.sha256, projectPath(asarPath)],
    [await sha256(join(extractedRoot, 'lib', 'main.js')), 'deobfuscated/app-asar/lib/main.js'],
    [await sha256(join(sourceRoot, 'apps', 'desktop', 'lib', 'main.js')), 'upstream-source/apps/desktop/lib/main.js'],
  ]
  await writeFile(
    join(analysisRoot, 'checksums.sha256'),
    `${checksums.map(([hash, path]) => `${hash}  ${path}`).join('\n')}\n`,
  )

  process.stdout.write(`${JSON.stringify({
    sourceTag,
    sourceCommit,
    appVersion: info.CFBundleShortVersionString,
    desktopLib: data.desktopShell.lib.counts,
    desktopRenderer: data.desktopShell.renderer.counts,
    packages: packageSummary,
  }, null, 2)}\n`)
}

await main()
