/**
 * Created by top on 15-9-6.
 */

import {Controller} from '../controller';
import {code} from '../../filter';

class RouterItem {
    /**
     * @type string
     */
    #name;

    /**
     * @type string
     */
    #mode = '';

    /**
     * @type boolean
     */
    #record = false;

    /**
     * @type {Function<Controller>}
     */
    #action = undefined;


    get name() { return this.#name; }
    set name(value) { this.#name = value; }

    get mode() { return this.#mode; }
    set mode(value) { this.#mode = value; }

    get record() { return this.#record; }
    set record(value) { this.#record = value; }

    get action() { return this.#action; }
    set action(value) { this.#action = value; }
}

export class Router {
    /**
     * @type {Controller}
     */
    #controller;

    /**
     * @type {number|undefined}
     */
    #currentCodeNumber = undefined;

    /**
     * @type {Object<number, RouterItem>}
     */
    #keymap = {};

    /**
     * Retrieves the current keymapping, associating key-codes and behaviour
     *
     * @returns {Object<string, RouterItem>}
     */
    get keymap() { return this.#keymap; }

    /**
     *
     * @param {Controller} controller
     */
    constructor(controller) {
        this.#controller = controller;
    }

    /**
     * @param {number|string} codeNumber
     * @param {string} codeName
     * @return {Router} The instance of the class for chaining method calls.
     * @todo
     * Currently, `codeNumber` can be either a string or a number.
     * A string is used for a "chord" of keys (e.g. 'gg'), and that's
     * implemented in a weird manner.
     * The most direct fix would be changing this argument to a `Array<number>`
     * instead, but I'm not sure about the impact yet.
     */
    code(codeNumber, codeName) {
        if (!this.#keymap[codeNumber]) {
            this.#keymap[codeNumber] = new RouterItem();
        }

        const item = this.#keymap[codeNumber];

        item.name = codeName;
        item.mode = '';
        item.record = false;

        this.#currentCodeNumber = codeNumber;

        return this;
    }

    /**
     * Registers a method name under the specified name for the current code context.
     *
     * @param {string} codeName - The name to associate with the method.
     * @param {string} methodName - The method name to be registered.
     * @return {Router|undefined} The instance of the class for chaining method calls.
     */
    action(codeName, methodName) {
        if (!this.#currentCodeNumber) {
            return undefined;
        }

        // TODO: This takes a `RouterItem` with the `#currentCodeNumber`, and then
        //       **adds a new property `codeName`** to it, containing the `methodName`!
        //       very cumbersome and not very practical... (but it works)
        this.#keymap[this.#currentCodeNumber][codeName] = methodName;
        return this;
    }

    /**
     * Attempt to reimplement {@link action} in a more sound manner
     *
     * @param {string} codeName
     * @param {Function<Controller>} action
     */
    actionEx(codeName, action) {
        if (!this.#currentCodeNumber) {
            return undefined;
        }

        this.#keymap[this.#currentCodeNumber].action = action;
        return this;
    }

    /**
     * Sets the mode for the current code in the internal key storage.
     * If no current code is present, the method will exit without modifications.
     *
     * @param {string} mode - The mode to be set for the current code.
     * @return {Router|undefined} The instance of the class for chaining method calls.
     */
    mode(mode) {
        if (!this.#currentCodeNumber) {
            return undefined;
        }

        this.#keymap[this.#currentCodeNumber].mode = mode;
        return this;
    }

    /**
     * Updates the record status for the current code in the internal keys object.
     *
     * @param {boolean} isRecord - A boolean value indicating whether the current code should be marked as a record.
     * @return {Router|undefined} The instance of the class for chaining method calls.
     */
    record(isRecord) {
        if (!this.#currentCodeNumber) {
            return undefined;
        }

        this.#keymap[this.#currentCodeNumber].record = isRecord;
        return this;
    }

    /**
     * @param {string} code
     * @param {string} key
     * @param {function} record
     * @param {function} before
     * @param {function} after
     * @returns void
     */
    executeActionEx(code, key, record = undefined, before = undefined, after = undefined) {
        if (before && typeof before === 'function') {
            before();
        }

        const routerItem = this.#keymap[code];

        if (routerItem && routerItem[key]) {
            if (record && typeof record === 'function' && routerItem.record) {
                record();
            }

            const prefix = 'controller.';
            const suffix = '(param)';

            if (routerItem.action && typeof routerItem.action === 'function') {
                routerItem.action.call(this.#controller);
            }

            if (after && typeof after === 'function') {
                after();
            }
        }
    }
}
