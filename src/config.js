export class Config {
    debug = true;

    /**
     *
     * @param {Object} options
     */
    constructor(options) {
        Object.assign(this, options);
    }
}
