# @open-age/logger
adds context of call along to the logged message

## installation

```
npm install @open-age/logger --save
```

## usage
```javascript
var logger = require("@open-age/logger")('processor'); // adds [processor] context to the message that gets logged

let process = function() {
    var log = logger.start('process'); // logs [processor:process] started - if logStart is enabled
    log.info('complete'); // logs [processor:process] complete
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
    "http": {}
},
```

### file
```JSON
{
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
{
    "level": "debug",
    "handleExceptions": true,
    "json": false,
    "colorize": true
}
```
### http
```JSON
```


