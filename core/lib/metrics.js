import { writeClient } from './telemetry.js'
import { Point } from '@influxdata/influxdb-client'
import EventEmitter from 'node:events'
import * as Sentry from '@sentry/node'

export class MetricsEvent {
  /**
   * @param {Object} options
   * @param {Number} options.totalJobsCompleted
   * @param {bigint} options.rewardsScheduledForAddress
   */
  constructor ({ totalJobsCompleted, rewardsScheduledForAddress }) {
    this.totalJobsCompleted = totalJobsCompleted
    this.rewardsScheduledForAddress = rewardsScheduledForAddress
  }
}

export class Metrics {
  #events = new EventEmitter()

  constructor () {
    this.mergedMetrics = null
    /** @type {Map<string, MetricsEvent>} */
    this.moduleMetrics = new Map()
    this.lastErrorReportedAt = 0
  }

  /**
   * - Filters duplicate entries
   * - Writes `jobs-completed` to InfluxDB
   * - Merges metrics from all modules
   * @param {String} moduleName
   * @param {Partial<MetricsEvent>} metrics
   */
  submit (moduleName, metrics) {
    /** @type {MetricsEvent} */
    const resolvedMetrics = {
      // initial values
      totalJobsCompleted: 0,
      rewardsScheduledForAddress: 0n,
      // or values submitted previously
      ...this.moduleMetrics.get(moduleName),
      // or values submitted now
      ...metrics
    }

    if (
      typeof metrics.totalJobsCompleted === 'number' &&
      typeof this.moduleMetrics.get(moduleName)?.totalJobsCompleted === 'number'
    ) {
      const diff = metrics.totalJobsCompleted -
        this.moduleMetrics.get(moduleName).totalJobsCompleted
      if (diff < 0) {
        this.maybeReportErrorToSentry(
          new Error(`Negative jobs completed for ${moduleName}`)
        )
      } else if (diff > 0) {
        writeClient.writePoint(
          new Point('jobs-completed')
            .tag('module', moduleName)
            // TODO: remove this after July 2024
            .stringField('module', moduleName)
            .intField('value', diff)
        )
      }
    }
    this.moduleMetrics.set(moduleName, resolvedMetrics)
    const mergedMetrics = {
      totalJobsCompleted: 0,
      rewardsScheduledForAddress: 0n
    }
    for (const [, metrics] of this.moduleMetrics) {
      mergedMetrics.totalJobsCompleted += metrics.totalJobsCompleted
      // Merging rewards metrics should be revisited as more modules start
      // paying rewards
      mergedMetrics.rewardsScheduledForAddress +=
        metrics.rewardsScheduledForAddress
    }
    const isChanged = this.mergedMetrics === null ||
      Object
        .entries(this.mergedMetrics)
        .some(([key, value]) => mergedMetrics[key] !== value)
    if (isChanged) {
      this.mergedMetrics = mergedMetrics
      this.#events.emit('update', mergedMetrics)
    }
  }

  /**
   * @param {(metrics: MetricsEvent) => void} fn
   */
  onUpdate (fn) {
    this.#events.on('update', fn)
  }

  /**
   * @param {unknown} err
   */
  maybeReportErrorToSentry (err) {
    const now = Date.now()
    if (now - this.lastErrorReportedAt < 4 /* HOURS */ * 3600_000) return
    this.lastErrorReportedAt = now

    console.error('Reporting the problem to Sentry for inspection by the Station team.')
    Sentry.captureException(err)
  }
}

export const metrics = new Metrics()
