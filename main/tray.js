'use strict'

const { IS_MAC, STATION_VERSION } = require('./consts')
const { Menu, Tray, app, ipcMain, nativeImage } = require('electron')
const { ipcMainEvents } = require('./ipc')
const path = require('path')
const timers = require('node:timers/promises')

/** @typedef {import('./typings').Context} Context */

// Be warned, this one is pretty ridiculous:
// Tray must be global or it will break due to.. GC.
// https://www.electronjs.org/docs/faq#my-apps-tray-disappeared-after-a-few-minutes
let tray = null

function icon (/** @type {'on' | 'off'} */ state) {
  const dir = path.resolve(path.join(__dirname, '../assets/tray'))
  if (IS_MAC) return path.join(dir, `${state}-macos.png`)
  return path.join(dir, `${state}.png`)
}

module.exports = function (/** @type {Context} */ ctx) {
  const image = nativeImage.createFromPath(
    icon(Math.random() > 0.5 ? 'on' : 'off')
  )
  image.setTemplateImage(true)
  tray = new Tray(image)

  ;(async () => {
    while (true) {
      await timers.setTimeout(1000)

      // Check if connected to Saturn network
      const entries = ctx.getAllActivities()
      let connected = false
      for (const entry of entries.reverse()) {
        if (
          entry.source === 'Saturn' &&
          entry.type === 'info' &&
          entry.message.includes('Saturn Node is online')
        ) {
          connected = true
          break
        } else if (
          entry.source === 'Saturn' &&
          (
            entry.type === 'error' ||
            (
              entry.message === 'Saturn Node started.' ||
              entry.message.includes('was able to connect') ||
              entry.message.includes('will try to connect')
            )
          )
        ) {
          connected = false
          break
        }
      }

      const state = connected ? 'on' : 'off'
      const image = nativeImage.createFromPath(icon(state))
      image.setTemplateImage(true)
      tray.setImage(image)
    }
  })()

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Filecoin Station v${STATION_VERSION}`,
      enabled: false
    },
    {
      label: 'Open Station',
      click: () => ctx.showUI()
    },
    { type: 'separator' },
    {
      id: 'checkForUpdates',
      label: 'Check for Updates...',
      click: () => { ctx.manualCheckForUpdates() }
    },
    {
      id: 'checkingForUpdates',
      label: 'Checking for Updates',
      enabled: false,
      visible: false
    },
    {
      label: 'Save Saturn Module Log As…',
      click: function () {
        ctx.saveSaturnModuleLogAs()
      }
    },
    { type: 'separator' },
    {
      label: 'Start at login',
      type: 'checkbox',
      click: function (item) {
        const openAtLogin = !app.getLoginItemSettings().openAtLogin
        app.setLoginItemSettings({ openAtLogin })
        item.checked = openAtLogin
      },
      checked: app.getLoginItemSettings().openAtLogin
    },
    { type: 'separator' },
    {
      label: 'Quit Station',
      click: () => app.quit(),
      accelerator: IS_MAC ? 'Command+Q' : undefined
    }
  ])
  tray.setToolTip('Filecoin Station')
  tray.setContextMenu(contextMenu)

  setupIpcEventListeners(contextMenu)
}

/**
 * @param {Electron.Menu} contextMenu
 */
function setupIpcEventListeners (contextMenu) {
  ipcMain.on(ipcMainEvents.UPDATE_CHECK_STARTED, () => {
    getItemById('checkForUpdates').visible = false
    getItemById('checkingForUpdates').visible = true
  })

  ipcMain.on(ipcMainEvents.UPDATE_CHECK_FINISHED, () => {
    getItemById('checkForUpdates').visible = true
    getItemById('checkingForUpdates').visible = false
  })

  /**
   * Get an item from the Tray menu or fail with a useful error message.
   * @param {string} id
   * @returns {Electron.MenuItem}
   */
  function getItemById (id) {
    const item = contextMenu.getMenuItemById(id)
    if (!item) throw new Error(`Unknown tray menu item id: ${id}`)
    return item
  }
}
