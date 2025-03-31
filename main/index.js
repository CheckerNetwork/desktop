'use strict'

const { app, dialog, shell } = require('electron')
const electronLog = require('electron-log')
const path = require('node:path')
const { format } = require('node:util')

console.log('Log file:', electronLog.transports.file.getFile().path)
const log = electronLog.scope('main')

// Override the place where we look for config files when running the end-to-end
// test suite.
// We must call this early on, before any of our modules accesses the config
// store.
// https://www.npmjs.com/package/electron-store
// https://www.electronjs.org/docs/latest/api/app#appgetpathname
if (process.env.CHECKER_ROOT) {
  app.setPath('userData', path.join(process.env.CHECKER_ROOT, 'user-data'))

  // Also set 'localUserData' after this PR is landed & released:
  // We are using localUserData for Saturn L2 cache
  // https://github.com/electron/electron/pull/34337
}

require('./setup-sentry')

const { ipcMainEvents, setupIpcMain } = require('./ipc')
const { BUILD_VERSION } = require('./consts')
const { ipcMain } = require('electron/main')
const os = require('os')
const checkerNode = require('./checker-node')
const wallet = require('./wallet')
const settings = require('./settings')
const serve = require('electron-serve')
const { setupAppMenu } = require('./app-menu')
const setupTray = require('./tray')
const setupUI = require('./ui')
const setupUpdater = require('./updater')
const Sentry = require('@sentry/node')
const telemetry = require('./telemetry')
const { validateExternalURL } = require('./utils')

const inTest = (process.env.NODE_ENV === 'test')
const isDev = !app.isPackaged && !inTest

log.info(format(
  'Checker build version: %s %s-%s%s%s',
  BUILD_VERSION,
  os.platform(),
  os.arch(),
  isDev ? ' [DEV]' : '',
  inTest ? ' [TEST]' : ''
))
log.info(format('Machine spec: %s version %s', os.type(), os.release()))
// TODO(bajtos) print machine architecture after we upgrade to Electron with
// Node.js 18
// log.info('Machine spec: %s %s version %s', os.type(),
//   os.machine(),
//   os.release())
if (app.runningUnderARM64Translation) {
  log.warn(
    'Warning: we are running under ARM64 translation' +
      ' (macOS Rosetta or Windows WOW).'
  )
}

// Expose additional metadata for Electron preload script
process.env.CHECKER_BUILD_VERSION = BUILD_VERSION

function handleError (/** @type {any} */ err) {
  Sentry.captureException(err)

  log.error(err)
  dialog.showErrorBox('Error occured', err.stack ?? err.message ?? err)
}

// ensures there are no unhandled errors during initial dev
process.on('uncaughtException', handleError)
process.on('unhandledRejection', handleError)

// Sets User Model Id so notifications work on Windows 10
// To show notifications properly on Windows, we must manually set the
// appUserModelID
// See https://www.electronjs.org/docs/tutorial/notifications#windows
if (process.platform === 'win32') {
  app.setAppUserModelId('network.checker.app')
}

// Only one instance can run at a time
if (!inTest && !app.requestSingleInstanceLock()) {
  app.quit()
}

// When the user attempts to start the app and didn't notice the Checker icon in
// the tray, help them out by showing the main window
app.on('second-instance', () => {
  ctx.showUI()
})

/** @type {import('./typings').Context} */
const ctx = {
  getActivities: () => checkerNode.getActivities(),

  recordActivity: activity => {
    ipcMain.emit(ipcMainEvents.ACTIVITY_LOGGED, activity)
  },

  getTotalJobsCompleted: () => checkerNode.getTotalJobsCompleted(),
  setTotalJobsCompleted: (count) => {
    ipcMain.emit(
      ipcMainEvents.JOB_STATS_UPDATED,
      count
    )
  },
  getScheduledRewardsForAddress: () => wallet.getScheduledRewards(),
  setScheduledRewardsForAddress: (balance) => {
    ipcMain.emit(
      ipcMainEvents.SCHEDULED_REWARDS_UPDATE,
      balance
    )
  },

  getScheduledRewards: () => wallet.getScheduledRewards(),
  getWalletBalance: () => wallet.getBalance(),

  manualCheckForUpdates: () => { throw new Error('never get here') },
  saveSubnetLogsAs: () => { throw new Error('never get here') },
  toggleOpenAtLogin: () => { throw new Error('never get here') },
  isOpenAtLogin: () => { throw new Error('never get here') },
  exportSeedPhrase: () => { throw new Error('never get here') },
  showUI: () => { throw new Error('never get here') },
  isShowingUI: false,
  loadWebUIFromDist: serve({
    directory: path.resolve(__dirname, '../renderer/dist')
  }),
  restartToUpdate: () => { throw new Error('never get here') },
  openReleaseNotes: () => { throw new Error('never get here') },
  getUpdaterStatus: () => { throw new Error('never get here') },
  openExternalURL: (/** @type {string} */ url) => {
    validateExternalURL(url)
    shell.openExternal(url)
  },
  transactionUpdate: (transactions) => {
    ipcMain.emit(ipcMainEvents.TRANSACTION_UPDATE, transactions)
  },
  balanceUpdate: (balance) => {
    ipcMain.emit(ipcMainEvents.BALANCE_UPDATE, balance)
  }
}

app.on('before-quit', () => {
  // Flush pending events immediately
  // See https://docs.sentry.io/platforms/node/configuration/draining/
  Sentry.close()
})

process.on('uncaughtException', err => {
  Sentry.captureException(err)
  log.error(err)
  process.exitCode = 1
})

async function run () {
  try {
    await app.whenReady()
  } catch (e) {
    handleError(e)
    app.exit(1)
  }

  try {
    setupTray(ctx)
    if (process.platform === 'darwin') {
      await setupAppMenu(ctx)
    }
    await setupUI(ctx)
    await setupUpdater(ctx)
    await setupIpcMain(ctx)

    await wallet.setup(ctx)
    await telemetry.setup()
    await checkerNode.setup(ctx)
    await settings.setup(ctx)

    await checkerNode.run(ctx)
  } catch (e) {
    handleError(e)
  }
}

run()
