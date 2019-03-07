'use strict;'

const {formatMessage, colorStrToChalkObj} = require('./utils')

class AsyncStatusLogger {
    constructor({formatter = null, separator = ' ', color = 'bold blue'} = {}) {
        this._names = []
        this._state = {}
        this._callbacks = []
        this._interval = null
        this._lineCount = 0
        this._now = null
        this._paused = false
        this._formatter = formatter || (({args, time}) => formatMessage(args, time, separator))
        this._toColor = colorStrToChalkObj(color)
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
        
        const self = this
        this._names.forEach(name => {
            const state = self._state[name]
            const args = state.args
            const time = self._now - state.start
            // eslint-disable-next-line no-debugger
            debugger
            const message = self._toColor(self._formatter({time, args}))
            self._lineCount += message.split("\n").length          
            process.stdout.write(`${message}\n`)
        })
    }

    status(name, ...args) {
        const self = this
        const now = Date.now()

        if (this._names.includes(name)) {
            this._state[name].args = args
            return            
        }

        this._names.push(name)
        this._state[name] = { args, start: now }

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
            const state = this._state[name]
            const time = this._now - state.start
            const callback = args.pop()
            const finalArgs = args.length ? args : state.args
            const finalMessage = this._formatter({time, args: finalArgs})
            this._callbacks.push(() => callback(finalMessage))
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