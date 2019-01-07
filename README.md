# @open-age/logger

adds context of call along to the logged message

## installation

```shell
npm install @open-age/logger --save
```

## usage

```javascript
var logger = require("@open-age/logger")('processor');
// adds [processor] context to the message that gets logged

let process = function() {
    var logWithLocation = logger.start('process'); 
    // output [processor:process] started - if logStart is enabled
    log.info('complete');
    // output [processor:process] complete

    // OR

    let context = {
        location: 'process',
        user: {
            code: 'admin'
        }
    }
    var loggerWithContext = logger.start(context)
    // output - if logStart is enabled
    // [processor:process] started
    //
    // output - if custom logger is defined, it adds the full context to meta
    // started
    // {
    //     context: {
    //         location: 'processor:process',
    //         user: {
    //             code: 'admin'
    //         }
    //     }
    // }
    log.info('complete', {
        status: 'done'
    });
    // output - if custom logger is defined, it adds the full context to meta
    // started
    // {
    //     status: 'done',
    //     context: {
    //         location: 'processor:process',
    //         user: {
    //             code: 'admin'
    //         }
    //     }
    // }
}
```

## config

uses `config` package

gets logger section from the config file

```JSON
"logger": {
    "logStart": false, // logs starts of the
    "file": {},
    "console": {},
    "http": {},
    "custom: {}
},
```

### file

```JSON
"file": {
    "filename": "logs/logs.json",
    "level": "silly",
    "handleExceptions": true,
    "json": true,
    "maxsize": 512000, //0.5
    "maxFiles": 5,
    "colorize": false
}
```

### console
```JSON
"console": {
    "level": "debug",
    "handleExceptions": true,
    "json": false,
    "colorize": true
}
```
### http
```JSON
```
### custom
```JSON
"custom": {
    "level": "silly",
    "handler": "helpers/db-logger"
}
```

handler file 

```JavaScript

module.exports = (level, message, meta, callback) => {
    console.log(`${level}: ${message}`, meta)
    callback(null, true)
}
```

