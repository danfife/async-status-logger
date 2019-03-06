const assert = require('assert')
const {formatTime, formatMessage, singleKeyObject, uid} = require('../src/utils')

describe('utils', () => {
    describe('formatTime', () => {
        it('should format times correctly', () => {
            assert.equal(formatTime(0), '0 seconds')
            assert.equal(formatTime(999), '0 seconds')
            assert.equal(formatTime(1000), '1 second')
            assert.equal(formatTime(1000 * 59), '59 seconds')
            assert.equal(formatTime(1000 * 60), '1 minute, 0 seconds')
            assert.equal(formatTime(1000 * 61), '1 minute, 1 second')
            assert.equal(formatTime(1000 * (60 * 60 - 1)), '59 minutes, 59 seconds')
            assert.equal(formatTime(1000 * (60 * 60)), '1 hour, 0 minutes')
            assert.equal(formatTime(1000 * (60 * 60 * 24 - 60)), '23 hours, 59 minutes')
            assert.equal(formatTime(1000 * (60 * 60 * 24)), '1 day, 0 hours')
            assert.equal(formatTime(1000 * (60 * 60 * 49)), '2 days, 1 hour')
            assert.equal(formatTime(1000 * (60 * 60 * 24 * 365)), '365 days, 0 hours')
        })
    })

    describe('formatMessage', () => {
        it('should format messages correctly', () => {
            const message = 'TEST_MESSAGE'
            const time = 1000 * 59
            const payload = {payload: true}

            assert.equal(formatMessage({message}), 'TEST_MESSAGE')
            assert.equal(formatMessage({message, time}), 'TEST_MESSAGE (59 seconds)')
            assert.equal(formatMessage({message, time, payload}), "TEST_MESSAGE (59 seconds) {\n  \"payload\": true\n}")
        })
    })

    describe('singleKeyObject', () => {
        it('should create an object with the key value pair', () => {
            const obj = singleKeyObject('test key', 'test value')
            assert.deepEqual(Object.keys(obj), ['test key'])
            assert.deepEqual(Object.values(obj), ['test value'])
        })
    })

    describe('uid', () => {
        it('should create a unique id', () => {
            assert.equal(uid(), '1')
            assert.equal(uid(), '2')
            assert.equal(uid('test_a_'), 'test_a_1')
            assert.equal(uid('test_a_'), 'test_a_2')
            assert.equal(uid('test_b_'), 'test_b_1')
            assert.equal(uid(), '3')
            assert.equal(uid('test_a_'), 'test_a_3')
            assert.equal(uid('test_b_'), 'test_b_2')
        })
    })
})