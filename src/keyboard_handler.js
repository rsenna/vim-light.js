import {VimController} from './vim_controller';
import {isFunction} from './globals';

class KeyboardItem {
    /** @type string */
    #name;

    /** @type string */
    #mode = '';

    /** @type boolean */
    #record = false;

    /** @type {Function<VimController>} */
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

export class KeyboardHandler {
    /** @type {VimController} */
    #controller;

    /** @type {number|undefined} */
    #currentCodeNumber = undefined;

    /** @type {Object<number, KeyboardItem>} */
    #keymap = {};

    /**
     * Retrieve the current keymapping, associating key-codes and behaviour
     *
     * @return {Object<string, KeyboardItem>}
     */
    get keymap() { return this.#keymap; }

    /**
     *
     * @param {VimController} controller
     */
    constructor(controller) {
        this.#controller = controller;
    }

    /**
     * @param {number|string} codeNumber
     * @param {string} codeName
     * @return {KeyboardHandler} The instance of the class for chaining method calls.
     * @todo
     * Currently, `codeNumber` can be either a string or a number.
     * A string is used for a "chord" of keys (e.g. 'gg'), and that's
     * implemented in a weird manner.
     * The most direct fix would be changing this argument to a `Array<number>`
     * instead, but I'm not sure about the impact yet.
     */
    code(codeNumber, codeName) {
        if (!this.#keymap[codeNumber]) {
            this.#keymap[codeNumber] = new KeyboardItem();
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
     * @return {KeyboardHandler|undefined} The instance of the class for chaining method calls.
     * @deprecated
     */
    action(codeName, methodName) {
        if (!this.#currentCodeNumber) {
            return undefined;
        }

        // TODO: This takes a `KeyboardItem` with the `#currentCodeNumber`, and then
        //       **adds a new property `codeName`** to it, containing the `methodName`!
        //       very cumbersome and not very practical... (but it seems to work)
        this.#keymap[this.#currentCodeNumber][codeName] = methodName;
        return this;
    }

    /**
     * Attempt to reimplement {@link action} in a more sound manner
     *
     * @param {string} codeName
     * @param {Function<VimController>} action
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
     * @return {KeyboardHandler|undefined} The instance of the class for chaining method calls.
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
     * @return {KeyboardHandler|undefined} The instance of the class for chaining method calls.
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
     * @return void
     * @todo This doesn't do much since it's the result of refactoring.
     *       Should probably be removed.
     */
    executeActionEx(code, key, record = undefined, before = undefined, after = undefined) {
        if (isFunction(before)) {
            before();
        }

        const routerItem = this.#keymap[code];

        if (routerItem && routerItem[key]) {
            if (isFunction(record)) {
                record();
            }

            if (isFunction(routerItem.action)) {
                routerItem.action.call(this.#controller);
            }

            if (isFunction(after)) {
                after();
            }
        }
    }
}
