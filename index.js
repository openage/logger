'use strict'

var winston = require('winston')
var logConfig = require('config').get('logger')

winston.level = logConfig.level || 'info'

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

if (logConfig.custom) {
    var CustomLogger = function (options) {
        const handler = require(`../../../${options.handler}`)
        this.name = 'custom'
        this.level = options.level || 'info'
        this.log = (level, message, meta, callback) => {
            var context = {}
            if (meta && meta.context) {
                context = meta.context
                meta.context = undefined
            }

            handler(level, message, meta, context).then(() => {
                callback(null, true)
            })
        }
    }
    transports.push(new CustomLogger(logConfig.custom))
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

module.exports = function (loggerName) {
    var winstonLogger = new winston.Logger({
        transports: transports,
        exitOnError: false
    })

    var stringifiedCtx = function (context) {
        if (loggerName) {
            return context ? `[${loggerName}:${context.location}]` : `[${loggerName}]`
        }
        if (context) {
            return `[${context.location}]`
        }

        return ''
    }

    var insertCtx = function (params, context) {
        if (!logConfig.custom) {
            if (typeof params[0] === 'string') {
                params[0] = `${stringifiedCtx(context)} ${params[0]}`
            } else if (typeof params[0] === 'object') {
                Array.prototype.unshift.call(params, stringifiedCtx(context))
            }
        } else {
            if (params[1]) {
                if (typeof params[1] === 'string') {
                    params[1] = {
                        message: params[1],
                        context: context
                    }
                } else if (typeof params[1] === 'object') {
                    params[1].context = context
                }
            } else {
                params[1] = {
                    context: context
                }
            }
        }
        return params
    }

    var loggerFactory = function (newContext, parentLogger) {
        let context = {}

        if (parentLogger && parentLogger.context) {
            for (const key of Object.keys(parentLogger.context)) {
                context[key] = parentLogger.context[key]
            }
        }
        if (newContext) {
            if (typeof newContext === 'string') {
                context.location = context.location ? `${context.location}:${newContext}` : newContext
            } else {
                for (const key of Object.keys(newContext)) {
                    if (key === 'location') {
                        context.location = context.location ? `${context.location}:${newContext.location}` : newContext.location
                    } else {
                        context[key] = newContext[key]
                    }
                }
            }
        }

        let instance = {
            context: context,
            parent: parentLogger,
            fatal: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.error(params[0], params[1])
            },
            error: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.error(params[0], params[1])
            },
            warn: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.warn(params[0], params[1])
            },
            info: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.info(params[0], params[1])
            },
            verbose: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.verbose(params[0], params[1])
            },
            debug: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.debug(params[0], params[1])
            },
            silly: function () {
                let params = insertCtx(arguments, context)
                winstonLogger.silly(params[0], params[1])
            },
            end: function () {
                if (this.startTime) {
                    let span = (new Date() - this.startTime) / 1000
                    arguments[0] = arguments[0] || `took: ${span} second(s)`
                    arguments[1] = arguments[1] || {}
                    arguments[1].took = span
                }
                let params = insertCtx(arguments, context)
                winstonLogger.silly(params[0], params[1])

                if (instance.parent && instance.parent.context) {
                    instance.context = instance.parent.context
                }
            }
        }

        return instance
    }

    var start = function (param, parent) {
        var newLogger = loggerFactory(param, parent)
        newLogger.startTime = new Date()
        newLogger.start = function (param) {
            return start(param, newLogger)
        }

        newLogger.silly('started')

        return newLogger
    }

    var logger = loggerFactory()

    logger.start = function (param) {
        return start(param, logger)
    }

    return logger
}
