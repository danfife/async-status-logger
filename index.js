const {createLogger, transports, addColors, format} = require('winston')

const DEFAULT_COLOR = 'bold blue'

function getTimeBetween(start, end) {
    const totalSeconds = Math.round((end - start) / 1000)
    const seconds = totalSeconds % 60
    const minutes = Math.floor(totalSeconds / 60) % 60
    const hours = Math.floor(totalSeconds / 3600) % 24
    const days = Math.floor(totalSeconds / 86400)
    const parts = []
    if (days) parts.push(days === 1 ? '1 day' : `${days} days`)
    if (days || hours) parts.push(hours === 1 ? '1 hour' : `${hours} hours`)
    if (!days && (minutes || hours)) parts.push(minutes === 1 ? '1 minute' : `${minutes} minutes`)
    if (!days && !hours) parts.push(seconds === 1 ? '1 second' : `${seconds} seconds`)
    return parts.join(', ')
}

let uidCounter = 0

function singleKeyObject(key, value) {
    const obj = {}
    obj[key] = value
    return obj
}

class AsyncStatusLogger {
    constructor() {
        const self = this
        this._names = []
        this._args = []
        this._interval = null
        this._lineCount = 0
        this._now = null
        this._level = `_asyncStatusLoggerLevel${++uidCounter}`
        
        this.setStatusColor(DEFAULT_COLOR)

        this._logger = createLogger({
            level: this._level,
            levels: singleKeyObject(this._level, 0),
            transports: [
                new transports.Console({
                    format: format.combine(
                        format.colorize({all: true}),
                        format.printf(data => {
                            const response = self._formatMessage(data)
                            self._lineCount += response.split("\n").length
                            return response
                        })
                    )
                })
            ]
        })
    }

    getStatusColor() { return this._color }
    setStatusColor(color) {
        this._color = color
        addColors(singleKeyObject(this._level, this._color))
    }

    _formatMessage({message, payload, start}) {
        let parts = [message]
        if (start) {
            const time = getTimeBetween(start, this._now)
            parts.push(`(${time})`)
        }
        if (payload) parts.push(JSON.stringify(payload, null, 2))
        return parts.join(" ")
    }

    _clearStatus() {
        while (this._lineCount > 0) {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine()
            this._lineCount -= 1
        }
    }

    _rewriteStatus() {
        this._clearStatus()
        this._names.forEach(name => {
            const args = this._args[name]
            this._logger[this._level](args.message, {payload: args.payload, start: args.start})
        })
    }

    status(name, message, payload) {
        const now = Date.now() 

        if (this._names.includes(name)) {
            if (message) this._args[name].message = message
            if (payload) this._args[name].payload = payload
            return            
        }

        this._names.push(name)
        this._args[name] = { message, payload, start: now }

        if (!this._interval) {
            const self = this

            function updateStatus() {
                self._now = Date.now()
                self._rewriteStatus()
            }

            this._interval = setInterval(updateStatus, 1000)
            updateStatus()
        }
    }

    statusEnd(name, ...args) {
        this._names.splice(this._names.indexOf(name), 1)
        if (!this._names.length) {
            clearInterval(this._interval)
            this._interval = null
        }
        this._rewriteStatus()

        if (args.length && typeof args[args.length - 1] === 'function') {
            const callback = args.pop()
            const message = args.length ? args[0] : this._args[name].message
            const payload = args.length > 1 ? args[1] : this._args[name].payload
            const start = this._args[name].start
            callback(this._formatMessage({ message, start }), payload)
        }
    }

    add(object) {
        this._proxy
        return self
    }
}

function createAsyncStatusLogger(...consumed) {
    function add(...args) {
        consumed.push(...args)
        return proxy
    }

    // TODO check whether this proxy works for edge cases such as es6 setters
    const proxy = new Proxy(new AsyncStatusLogger(), {
        get(target, propKey) {
            return (...args) => {
                // Allow for adding consumed objects
                if (propKey === 'add') return add(...args)

                // Call the status logger properties
                if (target[propKey]) return target[propKey].apply(target, args)

                // Call all other properties by first ensuring the status is cleared
                // and then rewriting it after
                target._clearStatus()
                let response
                for (var i = 0; i < consumed.length; i++) {
                    if (consumed[i][propKey]) {
                        response = consumed[i][propKey].apply(consumed[i], args)
                        break
                    }
                }
                target._rewriteStatus()
                return response
            }
        }
    })

    return proxy
}

module.exports = createAsyncStatusLogger