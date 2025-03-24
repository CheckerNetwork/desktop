import EventEmitter from 'node:events'

export class ActivityEvent {
  /**
   * @param {Object} options
   * @param {("info"|"error")} options.type
   * @param {String} options.source
   * @param {String} options.message
   */
  constructor ({ type, source, message }) {
    this.type = type
    this.source = source
    this.message = message
  }
}

export const formatActivityObject = ({ type, message }) => {
  return `${type.toUpperCase().padEnd(5)} ${message}`
    .trimEnd()
    .split(/\n/g)
    .map(line => `[${(new Date()).toLocaleString()}] ${line}`)
    .join('\n') + '\n'
}

class Activities {
  #events = new EventEmitter()

  /**
   * @param {ActivityEvent} activity
   */
  submit (activity) {
    this.#events.emit('activity', activity)
  }

  /**
   * @param {(activity: ActivityEvent) => void} fn
   */
  onActivity (fn) {
    this.#events.on('activity', fn)
  }
}

export const activities = new Activities()
