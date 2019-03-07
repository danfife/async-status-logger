const chalk = require('chalk')

const NOOP = v => v

function formatTime(time) {
    const totalSeconds = Math.floor(time / 1000)
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

function formatMessage(args, time, separator = ' ') {
    let hasAddedTime = false

    const parts = []
    args.forEach((part, i) => {
        const isObject = typeof part === 'object'
        const isLast = i + 1 === args.length

        if (!isObject) parts.push(part)
        if (!hasAddedTime && time && (isLast || isObject)) {
            parts.push(`(${formatTime(time)})`)
            hasAddedTime = true
        }
        if (isObject) parts.push(JSON.stringify(part, null, 2))
    })

    return parts.join(separator)
}

function colorStrToChalkObj(color) {
    if (!color) return NOOP

    const values = color.split(/\s+/)
    let method = chalk
    values.forEach(value => {
        if (method[value]) method = method[value]
    })
    return method === chalk ? NOOP : method
}

exports.formatTime = formatTime
exports.formatMessage = formatMessage
exports.colorStrToChalkObj = colorStrToChalkObj