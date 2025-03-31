'use strict'

const { IS_MAC, CHECKER_VERSION } = require('./consts')
const { Menu, Tray, app, ipcMain, nativeImage } = require('electron')
const { ipcMainEvents } = require('./ipc')
const path = require('path')
const assert = require('node:assert')
const checkerNode = require('./checker-node')
const { formatTokenValue } = require('./utils')

/** @typedef {import('./typings').Context} Context */

// Be warned, this one is pretty ridiculous:
// Tray must be global or it will break due to.. GC.
// https://www.electronjs.org/docs/faq#my-apps-tray-disappeared-after-a-few-minutes
/** @type {Tray | null} */
let tray = null

const icons = {
  on: icon('on'),
  off: icon('off'),
  updateOn: icon('update'),
  updateOff: icon('update-off')
}

function icon (/** @type {'on' | 'off' | 'update' | 'update-off'} */ state) {
  const dir = path.resolve(path.join(__dirname, '../assets/tray'))
  const file = IS_MAC ? `${state}-macos.png` : `${state}.png`
  const image = nativeImage.createFromPath(path.join(dir, file))
  image.setTemplateImage(true)
  return image
}

/**
 * @param {boolean} readyToUpdate
 * @param {boolean} isOnline
 */
function getTrayIcon (readyToUpdate, isOnline) {
  return readyToUpdate
    ? isOnline
      ? icons.updateOn
      : icons.updateOff
    : isOnline
      ? icons.on
      : icons.off
}

const createContextMenu = (/** @type {Context} */ ctx) => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Checker v${CHECKER_VERSION}`,
      enabled: false
    },
    {
      label: 'Open Checker',
      click: () => ctx.showUI()
    },
    { type: 'separator' },
    {
      label: `Jobs Completed: ${
        ctx.getTotalJobsCompleted() || '...'
      }`,
      enabled: false
    },
    {
      label:
        `Wallet Balance: ${
          formatTokenValue(ctx.getWalletBalance())
        } FIL`,
      enabled: false
    },
    {
      label: `Scheduled Rewards: ${
        formatTokenValue(ctx.getScheduledRewards())
      } FIL`,
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit Checker',
      click: () => app.quit(),
      accelerator: IS_MAC ? 'Command+Q' : undefined
    }
  ])
  return contextMenu
}

module.exports = async function (/** @type {Context} */ ctx) {
  tray = new Tray(getTrayIcon(false, checkerNode.isOnline()))

  const contextMenu = createContextMenu(ctx)
  tray.setToolTip('Checker')
  tray.setContextMenu(contextMenu)

  setupIpcEventListeners(ctx)
}

/**
 * @param {Context} ctx
 */
function setupIpcEventListeners (ctx) {
  ipcMain.on(ipcMainEvents.ACTIVITY_LOGGED, updateTray)
  ipcMain.on(ipcMainEvents.READY_TO_UPDATE, updateTray)
  ipcMain.on(ipcMainEvents.JOB_STATS_UPDATED, updateTray)
  ipcMain.on(ipcMainEvents.BALANCE_UPDATE, updateTray)
  ipcMain.on(ipcMainEvents.SCHEDULED_REWARDS_UPDATE, updateTray)

  function updateTray () {
    assert(tray)
    tray.setImage(
      getTrayIcon(ctx.getUpdaterStatus().readyToUpdate, checkerNode.isOnline())
    )
    const contextMenu = createContextMenu(ctx)
    tray.setContextMenu(contextMenu)
  }
}
