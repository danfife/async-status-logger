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

#### asyncStatusLogger(``...objects``)
Returns a Proxy object that will forward methods to their respective
objects. If conflicting methods, status logger method's take priority,
and then priority is determined based on the objects order.
``` js
asyncStatusLogger(logger1, logger2)
```

### Status logger methods


#### log.status(``name``, ``message`` [, ``payload``])

- ``name`` A unique name for this status method, allowing us to update and eventually end the status message
- ``message`` The message of the current status state
- ``payload`` _(Optional)_ A payload object to display as well. If the payload doesn't change (e.g. displaying the original request params) you only have to log it the first time and it will persist through status messages

Will log or update the status message and append the current running time


#### log.statusEnd(``name``, ``...args``)
- ``name`` Unique name used while calling _log.status_
- ``...args`` _(Optional)_ Allows for generating a final status message which you can then log permanently
  - _(Optional)_ ``message``[, ``payload``]. If message is not set, will use the last _log.status_ message. If payload isn't set, it will use the lastest payload as described in _log.status_
  - ``callback(message, payload)``: A callback function that will be passed the message and payload. The message will include the total time since the first status message of the specified 'name' was called.

``` js
log.status('some-unique-id', 'Some status message')
// > Some status message (0 seconds)

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

#### log.setStatusColor(color)
Set color for status messages. Uses winston colorize under the hood which uses the [colors](https://www.npmjs.com/package/colors) package. Check there to see which colors and styles are supported.

``` js
log.setStatusColor('italic red')
```

#### log.getStatusColor(color)
Simple getter of current status color

## Installation

``` bash
npm install async-status-logger
```

#
Author: [Daniel Fife](https://github.com/danfife)
