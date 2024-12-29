/**
 * Created by top on 15-9-6.
 */

export class Config {
    debug = true;

    showMsg(msg, code) {
        alert(msg + ' code: ' + code);
    }

    /**
     * Vim key codes whitelist
     * @type {Array}
     */
    key_code_white_list = [
        9, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123
    ];

    constructor(options) {
        Object.assign(this, options);
    }
}
