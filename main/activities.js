'use strict'

/** @typedef {import('./typings').Activity} Activity */
/** @typedef {import('./typings').Context} Context */

class Activities {
  /** @type {Activity[]} */
  #activities = []
  #online = {
    spark: true,
    voyager: false
  }

  /**
   * Display last 100 activities
   * @param {Context} ctx
   * @param {Activity} activity
   */
  push (ctx, activity) {
    this.#activities.push(activity)
    this.#activities.splice(0, this.#activities.length - 100)
    this.#detectChangeInOnlineStatus(activity)
    ctx.recordActivity(activity)
  }

  /**
   * @param {Activity} activity
   */
  #detectChangeInOnlineStatus (activity) {
    const firstWord = activity.message.split(' ')[0].toLowerCase()
    if (activity.type === 'info') {
      if (firstWord === 'spark') {
        this.#online.spark = true
      } else if (firstWord === 'voyager') {
        this.#online.voyager = true
      }
    } else if (activity.type === 'error') {
      if (firstWord === 'spark') {
        this.#online.spark = false
      } else if (firstWord === 'voyager') {
        this.#online.voyager = false
      }
    }
  }

  get () {
    return [...this.#activities]
  }

  isOnline () {
    return this.#online.spark || this.#online.voyager
  }
}

module.exports = {
  Activities
}
