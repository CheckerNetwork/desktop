import { InfluxDB, Point } from '@influxdata/influxdb-client'
import { createHash, randomUUID } from 'node:crypto'
import * as Sentry from '@sentry/node'
import assert from 'node:assert'
import { platform, arch, cpus, totalmem } from 'node:os'
import fs from 'node:fs/promises'
import * as paths from './paths.js'
import timers from 'node:timers/promises'

const { FIL_WALLET_ADDRESS, DEPLOYMENT_TYPE = 'cli' } = process.env

const validDeploymentTypes = ['cli', 'docker', 'station-desktop']
assert(
  validDeploymentTypes.includes(DEPLOYMENT_TYPE),
  `Invalid DEPLOYMENT_TYPE: ${DEPLOYMENT_TYPE}. Options: ${validDeploymentTypes.join(', ')}`
)

const pkg = JSON.parse(await fs.readFile(paths.packageJSON, 'utf8'))
const processUUID = randomUUID()

const client = new InfluxDB({
  url: 'https://eu-central-1-1.aws.cloud2.influxdata.com',
  token:
    // station-core-21-0-2
    'MveJoNJL5I_333ehxXCjaPvUBGN46SprEzC4GzSCIXQHmwdvTN3y6utV-UxmxugL6hSY7eejvgFY161FsrDycQ=='
})

export const writeClient = client.getWriteApi(
  'Filecoin Station', // org
  'station', // bucket
  'ns' // precision
)

const writeClientMachines = client.getWriteApi(
  'Filecoin Station', // org
  'station-machines', // bucket
  's' // precision
)

const unactionableErrors =
  /HttpError|getAddrInfo|RequestTimedOutError|ECONNRESET|EPIPE|ENETDOWN|ENOBUFS|EHOSTUNREACH|ERR_TLS_CERT_ALTNAME_INVALID|ETIMEDOUT|EPROTO|ENETUNREACH/i

const handleFlushError = err => {
  if (unactionableErrors.test(String(err))) {
    return
  }
  if (typeof err?.code === 'string' && unactionableErrors.test(err.code)) {
    return
  }
  Sentry.captureException(err)
}

export const runPingLoop = async ({ STATION_ID }) => {
  assert(FIL_WALLET_ADDRESS)

  while (true) {
    const point = new Point('ping')
    point.stringField(
      'wallet',
      createHash('sha256').update(FIL_WALLET_ADDRESS).digest('hex')
    )
    point.stringField('station_id', STATION_ID)
    point.stringField('process_uuid', processUUID)
    point.stringField('version', pkg.version)
    point.tag('station', 'core')
    point.tag('platform', platform())
    point.tag('arch', arch())
    point.tag('deployment_type', DEPLOYMENT_TYPE)
    writeClient.writePoint(point)
    writeClient.flush().catch(handleFlushError)
    await timers.setTimeout(10 * 60 * 1000) // 10 minutes
  }
}

export const runMachinesLoop = async ({ STATION_ID }) => {
  while (true) {
    const point = new Point('machine')
    point.stringField('station_id', STATION_ID)
    point.stringField('process_uuid', processUUID)
    point.intField('cpu_count', cpus().length)
    if (cpus().length > 0) {
      const cpu = cpus()[0]
      point.intField('cpu_speed_mhz', cpu.speed)
      const model = cpu.model.toLowerCase()
      const brand = model.includes('intel')
        ? 'intel'
        : model.includes('amd')
          ? 'amd'
          : model.includes('apple')
            ? 'apple'
            : 'unknown'
      point.tag('cpu_brand', brand)
      if (brand === 'unknown') {
        point.stringField('cpu_model_unknown_brand', model)
      }
    }
    point.tag('platform', platform())
    point.tag('arch', arch())
    point.intField('memory_total_b', totalmem())
    writeClientMachines.writePoint(point)
    writeClientMachines.flush().catch(handleFlushError)
    await timers.setTimeout(24 * 3600 * 1000) // 1 day
  }
}

export const reportW3NameError = () => {
  const point = new Point('w3name-error')
  point.stringField('version', pkg.version)
  writeClient.writePoint(point)
  writeClient.flush().catch(handleFlushError)
}
