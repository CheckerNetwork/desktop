import { execa } from 'execa'
import * as Sentry from '@sentry/node'
import { installBinaryModule, updateSourceFiles, getBinaryModuleExecutable } from './modules.js'
import os from 'node:os'
import pRetry from 'p-retry'
import timers from 'node:timers/promises'
import { join } from 'node:path'

const ZINNIA_DIST_TAG = 'v0.20.3'
const ZINNIA_MODULES = [
  {
    module: 'spark',
    ipnsKey: 'k51qzi5uqu5dlej5gtgal40sjbowuau5itwkr6mgyuxdsuhagjxtsfqjd6ym3g'
  }
]
const {
  TARGET_ARCH = os.arch(),
  MODULE_FILTER = ''
} = process.env

export const install = () => installBinaryModule({
  module: 'zinnia',
  repo: 'filecoin-station/zinnia',
  distTag: ZINNIA_DIST_TAG,
  executable: 'zinniad',
  arch: TARGET_ARCH,
  targets: [
    { platform: 'darwin', arch: 'arm64', asset: 'zinniad-macos-arm64.zip' },
    { platform: 'darwin', arch: 'x64', asset: 'zinniad-macos-x64.zip' },
    { platform: 'linux', arch: 'arm64', asset: 'zinniad-linux-arm64.tar.gz' },
    { platform: 'linux', arch: 'x64', asset: 'zinniad-linux-x64.tar.gz' },
    { platform: 'win32', arch: 'x64', asset: 'zinniad-windows-x64.zip' }
  ]
})

let lastErrorReportedAt = 0
const maybeReportErrorToSentry = (/** @type {unknown} */ err) => {
  const now = Date.now()
  if (now - lastErrorReportedAt < 4 /* HOURS */ * 3600_000) return
  lastErrorReportedAt = now

  /** @type {Parameters<Sentry.captureException>[1]} */
  const hint = { extra: {} }
  if (typeof err === 'object') {
    if ('reportToSentry' in err && err.reportToSentry === false) {
      return
    }
    Object.assign(err, { reportToSentry: false })
    if ('details' in err && typeof err.details === 'string') {
      // Quoting from https://develop.sentry.dev/sdk/data-handling/
      // > Messages are limited to 8192 characters.
      // > Individual extra data items are limited to 16kB. Total extra data is limited to 256kb.
      // Let's store the additional details (e.g. stdout && stderr) in an extra field
      const tail = err.details.split(/\n/g).slice(-50).join('\n')
      hint.extra.details = tail
    }
    if ('moduleName' in err && typeof err.moduleName === 'string') {
      hint.extra.moduleName = err.moduleName
    }
  }

  console.error('Reporting the problem to Sentry for inspection by the Station team.')
  Sentry.captureException(err, hint)
}

const matchesModuleFilter = module =>
  MODULE_FILTER === '' || module === MODULE_FILTER

const capitalize = str => `${str.charAt(0).toUpperCase()}${str.slice(1)}`

const updateAllSourceFiles = async ({
  moduleVersionsDir,
  moduleSourcesDir,
  signal
}) => {
  const modules = await Promise.all(
    Object
      .values(ZINNIA_MODULES)
      .filter(({ module }) => matchesModuleFilter(module))
      .map(({ module, ipnsKey }) =>
        pRetry(
          attemptNumber => updateSourceFiles({
            module,
            ipnsKey,
            moduleVersionsDir,
            moduleSourcesDir,
            noCache: attemptNumber > 1
          }),
          {
            signal,
            retries: 10,
            onFailedAttempt: err => {
              console.error(err)
              const msg = `Failed to download ${module} source. Retrying...`
              console.error(msg)
              if (String(err).includes('You are being rate limited')) {
                const delaySeconds = 60 + (Math.random() * 60)
                // Don't DDOS the w3name services
                console.error(
                  `Rate limited. Waiting ${delaySeconds} seconds...`
                )
                return timers.setTimeout(delaySeconds * 1000)
              }
            }
          }
        )
      )
  )
  const hasUpdated = modules.find(updated => updated === true)
  return hasUpdated
}

const runUpdateSourceFilesLoop = async ({
  controller,
  signal,
  onActivity,
  moduleVersionsDir,
  moduleSourcesDir
}) => {
  while (true) {
    if (signal.aborted) {
      return
    }
    const delay = 10 * 60 * 1000 // 10 minutes
    const jitter = Math.random() * 20_000 - 10_000 // +- 10 seconds
    try {
      await timers.setTimeout(delay + jitter, null, { signal })
    } catch (err) {
      if (err.name === 'AbortError') return
      throw err
    }
    try {
      const shouldRestart = await updateAllSourceFiles({
        moduleVersionsDir,
        moduleSourcesDir,
        signal
      })
      if (shouldRestart) {
        onActivity({
          type: 'info',
          message: 'Updated Zinnia module source code, restarting...'
        })
        controller.abort()
        return
      }
    } catch (err) {
      onActivity({
        type: 'error',
        message: 'Failed to update Zinnia module source code'
      })
      console.error(err)
      maybeReportErrorToSentry(err)
    }
  }
}

const catchChildProcessExit = async ({
  childProcesses,
  controller,
  onActivity
}) => {
  try {
    const tasks = childProcesses.map(p => (async () => {
      try {
        await p
        onActivity({ type: 'info', message: `${capitalize(module)} exited` })
      } catch (err) {
        // When the child process crash, attach the module name & the exit reason to the error object
        const exitReason = p.exitCode
          ? `with exit code ${p.exitCode}`
          : p.signalCode ? `via signal ${p.signalCode}` : undefined
        throw Object.assign(err, { moduleName: p.moduleName, exitReason, signalCode: p.signalCode })
      }
    })())

    await Promise.race(tasks)
  } catch (err) {
    if (err.name === 'AbortError') {
      Object.assign(err, { reportToSentry: false })
    } else {
      const moduleName = capitalize(err.moduleName ?? 'Zinnia')
      const exitReason = err.exitReason ?? 'for unknown reason'
      const message = `${moduleName} crashed ${exitReason}`
      onActivity({ type: 'error', message })

      const moduleErr = new Error(message, { cause: err })
      // Store the full error message including stdout & stder in the top-level `details` property
      Object.assign(moduleErr, { details: err.message })

      if (err.signalCode && ['SIGTERM', 'SIGKILL', 'SIGINT'].includes(err.signalCode)) {
        // These signal codes are triggered when somebody terminates the process from outside.
        // It's not a problem in Zinnia, there is nothing we can do about this.
        // Don't report this error to Sentry and don't print the stack trace to stderr,
        // treat this as a regular exit (successful completion of the process).
        // (Note that this event has been already logged via `onActivity()` call above.)
        return
      } else {
        // Apply a custom rule to force Sentry to group all issues with the same module & exit code
        // See https://docs.sentry.io/platforms/node/usage/sdk-fingerprinting/#basic-example
        Sentry.withScope(scope => {
          scope.setFingerprint([message])
          maybeReportErrorToSentry(moduleErr)
        })
      }
    }
    throw err
  } finally {
    controller.abort()
  }
}

export async function run ({
  provider,
  STATION_ID,
  FIL_WALLET_ADDRESS,
  ethAddress,
  STATE_ROOT,
  CACHE_ROOT,
  moduleVersionsDir,
  moduleSourcesDir,
  onActivity,
  onMetrics,
  isUpdated = false
}) {
  const zinniadExe = getBinaryModuleExecutable({ module: 'zinnia', executable: 'zinniad' })

  if (!isUpdated) {
    try {
      onActivity({
        type: 'info',
        message: 'Updating source code for Zinnia modules...'
      })
      await updateAllSourceFiles({
        moduleVersionsDir,
        moduleSourcesDir,
        signal: null
      })
      onActivity({
        type: 'info',
        message: 'Zinnia module source code up to date'
      })
    } catch (err) {
      onActivity({
        type: 'error',
        message: 'Failed to download latest Zinnia module source code'
      })
      throw err
    }
  }

  const controller = new AbortController()
  const { signal } = controller
  const childProcesses = []

  for (const { module } of ZINNIA_MODULES) {
    if (!matchesModuleFilter(module)) continue

    // all paths are relative to `moduleBinaries`
    const childProcess = execa(
      zinniadExe,
      [join(module, 'main.js')],
      {
        cwd: moduleSourcesDir,
        env: {
          STATION_ID,
          FIL_WALLET_ADDRESS,
          STATE_ROOT,
          CACHE_ROOT
        },
        cancelSignal: signal
      }
    )
    childProcesses.push(Object.assign(childProcess, { moduleName: module }))

    let timeoutId
    const resetTimeout = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        onActivity({
          type: 'error',
          message: `${capitalize(module)} has been inactive for 5 minutes, restarting...`
        })

        const err = new Error('Module inactive for 5 minutes')
        Object.assign(err, { module })
        maybeReportErrorToSentry(err)

        controller.abort()
      }, 5 * 60 * 1000)
    }
    resetTimeout()
    signal.addEventListener('abort', () => clearTimeout(timeoutId))

    childProcess.stdout.setEncoding('utf-8')
    childProcess.stdout.on('data', data => {
      resetTimeout()
      handleEvents({
        module,
        onActivity,
        onMetrics,
        text: data
      }).catch(err => {
        console.error(err)
        Sentry.captureException(err)
      })
    })
    childProcess.stderr.setEncoding('utf-8')
    childProcess.stderr.on('data', data => {
      resetTimeout()
      process.stderr.write(data)
    })
  }

  try {
    await Promise.all([
      runUpdateSourceFilesLoop({
        controller,
        signal,
        onActivity,
        moduleVersionsDir,
        moduleSourcesDir
      }),
      catchChildProcessExit({ childProcesses, onActivity, controller })
    ])
    console.error('Zinnia main loop ended')
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error('Zinnia main loop aborted')
    } else {
      console.error('Zinnia main loop errored', err)
      maybeReportErrorToSentry(err)
    }
  } finally {
    controller.abort()
  }

  // This infinite recursion has no risk of exceeding the maximum call stack
  // size, as awaiting promises unwinds the stack
  return run({
    provider,
    STATION_ID,
    FIL_WALLET_ADDRESS,
    ethAddress,
    STATE_ROOT,
    CACHE_ROOT,
    moduleVersionsDir,
    moduleSourcesDir,
    onActivity,
    onMetrics,
    isUpdated: true
  })
}

const jobsCompleted = {}

async function handleEvents ({
  module,
  onActivity,
  onMetrics,
  text
}) {
  for (const line of text.trimEnd().split(/\n/g)) {
    let event
    try {
      event = JSON.parse(line)
    } catch (err) {
      console.error('Ignoring malformed Zinnia event:', line)
    }

    try {
      switch (event.type) {
        case 'activity:started':
          onActivity({
            type: 'info',
            message: `${capitalize(module)} started`,
            source: module
          })
          break
        case 'activity:info':
          onActivity({
            type: 'info',
            message:
              event.message.replace(/Module Runtime/, capitalize(module)),
            source: event.module
          })
          break

        case 'activity:error':
          onActivity({
            type: 'error',
            message:
              event.message.replace(/Module Runtime/, capitalize(module)),
            source: event.module
          })
          break

        case 'jobs-completed': {
          jobsCompleted[module] = event.total
          const totalJobsCompleted = Object.values(jobsCompleted).reduce((a, b) => a + b, 0)
          onMetrics({ totalJobsCompleted })
          break
        }

        default:
          console.error('Ignoring Zinnia event of unknown type:', event)
      }
    } catch (err) {
      console.error('Cannot handle Zinnia event: %s', line)
      console.error(err)
    }
  }
}
