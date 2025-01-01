import {isFunction, MODIFIER} from './globals';

export class KeyboardHandler {
    /** @type {VimController} */
    #controller;

    /**
     * Current key code
     * Used to implement the "fluent DSL", which is currently consumed by
     * vim_keymap.js
     *
     * @type {number|string}
     */
    #fluentKeyCode = undefined;

    /**
     * The complete keymap used by this editor
     * @remarks
     * A keymap is a collection of _keymappings_ (key-codes) and their
     * associated behaviour
     * @todo DSL can be implemented in a more sound manner:
     *       Instead of accessing the keymap directly, the fluent DSL
     *       should return a "context object" after each call,
     *       that can be used to further modify the keymap
     *       in a way that is not dependent of KeyboardHandler internal state
     *       (i.e. #fluentKeyCode could be removed).
     *
     * @private
     * @type {Object<number|string, Keymapping>}
     */
    #keymap = {};

    /** @type {Logger} */
    #logger;

    /**
     * Retrieve the current, complete keymap
     * @todo We should have a method that returns a single keymapping, instead
     *       of exposing the whole keymap
     *
     * @return {Object<number|string, Keymapping>}
     */
    get keymap() { return this.#keymap; }

    /**
     *
     * @param {Logger} logger
     * @param {VimController} controller
     */
    constructor(logger, controller) {
        this.#logger = logger;
        this.#controller = controller;
    }

    /**
     *
     * @param {Function<VimController,number>} action
     * @param {number} modifier
     */
    action(action, modifier = MODIFIER.NONE) {
        if (!this.#fluentKeyCode) {
            return undefined;
        }

        this.#keymap[this.#fluentKeyCode].actions[modifier] = action;
        return this;
    }

    /**
     * @param {number} prefix
     * @param {number|string} code
     * @param {number} modifier
     * @param {function} record
     * @param {function} before
     * @param {function} after
     * @return void
     */
    executeMapping(prefix, code, modifier, record = undefined, before = undefined, after = undefined) {
        if (isFunction(before)) {
            before();
        }

        const keymapping = this.#keymap[code];

        if (!keymapping) {
            this.#logger.log(this.executeMapping, `No keymapping found for code ${code}.`);
            return;
        }

        const action = keymapping.actions[modifier];

        if (!action) {
            this.#logger.log(this.executeMapping, `No action found for code ${code} and modifier ${modifier}.`);
            return;
        }

        if (!isFunction(action)) {
            this.#logger.log(this.executeMapping, `INVALID action found for code ${code} and modifier ${modifier}!`);
            return;
        }

        if (isFunction(record)) {
            record();
        }

        action.call(this.#controller, prefix);

        if (isFunction(after)) {
            after();
        }
    }

    /**
     * @param {number|string} code
     * @param {string} name
     * @return {KeyboardHandler} The instance of the class for chaining method calls.
     * @todo Currently, `code` can be either a string or a number.
     * A string is used for a "chord" of keys (e.g. 'gg'), and that's
     * implemented in a weird manner.
     * The most direct fix would be changing this argument to a `Array<number>`
     * instead, but I'm not sure about the impact yet.
     */
    map(code, name) {
        if (!this.#keymap[code]) {
            this.#keymap[code] = new Keymapping();
        }

        const keymapping = this.#keymap[code];

        keymapping.name = name;
        keymapping.mode = undefined;
        keymapping.record = false;

        this.#fluentKeyCode = code;

        return this;
    }

    /**
     * Sets the mode for the current code in the internal key storage.
     * If no current code is present, the method will exit without modifications.
     *
     * @param {number} mode - The mode to be set for the current code.
     * @return {KeyboardHandler|undefined} The instance of the class for chaining method calls.
     */
    mode(mode) {
        if (!this.#fluentKeyCode) {
            return undefined;
        }

        this.#keymap[this.#fluentKeyCode].mode = mode;
        return this;
    }

    /**
     * Updates the record status for the current code in the internal keys object.
     * @todo 'record' is a misnomer; this actually identifies a _destructive_
     *       action - one that can modify the current state of the editor, and
     *       therefore generates undo history
     *
     * @param {boolean} value If this mapping should be recorded into the undo history
     * @return {KeyboardHandler|undefined} The instance of the class for chaining method calls.
     */
    record(value) {
        if (!this.#fluentKeyCode) {
            return undefined;
        }

        this.#keymap[this.#fluentKeyCode].record = value;
        return this;
    }
}

class Keymapping {
    /** @type {Object<number, Function<VimController,number>>} */
    #actions = {};
    /** @type number */
    #mode = 0;
    /** @type string */
    #name;
    /** @type boolean */
    #record = false;

    get actions() { return this.#actions; }

    get mode() { return this.#mode; }

    set mode(value) { this.#mode = value; }

    get name() { return this.#name; }

    set name(value) { this.#name = value; }

    get record() { return this.#record; }

    set record(value) { this.#record = value; }
}
