'use strict'

const { app } = require('electron')
const { InfluxDB, Point } = require('@influxdata/influxdb-client')
const { createHash } = require('node:crypto')
const { getDestinationWalletAddress } = require('./checker-config')
const wallet = require('./wallet')
const Sentry = require('@sentry/node')
const { platform, arch } = require('node:os')
const pkg = require('../package.json')

const client = new InfluxDB({
  url: 'https://eu-central-1-1.aws.cloud2.influxdata.com',
  token:
    // station-desktop-1-2-5
    // eslint-disable-next-line max-len
    'ZAy6YGlJksEm1Bs34Z51glKOL5h2MFxQC46hM5l8ElZWENBmazdzLl9_-1kRKNQknrcVa9_K1k7-1luH_bOVPQ=='
})

const writeClient = client.getWriteApi(
  'Filecoin Station', // org
  'station', // bucket
  'ns' // precision
)

const unactionableErrors =
  // eslint-disable-next-line max-len
  /HttpError|getAddrInfo|RequestTimedOutError|ECONNRESET|CERT_NOT_YET_VALID|ERR_TLS_CERT_ALTNAME_INVALID/i

async function setup () {
  const walletAddress = await wallet.getAddress()
  setInterval(() => {
    const point = new Point('ping')
    point.stringField(
      'wallet',
      createHash('sha256').update(walletAddress).digest('hex')
    )
    const destinationWalletAddress = getDestinationWalletAddress()
    if (destinationWalletAddress) {
      point.stringField(
        'destination_wallet',
        createHash('sha256').update(destinationWalletAddress).digest('hex')
      )
    }
    point.stringField('version', pkg.version)
    point.tag('station', 'desktop')
    point.tag('platform', platform())
    // `os.arch()` returns `x64` when running in a translated environment on
    // ARM64 machine, e.g. via macOS Rosetta. We don't provide Apple `arm64`
    // builds yet. As a result, Checkers running on Apple Silicon were reporting
    // `x64` arch. To fix the problem, we detect `arm64` translation and report
    // a different architecture.
    point.tag('arch', app?.runningUnderARM64Translation ? 'arm64' : arch())
    writeClient.writePoint(point)

    writeClient.flush().catch(err => {
      if (unactionableErrors.test(String(err))) {
        return
      }
      if (typeof err?.code === 'string' && unactionableErrors.test(err.code)) {
        return
      }
      Sentry.captureException(err)
    })
  }, 10 * 60 * 1000).unref()
}

module.exports = {
  setup
}
