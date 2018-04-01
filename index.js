'use strict'

var winston = require('winston')
var logConfig = require('config').get('logger')

var transports = []

if (logConfig.file) {
    transports.push(new winston.transports.File(logConfig.file))
}

if (logConfig.console) {
    transports.push(new winston.transports.Console(logConfig.console))
}

if (logConfig.http) {
    transports.push(new winston.transports.Http(logConfig.http))
}

var defaultLogger = new winston.Logger({
    transports: transports,
    exitOnError: false
})

defaultLogger.stream = {
    write: function (message, encoding) {
        defaultLogger.info(message)
    }
}

module.exports = function (ctx) {
    var winstonLogger = new winston.Logger({
        transports: transports,
        exitOnError: false
    })

    var stringifiedCtx = function (param) {
        if (ctx) {
            return '[' + ctx + (param ? ':' + param : '') + '] '
        } else if (param) {
            return '[' + param + '] '
        } else {
            return ''
        }
    }

    var insertCtx = function (params, additional) {
        if (typeof params[ 0 ] === 'string') {
            params[ 0 ] = stringifiedCtx(additional) + params[ 0 ]
        } else if (typeof params[ 0 ] === 'object') {
            Array.prototype.unshift.call(params, stringifiedCtx(additional))
        }

        return params
    }

    var loggerFactory = function (newCtx, parent) {
        let subContext = (parent && parent.subContext) ? `${parent.subContext}:${newCtx}` : newCtx

        return {
            subContext: subContext,
            parent: parent,
            fatal: function () {
                // TODO: send alert
                winstonLogger.error.apply(this, insertCtx(arguments, subContext))
            },
            error: function () {
                winstonLogger.error.apply(this, insertCtx(arguments, subContext))
            },
            warn: function () {
                winstonLogger.warn.apply(this, insertCtx(arguments, subContext))
            },
            info: function () {
                winstonLogger.info.apply(this, insertCtx(arguments, subContext))
            },
            verbose: function () {
                winstonLogger.verbose.apply(this, insertCtx(arguments, subContext))
            },
            debug: function () {
                winstonLogger.debug.apply(this, insertCtx(arguments, subContext))
            },
            silly: function () {
                winstonLogger.silly.apply(this, insertCtx(arguments, subContext))
            },
            end: function () {
                if (this.startTime) {
                    let span = (new Date() - this.startTime) / 1000

                    winstonLogger.info.apply(this, insertCtx([ `took: ${span} second(s)` ], subContext))
                }
            }
        }
    }

    var start = function (param, parent) {
        var newLogger = loggerFactory(param, parent)
        newLogger.startTime = new Date()
        newLogger.start = function (param) {
            return start(param, newLogger)
        }

        newLogger.debug('started')

        return newLogger
    }

    var logger = loggerFactory()

    logger.start = function (param) {
        return start(param, logger)
    }

    return logger
}
