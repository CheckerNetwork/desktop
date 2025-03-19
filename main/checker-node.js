'use strict'

const { app, dialog } = require('electron')
const { join } = require('node:path')
const { fork } = require('node:child_process')
const wallet = require('./wallet')
const assert = require('node:assert')
const fs = require('node:fs/promises')
const Sentry = require('@sentry/node')
const consts = require('./consts')
const { randomUUID } = require('node:crypto')
const { Activities } = require('./activities')
const { Logs } = require('./logs')
const split2 = require('split2')
const { parseEther } = require('ethers/lib/utils')
const { once } = require('node:events')
const { format } = require('node:util')

const log = require('electron-log').scope('checker-node')

/** @typedef {import('./typings').Context} Context */

// Checker Node is installed separately from `node_modules`, since it needs a
// self-contained dependency tree outside the asar archive.
const checkerNodePath = app.isPackaged
  ? join(process.resourcesPath, 'checker-node', 'bin', 'checker.js')
  : join(__dirname, '..', 'checker-node', 'bin', 'checker.js')
log.info(format('Checker Node binary: %s', checkerNodePath))

const logs = new Logs()
const activities = new Activities()
let totalJobsCompleted = 0

/**
 * @param {Context} ctx
 */
async function setup (ctx) {
  ctx.saveModuleLogsAs = async () => {
    const opts = {
      defaultPath: `station-modules-${(new Date()).getTime()}.log`
    }
    // The dialog might not show if the UI is hidden
    ctx.showUI()
    const { filePath } = await dialog.showSaveDialog(opts)
    if (filePath) {
      await fs.writeFile(filePath, logs.get())
    }
  }
}

/**
 * @param {Context} ctx
 */
async function run (ctx) {
  while (true) {
    await start(ctx)
  }
}

let lastCrashReportedAt = 0
/**
 * @param {unknown} err
 * @param {any} scopeFn
 */
function maybeReportErrorToSentry (err, scopeFn) {
  const now = Date.now()
  if (now - lastCrashReportedAt < 4 /* HOURS */ * 3600_000) return
  lastCrashReportedAt = now
  log.error(
    'Reporting the problem to Sentry for inspection by the Station team.'
  )
  Sentry.captureException(err, scopeFn)
}

/**
 * @param {Context} ctx
 */
async function start (ctx) {
  log.info('Starting Checker Node...')

  const childProcess = fork(
    checkerNodePath,
    ['--json', '--recreateCheckerIdOnError'],
    {
      env: {
        ...process.env,
        FIL_WALLET_ADDRESS: await wallet.getAddress(),
        // "Station core" is a legacy term, from before this product was
        // renamed to Checker. We're continuing to use it as the passphrase, in
        // order to prevent all nodes from getting a new ID.
        PASSPHRASE: await wallet.signMessage('station core passhprase'),
        CACHE_ROOT: consts.CACHE_ROOT,
        STATE_ROOT: consts.STATE_ROOT,
        DEPLOYMENT_TYPE: 'checker-app'
      },
      stdio: ['pipe', 'pipe', 'pipe', 'ipc']
    }
  )
  log.info(format('Checker Node pid:', childProcess.pid))

  assert(childProcess.stdout)
  childProcess.stdout.setEncoding('utf8')
  childProcess.stdout
    .pipe(split2())
    .on('data', line => {
      logs.pushLine(line)
      let event
      try {
        event = JSON.parse(line)
      } catch (_err) {
        const err = new Error(`Failed to parse checker node event: ${line}`)
        err.cause = _err
        if (!line.includes('failed to detect network')) {
          Sentry.captureException(err)
        }
        log.error(format('Cannot parse Checker Node stdout:', err))
        return
      }
      switch (event.type) {
        case 'jobs-completed':
          totalJobsCompleted = event.total
          ctx.setTotalJobsCompleted(event.total)
          wallet.setScheduledRewards(
            parseEther(event.rewardsScheduledForAddress)
          )
          ctx.setScheduledRewardsForAddress(event.rewardsScheduledForAddress)
          break
        case 'activity:info':
        case 'activity:error':
        case 'activity:started': {
          const activity = {
            ...event,
            type: event.type.replace('activity:', ''),
            timestamp: new Date(),
            id: randomUUID()
          }
          activities.push(ctx, activity)
          break
        }
        default: {
          const err = new Error(
            `Unknown Station Checker Node event type "${event.type}": ${line}`
          )
          log.error(format(err))
          Sentry.captureException(err)
        }
      }
    })

  assert(childProcess.stderr)
  childProcess.stderr.setEncoding('utf8')
  childProcess.stderr
    .pipe(split2())
    .on('data', line => logs.pushLine(line))

  const onBeforeQuit = () => childProcess.kill()
  app.on('before-quit', onBeforeQuit)

  const onceExited = once(childProcess, 'exit')
  const onceClosed = once(childProcess, 'close')

  const [exitCode, exitSignal] = await onceExited
  app.removeListener('before-quit', onBeforeQuit)
  const reason = exitSignal
    ? `via signal ${exitSignal}`
    : `with code: ${exitCode}`
  const msg = `Checker Node exited ${reason}`
  log.info(msg)
  const exitReason = exitSignal || exitCode ? reason : null

  const [closeCode] = await onceClosed
  log.info(
    `Checker Node closed all stdio with code ${closeCode ?? '<no code>'}`
  )

  if (closeCode === 2) {
    // FIL_WALLET_ADDRESS did not pass our screening. There is not much
    // we can do about that, there is no point in reporting this error
    // to Sentry.
    throw new Error('Invalid Filecoin wallet address')
  }

  maybeReportErrorToSentry(
    'Checker Node exited',
    (/** @type {any} */ scope) => {
      // Sentry UI can't show the full 100 lines
      scope.setExtra('logs', logs.getLastLines(20))
      scope.setExtra('reason', exitReason)
      return scope
    }
  )
}

module.exports = {
  setup,
  run,
  isOnline: () => activities.isOnline(),
  getActivities: () => activities.get(),
  getTotalJobsCompleted: () => totalJobsCompleted
}
