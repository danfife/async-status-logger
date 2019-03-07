'use strict;'

const AsyncStatusLogger = require('./src/AsyncStatusLogger')
const ProxyHelper = require('./src/ProxyHelper')

module.exports = (objects = [], options = {}) => {
    objects = Array.isArray(objects) ? objects : [objects]
    const statusLogger = new AsyncStatusLogger(options)
    const proxyHelper = new ProxyHelper(statusLogger, objects)
    return proxyHelper.proxy()
}