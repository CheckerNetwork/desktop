'use strict'

const Sentry = require('@sentry/node')
const { BrowserWindow, Notification, app, shell } = require('electron')
const { autoUpdater } = require('electron-updater')
const { ipcMain } = require('electron/main')
const { ipcMainEvents } = require('./ipc')
const ms = require('ms')
const log = require('electron-log').scope('updater')
const { showDialogSync } = require('./dialog')
const Store = require('electron-store')

/** @type {import('p-retry').default} */
let pRetry

// must be global to avoid gc
let updateNotification = null

let checkingManually = false

let readyToUpdate = false

/** @type {string | undefined} */
let nextVersion

const store = new Store({ name: 'updater' })

function quitAndInstall () {
  log.info('Restarting Checker to install the new version')
  beforeQuitCleanup()
  store.set('upgradeToVersion', nextVersion)
  autoUpdater.quitAndInstall()
}

function beforeQuitCleanup () {
  BrowserWindow.getAllWindows().forEach(w => w.removeAllListeners('close'))
  app.removeAllListeners('window-all-closed')
}

async function setup (/** @type {import('./typings').Context} */ ctx) {
  pRetry = (await import('p-retry')).default

  autoUpdater.logger = log
  autoUpdater.autoDownload = false // we download manually in 'update-available'

  autoUpdater.on('error', onUpdaterError)
  autoUpdater.on('update-available', onUpdateAvailable)
  autoUpdater.on('update-not-available', onUpdateNotAvailable)
  autoUpdater.on('update-downloaded', (event) => onUpdateDownloaded(ctx, event))

  // built-in updater != electron-updater
  // https://github.com/electron-userland/electron-builder/pull/6395
  require('electron')
    .autoUpdater
    .on('before-quit-for-update', beforeQuitCleanup)
}

module.exports = async function setupUpdater (
  /** @type {import('./typings').Context} */ ctx
) {
  ctx.getUpdaterStatus = function getUpdaterStatus () {
    return { readyToUpdate }
  }

  ctx.openReleaseNotes = openReleaseNotes

  if (['test', 'development'].includes(process.env.NODE_ENV ?? '')) {
    ctx.manualCheckForUpdates = () => {
      showDialogSync({
        title: 'Not available in development',
        message: 'Yes, you called this function successfully.',
        type: 'info',
        buttons: ['Close']
      })
    }

    ctx.restartToUpdate = () => {
      showDialogSync({
        title: 'Not available in development',
        message: 'Yes, you called this function successfully.',
        type: 'info',
        buttons: ['Close']
      })
    }

    return
  }

  setup(ctx)

  checkForUpdatesInBackground() // async check on startup
  setInterval(checkForUpdatesInBackground, ms('12h'))

  // enable on-demand check via Tray menu
  ctx.manualCheckForUpdates = () => {
    checkingManually = true
    checkForUpdatesInBackground()
  }

  ctx.restartToUpdate = () => {
    quitAndInstall()
  }
}

function checkForUpdatesInBackground () {
  ipcMain.emit(ipcMainEvents.UPDATE_CHECK_STARTED)

  // TODO: replace this with autoUpdater.checkForUpdatesAndNotify()
  autoUpdater.checkForUpdates()
    .catch(err => {
      log.error('error', err)
    })
    .finally(() => ipcMain.emit(ipcMainEvents.UPDATE_CHECK_FINISHED))
}

/**
 * @param {any} err
 */
function onUpdaterError (err) {
  log.error('error', err)
  Sentry.captureException(err)

  if (!checkingManually) { return }
  checkingManually = false

  showDialogSync({
    title: 'Could not download update',
    message: 'It was not possible to download the update. Please check your ' +
      'Internet connection and try again.',
    type: 'error',
    buttons: ['Close']
  })
}

/**
 * @param {import('electron-updater').UpdateInfo} info
 */
function onUpdateAvailable ({ version /*, releaseNotes */ }) {
  nextVersion = version

  log.info(`Update to version ${version} is available, downloading..`)
  pRetry(
    () => autoUpdater.downloadUpdate(),
    {
      retries: 10,
      onFailedAttempt: err => {
        console.error(err)
        console.error('Failed to download update. Retrying...')
      }
    }
  ).then(
    _ => log.info('Update downloaded'),
    err => log.error('Cannot download the update.', err)
  )
}

function openReleaseNotes () {
  const version = nextVersion ? `v${nextVersion}` : 'latest'
  shell.openExternal(`https://github.com/CheckerNetwork/app/releases/${version}`)
}

/**
 * @param {import('electron-updater').UpdateInfo} info
 */
function onUpdateNotAvailable ({ version }) {
  log.info(`update not available from version ${version}`)

  if (!checkingManually) { return }
  checkingManually = false

  showDialogSync({
    title: 'Update not available',
    message: `You are on the latest version of Checker (${version}).`,
    type: 'info',
    buttons: ['Close']
  })
}

/**
 * @param {import('./typings').Context} ctx
 * @param {import('electron-updater').UpdateDownloadedEvent} event
 */
function onUpdateDownloaded (ctx, { version /*, releaseNotes */ }) {
  readyToUpdate = true
  log.info(`update to ${version} downloaded`)

  const showUpdateDialog = () => {
    const buttonIx = showDialogSync({
      title: 'Update Checker',
      message: `An update to Checker ${version} is available. ` +
        'Would you like to install it now?',
      type: 'info',
      buttons: ['Later', 'Show Release Notes', 'Install now']
    })
    if (buttonIx === 1) { // show release notes
      openReleaseNotes()
    } else if (buttonIx === 2) { // install now
      setImmediate(quitAndInstall)
    }
  }

  if (checkingManually) {
    // when checking manually, show the dialog immediately
    showUpdateDialog()
    // also don't trigger the automatic Checker restart
    // showUpdateDialog() offers the user to restart
  } else if (ctx.isShowingUI) {
    // show unobtrusive notification + dialog on click
    ipcMain.emit(ipcMainEvents.READY_TO_UPDATE)
    updateNotification = new Notification({
      title: 'Checker Update',
      body: `An update to Checker ${version} is available.`
    })
    updateNotification.on('click', showUpdateDialog)
    updateNotification.show()
  } else if (version !== store.get('upgradeToVersion')) {
    // We are running in tray, the user is not interacting with the app
    // We have a new version that we did not tried to install previously
    // Let's go ahead and restart the app to update
    updateNotification = new Notification({
      title: 'Restarting Checker',
      body: `Updating to version ${version}.`
    })
    updateNotification.show()
    setImmediate(quitAndInstall)
  }
}
