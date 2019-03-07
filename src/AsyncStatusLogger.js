'use strict;'

const chalk = require('chalk')
const winston= require('winston')
const {formatMessage, singleKeyObject, uid} = require('./utils')

const DEFAULT_COLOR = 'bold blue'
const FORMATTER_KEYS = ['message', 'time', 'payload']
const NOOP = v => v

function colorToChalk(color) {
    if (!color) return NOOP

    const values = color.split(/\s+/)
    let method = chalk
    values.forEach(value => {
        if (method[value]) method = method[value]
    })
    return method === chalk ? NOOP : method
}

function pick(obj, keys) {
    const result = {}
    keys.forEach(key => {
        if (obj.hasOwnProperty(key)) result[key] = obj[key]
    })
    return result
}

function createLogger(level, printMessage) {
    return winston.createLogger({
        level: level,
        levels: singleKeyObject(level, 0),
        transports: [new winston.transports.Console({
            format: winston.format.printf(printMessage)
        })]
    })
}

class AsyncStatusLogger {
    constructor({messageFormatter = formatMessage, color = DEFAULT_COLOR} = {}) {
        const toColor = colorToChalk(color)

        const self = this
        this._names = []
        this._state = []
        this._callbacks = []
        this._interval = null
        this._lineCount = 0
        this._now = null
        this._paused = false
        this._level = uid('_asyncStatusLoggerLevel_')
        this._messageFormatter = messageFormatter
        this._logger = createLogger(this._level, data => {
            const response = self._messageFormatter(pick(data, FORMATTER_KEYS))
            self._lineCount += response.split("\n").length            
            return toColor(response)
        })
    }

    _pause() {
        this._paused = true
        this._clearStatus()
    }

    _resume() {
        this._paused = false
        this._rewriteStatus()
        this._playCallbacks()
    }

    _playCallbacks() {
        if (this._paused) return
        while(this._callbacks.length) {
            const callback = this._callbacks.shift()
            callback.apply(this)
        }
    }

    _clearStatus() {
        while (this._lineCount > 0) {
            process.stdout.moveCursor(0, -1)
            process.stdout.clearLine()
            this._lineCount -= 1
        }
    }

    _rewriteStatus() {
        if (this._paused) return
        this._clearStatus()
        this._names.forEach(name => {
            const args = this._state[name]
            const payload = args.payload
            const time = this._now - args.start
            this._logger[this._level](args.message, {payload, time})
        })
    }

    status(name, message, payload) {
        const self = this
        const now = Date.now()

        if (this._names.includes(name)) {
            if (message) this._state[name].message = message
            if (payload) this._state[name].payload = payload
            return            
        }

        this._names.push(name)
        this._state[name] = { message, payload, start: now }

        if (!this._interval) {
            this._interval = setInterval(updateStatus, 1000)
            updateStatus()
        }

        function updateStatus() {
            self._now = Date.now()
            self._rewriteStatus()
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
            const state = this._state[name]
            const message = args.length ? args[0] : state.message
            const time = this._now - state.start
            
            const finalMessage = this._messageFormatter({ message, time })
            const callbackArgs = [finalMessage]
            const payload = args.length > 1 ? args[1] : state.payload
            if (payload) callbackArgs.push(payload)
            
            this._callbacks.push(() => callback(...callbackArgs))
            this._playCallbacks()        
        }
    }

    statusEndAll() {
        this._names = []
        clearInterval(this._interval)
        this._clearStatus()
    }

    statusWaitUntil(run, ...args) {
        this._pause()
        const response = run.apply(null, args)
        if (response instanceof Promise) {
            const self = this
            return new Promise((resolve, reject) => {
                response.then(value => {
                    resolve(value)
                    self._resume()
                }).catch(error => {
                    reject(error)
                    self._resume()
                })
            })
        }
        this._resume()
        return response
    }
}

module.exports = AsyncStatusLogger