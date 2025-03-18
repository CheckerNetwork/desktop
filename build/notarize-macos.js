'use strict'

const { notarize } = require('@electron/notarize')

const isSet = (/** @type {string | undefined} */ value) =>
  value && value !== 'false'

/**
 * electron-build hook responsible for Apple Notarization of signed DMG
 *
 * @param {import('electron-builder').AfterPackContext} context
 */
exports.default = async function notarizing (context) {
  const { electronPlatformName, appOutDir } = context
  if (electronPlatformName !== 'darwin') return
  // skip notarization if secrets are not present in env
  if (
    !process.env.APPLEID || !process.env.APPLEIDPASS || !process.env.APPLETEAMID
  ) {
    return
  }
  // skip notarization when signing is disabled in PRs
  // https://github.com/electron-userland/electron-builder/blob/ece7f889f93921894cbbcb02b924dc90d793be7c/packages/builder-util/src/util.ts#L322-L336
  if (
    isSet(process.env.TRAVIS_PULL_REQUEST) ||
    isSet(process.env.CIRCLE_PULL_REQUEST) ||
    isSet(process.env.BITRISE_PULL_REQUEST) ||
    isSet(process.env.APPVEYOR_PULL_REQUEST_NUMBER) ||
    isSet(process.env.GITHUB_BASE_REF)
  ) return

  const appName = context.packager.appInfo.productFilename

  return notarize({
    appPath: `${appOutDir}/${appName}.app`,
    appleId: process.env.APPLEID,
    appleIdPassword: process.env.APPLEIDPASS,
    teamId: process.env.APPLETEAMID
  })
}
