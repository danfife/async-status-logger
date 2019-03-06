'use strict;'

const AsyncStatusLogger = require('./src/AsyncStatusLogger')
const ProxyHelper = require('./src/ProxyHelper')

module.exports = (...objects) => new ProxyHelper(new AsyncStatusLogger(), objects).proxy()