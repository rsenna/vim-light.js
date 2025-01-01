import {Config} from './config';
import {getCurrentTime} from './globals';

// TODO: "too OOP", could be way simpler
// TODO: should not generate any code in production mode

/**
 * Basic interface and dummy logger
 */
export class Logger {
    /**
     *
     * @param {Object} message
     * @param {boolean} force
     */
    log(message, force = false) {}
}

/**
 * Console logger
 */
export class ConsoleLogger extends Logger {
    /** @type {boolean} */
    #debug = false;

    /** @param {Config} config */
    constructor(config) {
        super();
        this.#debug = config.debug;
    }

    /**
     *
     * @param {Object} message
     * @param {boolean} force
     */
    log(message, force = false) {
        if (force || this.#debug) {
            console.log(`[${getCurrentTime()}] [$(arguments.callee.name)] ${message}`);
        }
    }
}
