'use strict'

const { spawn } = require('node:child_process')
const { platform } = require('node:os')
const assert = require('node:assert')
const { join } = require('node:path')
const { once } = require('node:events')

/** @typedef {import('app-builder-lib').AfterPackContext} AfterPackContext */

/**
 * @param {AfterPackContext} context
 */
exports.default = async function (context) {
  if (platform() !== 'darwin') return
  const arch = context.arch === 1
    ? 'x64'
    : context.arch === 3
      ? 'arm64'
      : context.arch === 4
        ? 'universal'
        : null
  if (arch === 'universal') return
  assert(arch, `Unknown architecture id: ${context.arch}`)
  console.log(`Rebuild Checker Node for arch=${arch}`)
  const ps = spawn(
    'node',
    ['scripts/post-install.js'],
    {
      cwd: join(
        context.appOutDir,
        'Checker.app',
        'Contents',
        'Resources',
        'checker-node'
      ),
      env: {
        ...process.env,
        TARGET_ARCH: arch
      }
    }
  )
  ps.stdout.pipe(process.stdout)
  ps.stderr.pipe(process.stderr)
  await once(ps, 'exit')
}
