import * as winston from "winston";
import * as config from "config";


let logConfig: {
    logStart?: boolean
    file?: winston.FileTransportOptions,
    console?: winston.ConsoleTransportOptions,
    http?: winston.HttpTransportOptions
} = config.get('logger');

let transports: winston.TransportInstance[] = [];

// var defaultLogger = new winston.Logger({
//     transports: transports,
//     exitOnError: false
// });

// defaultLogger.stream = {
//     write: function (message, encoding) {
//         defaultLogger.info(message);
//     }
// };

export interface CLogger extends winston.LoggerInstance {
    start: (param: string) => CLogger
}

module.exports = function (ctx?: string): CLogger {

    let stringifiedCtx = (param) => {
        if (ctx) {
            return '[' + ctx + (param ? ':' + param : '') + '] ';
        } else if (param) {
            return '[' + param + '] ';
        } else {
            return '';
        }
    };

    let insertCtx = (params, additional) => {
        if (typeof params[0] === 'string') {
            params[0] = stringifiedCtx(additional) + params[0];
        } else if (typeof params[0] === 'object') {
            Array.prototype.unshift.call(params, stringifiedCtx(additional));
        }

        return params;
    };

    let logger = new winston.Logger({
        transports: transports,
        exitOnError: false
    });

    class CLoggerInstance extends winston.Logger implements CLogger {
        constructor(param?: string) {
            super();

            this.error = () => {
                logger.error.apply(this, insertCtx(arguments, param));
                return this;
            };
            this.warn = () => {
                logger.warn.apply(this, insertCtx(arguments, param));
                return this;
            };

            this.info = () => {
                logger.info.apply(this, insertCtx(arguments, param));
                return this;
            };

            this.verbose = () => {
                logger.verbose.apply(this, insertCtx(arguments, param));
                return this;
            };

            this.debug = () => {
                logger.debug.apply(this, insertCtx(arguments, param));
                return this;
            };

            this.silly = () => {
                logger.silly.apply(this, insertCtx(arguments, param));
                return this;
            };
        }

        start = (param: string) => {
            var wrapper = new CLoggerInstance(param);
            if (logConfig.logStart) {
                    wrapper.debug('started');
            }
            return wrapper;
        }
    };

    return new CLoggerInstance();
};