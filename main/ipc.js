const { ipcMain } = require('electron')

const saturnNode = require('./saturn-node')
const stationConfig = require('./station-config')

const ipcMainEvents = Object.freeze({
  UPDATE_CHECK_STARTED: 'station:update-check:started',
  UPDATE_CHECK_FINISHED: 'station:update-check:finished'
})

function setupIpcMain () {
  ipcMain.handle('saturn:isRunning', saturnNode.isRunning)
  ipcMain.handle('saturn:isReady', saturnNode.isReady)
  ipcMain.handle('saturn:start', saturnNode.start)
  ipcMain.handle('saturn:stop', saturnNode.stop)
  ipcMain.handle('saturn:getLog', saturnNode.getLog)
  ipcMain.handle('saturn:getWebUrl', saturnNode.getWebUrl)
  ipcMain.handle('saturn:getFilAddress', saturnNode.getFilAddress)
  ipcMain.handle('saturn:setFilAddress', (_event, address) => saturnNode.setFilAddress(address))
  // temp
  ipcMain.handle('station:getFilAddress', saturnNode.getFilAddress)
  ipcMain.handle('station:setFilAddress', (_event, address) => saturnNode.setFilAddress(address))
  ipcMain.handle('station:getOnboardingCompleted', stationConfig.getOnboardingCompleted)
  ipcMain.handle('station:setOnboardingCompleted', (_event) => stationConfig.setOnboardingCompleted())
  ipcMain.handle('station:getUserConsent', stationConfig.getUserConsent)
  ipcMain.handle('station:setUserConsent', (_event, consent) => stationConfig.setUserConsent(consent))
}

module.exports = {
  setupIpcMain,
  ipcMainEvents
}
