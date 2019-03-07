## Motivation
`async-status-logger` is designed to allow your logger to work well with dynamic, asynchronous status messages that would output something like:

``` 
Starting up client. Currently in VERIFY state (27 seconds)
```

## Getting Started

### Usage Example

``` js
const asyncStatusLogger = require('async-status-logger')
const logger = ...// your logger of choice

// Creates a proxy that safely combines the async status
// functionality with whatever logger you are using
const log = asyncStatusLogger(logger)

// You can call your logger methods as normal, for example:
log.info('Starting up client')

// You can also log status-type messages
client.init({
  handleStateChange: function(state) {
    if (state !== 'DONE') {
    	log.status('client', `Client state currently in "${state}"`)	
    } else {
    	// This will remove the line from the console
    	log.statusEnd('client')
    }
  }
})

// Continue as normal with regular or other status logs
log.info('Starting up another client')
```

### Creation

#### asyncStatusLogger(``objects``, ``options``)
- ``objects`` An object (such as your custom logger) or an array ofobjects to include as part of your proxied logger
- ``options`` _(Optional)_ The status logger options
  - ``color`` The color to set status messages to. Uses [chalk](https://www.npmjs.com/package/chalk) package under the hood, so check there for valid colors and styles. Set to null or an empty string to disable default coloring.
  - ``separator`` Full multiple arg logs, configure which value to use to separte. Defaults to " " (option only applicable for default formatter)
  - ``formatter({args, time})`` Allows you to override how the message is formatted. Provides an object containing the args and time in milliseconds

Returns a Proxy object that will forward methods to their respective
objects. If conflicting methods, status logger method's take priority,
afterwhich priority is determined based on the order of the objects array.

``` js
asyncStatusLogger(logger)  // single object
asyncStatusLogger([logger1, logger2])  // or array of objects
asyncStatusLogger(logger, {color: null})  // Configured without any coloring
asyncStatusLogger(logger, {formatter: JSON.stringify})  // Logs status as a json string
```

### Status logger methods


#### log.status(``name``, ``...args``])

- ``name`` A unique name for this status method, allowing us to update and eventually end the status message
- ``...args`` The message args of the current status state

Will log or update the status message and append the current running time


#### log.statusEnd(``name``, ``...args``)
- ``name`` Unique name used while calling _log.status_
- ``...args`` _(Optional)_ Allows for generating a final status message which you can then log permanently. If note specified, the previous args will be used for the callback
  - ``callback(message:String)``: A callback function that will be passed the status message

``` js
log.status('some-unique-id', 'Some status message')
// > (0 seconds) Some status message

// ...some time later

log.status('some-unique-id', 'Some updated status message')
// > Some updated status message (1 minute, 13 seconds)

// ...some time later

log.status('another-unique-id', 'Another status message')
// Example output:
// > Some updated status message (2 minutes, 26 seconds)
// > Another status message (0 seconds)

// ...some time later

// Assumes your logger of choice has the method info that takes a message as its argument
log.statusEnd('another-unique-id', log.info)
// Example output:
// > 2019-03-05T02:10:57.845Z - info: Another status message (23 seconds)
// > Some updated status message (2 minutes, 49 seconds)

// ...some time later

log.statusEnd('some-unique-id', 'First status now complete', log.debug)
// Example output:
// > 2019-03-05T02:10:57.845Z - info: Another status message (23 seconds)
// > 2019-03-05T02:10:57.845Z - debug: First status now complete (3 minutes 42 seconds)
```

#### log.custom(``methodName``, ``createPromise(...args)``)
- ``methodName`` The custom method name to add to the proxy.
- ``createPromise(...)`` the method that will be called from the custom method created. Whatever arguments are provided will be forwarded to this method. It is expected that this method returns a promise
 
Allows you to create custom methods that interact with the console asynchronously. You provide the
custom method name and a function that creates a promise, and any pending status messages will be hidden until the promise is completed.

For example, say you want to use the package [prompts](https://github.com/terkelg/prompts) to prompt the user while potentially having a pending status. This could cause conflicts to how either are displayed in the console. You can resolve this like so:
``` js
const createStatusLogger = require('async-status-logger')
const prompts = require('prompts')

const log = createStatusLogger()
log.custom('prompt', prompts)
log.prompt({
    type: 'confirm',
    name: 'value',
    message: 'Do you really want to answer questions asynchronously?'
}).then(answer => {
  log.info(`You said ${answer ? 'yes' : 'no'}`)
})
```

#### log.statusWaitUntil(``createPromiseFn``, ``...args``)
- ``createPromiseFn`` A function that does (or might) write to output. It will be called safely to work with any pending status logs. If a promise is returned, status messages will be suppressed until the promise is resolved
- ``...args`` The args to forward to the ``createPromiseFn``

Another way to solve the problem described in _log.custom_ is as follows:
``` js
// ...setup
log.statusWaitUntil(prompts, {
    type: 'confirm',
    name: 'value',
    message: 'Do you like chocolate?'
}).then(answer => {
    log.info(`The answer is ${answer.value}`)
})
```


## Installation

``` bash
npm install async-status-logger
```

#
Author: [Daniel Fife](https://github.com/danfife)
