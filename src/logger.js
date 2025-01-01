delete globalThis["use strict"];

// eslint-disable-next-line no-unused-vars
import {Config} from './config';

// TODO: "too OOP", could be way simpler
// TODO: should not generate any code in production mode
// TODO: create CLI logger using some sort of middleware

/**
 * Basic interface and dummy logger
 */
export class Logger {
    /**
     *
     * @param {Function} callee
     * @param {Object} payload
     * @param {boolean} force
     */
    // eslint-disable-next-line no-unused-vars
    log(callee, payload, force = false) {}
}

/**
 * Browser logger
 */
export class BrowserLogger extends Logger {
    /** @type {boolean} */
    #debug = false;

    /** @param {Config} config */
    constructor(config) {
        super();
        this.#debug = config.debug;
    }

    /**
     *
     * @param {Function} callee
     * @param {Object} payload
     * @param {boolean} force
     */
    log(callee, payload, force = false) {
        const timestamp = new Date().toISOString();
        const calleeName = callee.name;
        const message = typeof payload === 'string'
            ? payload
            : JSON.stringify(payload);

        if (force || this.#debug) {
            console.log(`[${calleeName}] [${timestamp}] ${message}`);
        }
    }
}
