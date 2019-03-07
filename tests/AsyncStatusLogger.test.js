const assert = require('assert')
const stdMocks = require('std-mocks')
const sinon  = require('sinon')
const AsyncStatusLogger = require('../src/AsyncStatusLogger')

const MOVE_BACK = '\u001b[1A'
const CLEAR_LINE = '\u001b[2K'

function flush() {
    const output = stdMocks.flush().stdout

    // Check for move back and clear line commands and then remove the line along
    // with the lines for those commands
    for (var i = output.length - 3; i >= 0; i--) {
        if (output[i + 1] === MOVE_BACK && output[i + 2] === CLEAR_LINE && output[i] !== CLEAR_LINE && output[i] !== MOVE_BACK) {
            output.splice(i, 3)
        }
    }

    return output
}

describe('AsyncStatusLogger', () => {
    before(function() {
        const self = this
        this.clock = sinon.useFakeTimers()
        this.grapStdOut = callback => {
            stdMocks.use()
            callback.apply(self)
            stdMocks.restore()
            return flush()
        }
    })
    
    after(function() {
        this.clock.restore()
    })

    describe('options', function() {
        describe('color', function() {
            it('displays as a custom color', function() {
                const logger = new AsyncStatusLogger({color: 'red'})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["\u001b[31mTest Status\u001b[39m\n"])
            })
    
            it('displays as a custom color with style', function() {
                const logger = new AsyncStatusLogger({color: 'bold red'})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["\u001b[1m\u001b[31mTest Status\u001b[39m\u001b[22m\n"])
            })
    
            it('ignores unrecognized colors', function() {
                const logger = new AsyncStatusLogger({color: 'reddish'})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status\n"])
            })
    
            it('ignores unrecognized parts while still including what is known', function() {
                const logger = new AsyncStatusLogger({color: 'boldish red italicness'})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["\u001b[31mTest Status\u001b[39m\n"])
            })
        })

        describe('messageFormatter', function() {
            it('uses custom message formatter for status', function() {
                const logger = new AsyncStatusLogger({color: null, formatter: JSON.stringify})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ['{"time":0,"args":["Test Status"]}' + "\n"])
            })
            
            it('uses custom message formatter for end callback', function() {
                const logger = new AsyncStatusLogger({color: null, formatter: JSON.stringify})
                
                let statusEndArgs
                
                this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")   
                    logger.statusEnd('status-1', (...args) => {
                        statusEndArgs = args
                    })     
                })
                logger.statusEndAll()
    
                assert.deepEqual(statusEndArgs, ['{"time":0,"args":["Test Status"]}'])
            })
        })

        describe('separator', function() {
            it('should use custom separator for multiple arguments', function() {
                const logger = new AsyncStatusLogger({color: null, separator: '::'})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Arg1", "Arg2", "Arg3")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Arg1::Arg2::Arg3\n"])
            })
        })
    })

    describe('status', function() {
        describe('single status', function() {
            it('should add status', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status\n"])
            })

            it('should add status with multiple arguments', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Arg1", "Arg2", "Arg3")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Arg1 Arg2 Arg3\n"])
            })

            it('should add status with some arguments as objects', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Arg1", {arg2: true}, "Arg3")        
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Arg1 {\n  \"arg2\": true\n} Arg3\n"])
            })
    
            it('should update time on status', function() {
                const logger = new AsyncStatusLogger({color: null})
    
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 65)       
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status (1 minute, 5 seconds)\n"])
            })
            
    
            it('should update status', function() {
                const logger = new AsyncStatusLogger({color: null})
    
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Status 1: FIRST")
                    logger.status('status-1', "Status 1: SECOND")
                    this.clock.tick(1000)       
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Status 1: SECOND (1 second)\n"])
            })
    
            it('should remove status on end', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Status 1: FIRST")
                    logger.statusEnd('status-1')            
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, [])
            })  
        })        
    
        describe('multiple statuses', function() {
            it('should add statuses', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 42)       
                    logger.status('status-2', "Test Status 2")  
                    this.clock.tick(1000)         
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status (43 seconds)\n", "Test Status 2 (1 second)\n"])
            })
    
            it('should update first status', function() {
                const logger = new AsyncStatusLogger({color: null})
    
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 5)                
                    logger.status('status-2', "Test Status 2")
                    this.clock.tick(1000 * 5)
                    logger.status('status-1', "Test Status Updated")
                    this.clock.tick(1000)
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status Updated (11 seconds)\n", "Test Status 2 (6 seconds)\n"])
            })
    
            it('should update second status', function() {
                const logger = new AsyncStatusLogger({color: null})
    
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 5)                
                    logger.status('status-2', "Test Status 2")
                    this.clock.tick(1000 * 5)
                    logger.status('status-2', "Test Status 2 Updated")
                    this.clock.tick(1000)
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status (11 seconds)\n", "Test Status 2 Updated (6 seconds)\n"])
            })
    
            it('should remove first status', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 5)                
                    logger.status('status-2', "Test Status 2")
                    this.clock.tick(1000 * 5)
                    logger.statusEnd('status-1')
                    this.clock.tick(1000)                
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status 2 (6 seconds)\n"])
            })
    
            it('should remove second status', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 5)                
                    logger.status('status-2', "Test Status 2")
                    this.clock.tick(1000 * 5)
                    logger.statusEnd('status-2')
                    this.clock.tick(1000)                
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, ["Test Status (11 seconds)\n"])
            })
    
            it('should remove both statuses', function() {
                const logger = new AsyncStatusLogger({color: null})
                
                const output = this.grapStdOut(() => {
                    logger.status('status-1', "Test Status")
                    this.clock.tick(1000 * 5)                
                    logger.status('status-2', "Test Status 2")
                    this.clock.tick(1000 * 5)
                    logger.statusEnd('status-2')
                    logger.statusEnd('status-1')
                    this.clock.tick(1000)                
                })
                logger.statusEndAll()
    
                assert.deepEqual(output, [])
            })
        })
    })

    describe('statusEnd', function() {
        it('should call callback with previous arguments', function() {
            const logger = new AsyncStatusLogger({color: null})

            let statusEndArgs

            this.grapStdOut(() => {
                logger.status('status-1', "Test Status")
                this.clock.tick(1000 * 5)
                logger.status('status-1', "Test Status", "Update")
                this.clock.tick(1000 * 5)
                logger.statusEnd('status-1', (...args) => statusEndArgs = args )              
            })
            logger.statusEndAll()

            assert.deepEqual(statusEndArgs, ['Test Status Update (10 seconds)'])
        })
        
        it('should call callback with provided message', function() {
            const logger = new AsyncStatusLogger({color: null})

            let statusEndArgs

            this.grapStdOut(() => {
                logger.status('status-1', "Test Status")
                this.clock.tick(1000 * 5)
                logger.status('status-1', "Test Status", "Update")
                this.clock.tick(1000 * 5)
                logger.statusEnd('status-1', 'Test Status', "Done", (...args) => statusEndArgs = args )              
            })
            logger.statusEndAll()

            assert.deepEqual(statusEndArgs, ['Test Status Done (10 seconds)'])
        })
    })

    describe('statusWaitUntil', function() {
        it('should update status after method', function() {
            const logger = new AsyncStatusLogger({color: null})
            
            const output = this.grapStdOut(() => {
                logger.status('status-1', "Test Status")
                logger.statusWaitUntil(() => {
                    process.stdout.write("External Log\n")
                })
            })
            logger.statusEndAll()

            assert.deepEqual(output, ["External Log\n", "Test Status\n"])
        })
        
        it('should wait to call end until after method is finished', function() {
            const logger = new AsyncStatusLogger({color: null})
            
            const output = this.grapStdOut(() => {
                logger.status('status-1', "Test Status")
                logger.statusWaitUntil(() => {
                    logger.statusEnd('status-1', () => {
                        process.stdout.write("Test Status Ended\n")
                    })
                    process.stdout.write("External Log\n")
                })
            })
            logger.statusEndAll()

            assert.deepEqual(output, ["External Log\n", "Test Status Ended\n"])
        })
    })
})