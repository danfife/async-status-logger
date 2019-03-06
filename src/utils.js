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

function formatMessage({message, payload, time}) {
    let parts = [message]
    if (time) parts.push(`(${formatTime(time)})`)
    if (payload) parts.push(JSON.stringify(payload, null, 2))
    return parts.join(" ")
}

function singleKeyObject(key, value) {
    const obj = {}
    obj[key] = value
    return obj
}

const uids = {_default: 0}
function uid(namespace = null) {
    if (!namespace) return `${++uids._default}`
    uids[namespace] = (uids[namespace] || 0) + 1
    return `${namespace}${uids[namespace]}`
}

exports.formatTime = formatTime
exports.formatMessage = formatMessage
exports.singleKeyObject = singleKeyObject
exports.uid = uid