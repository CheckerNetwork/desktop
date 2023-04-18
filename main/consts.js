'use strict'

const { app } = require('electron')
const os = require('os')
const packageJson = require('../package.json')
const path = require('path')
const assert = require('assert')

const { getBuildVersion } = require('./build-version')

module.exports = Object.freeze({
  CACHE_ROOT: getCacheRoot(),
  STATE_ROOT: getStateRoot(),
  IS_MAC: os.platform() === 'darwin',
  IS_WIN: os.platform() === 'win32',
  IS_APPIMAGE: typeof process.env.APPIMAGE !== 'undefined',
  STATION_VERSION: packageJson.version,
  BUILD_VERSION: getBuildVersion(packageJson),

  ELECTRON_VERSION: process.versions.electron
})

// Replace with `app.get('localUserData')` after this PR is landed & released:
// https://github.com/electron/electron/pull/34337
function getCacheRoot () {
  if (process.env.STATION_ROOT) {
    return path.join(process.env.STATION_ROOT, 'cache')
  }

  const platform = os.platform()
  switch (platform) {
    case 'darwin':
      return path.join(
        app.getPath('home'),
        'Library',
        'Caches',
        'app.filstation.desktop'
      )
    case 'win32':
      assert(
        process.env.TEMP,
        'Unsupported Windows environment: TEMP must be set.'
      )
      return path.join(process.env.TEMP, 'Filecoin Station Desktop')
    case 'linux':
      return path.join(
        process.env.XDG_CACHE_HOME || path.join(app.getPath('home'), '.cache'),
        'filecoin-station-desktop'
      )
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}

function getStateRoot () {
  if (process.env.STATION_ROOT) {
    return path.join(process.env.STATION_ROOT, 'state')
  }

  const platform = os.platform()
  switch (platform) {
    case 'darwin':
      return path.join(
        app.getPath('home'),
        'Library',
        'Application Support',
        'app.filstation.desktop'
      )
    case 'win32':
      assert(
        process.env.LOCALAPPDATA,
        'Unsupported Windows environment: LOCALAPPDATA must be set.'
      )
      return path.join(process.env.LOCALAPPDATA, 'Filecoin Station Desktop')
    case 'linux':
      return path.join(
        process.env.XDG_STATE_HOME ||
          path.join(app.getPath('home'), '.local', 'state'),
        'filecoin-station-desktop'
      )
    default:
      throw new Error(`Unsupported platform: ${platform}`)
  }
}
