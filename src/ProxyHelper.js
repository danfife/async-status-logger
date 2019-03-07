'use strict;'

const PUBLIC_STATUS_METHODS = ['status', 'statusEnd', 'statusWaitUntil', 'getStatusColor', 'setStatusColor'] 
const PUBLIC_PROXY_HELPER_METHODS = ['add', 'custom']

class ProxyHelper {
    constructor(statusLogger, consumed) {
        this._statusLogger = statusLogger
        this._consumed = consumed
        this._customMethods = {}
        this._proxy = new Proxy(this, { get: this._handleGet })
    }

    _callConsumedMethod(name, args) {
        for (var i = 0; i < this._consumed.length; i++) {
            if (this._consumed[i][name]) {
                return this._consumed[i][name].apply(this._consumed[i], args)
            }
        }
    }

    _handleGet(target, prop) {
        return (...args) => {
            if (PUBLIC_PROXY_HELPER_METHODS.includes(prop)) return target[prop].apply(target, args)
            if (PUBLIC_STATUS_METHODS.includes(prop)) return target._statusLogger[prop].apply(target._statusLogger, args)
            if (target._customMethods[prop]) return target._customMethods[prop].apply(null, args)
            return target._statusLogger.statusWaitUntil(() => target._callConsumedMethod(prop, args) )
        }
    }

    add(...objects) {
        this._consumed.push(...objects)
        return this._proxy
    }

    custom(methodName, create) {
        const statusLogger = this._statusLogger
        this._customMethods[methodName] = (...args) => {
            return statusLogger.statusWaitUntil(() => create.apply(null, args))
        }
        return this._proxy
    }

    proxy() {
        return this._proxy
    }
}

module.exports = ProxyHelper