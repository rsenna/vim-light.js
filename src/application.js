/**
 * Created by top on 15-9-6.
 */

import {DOMBinder} from './dom_binder';
import {Router} from './router';
import {TextUtil} from './text_util';
import {VimEditor} from './vim_editor';
import {Config} from './config';
import {Controller, Data} from './controller';
import {setupRoutesEx} from './routes.js';
import * as console from 'node:console';
import * as filter from './filter';
import {getCode, getCurrentTime, indexOf} from './helper';

// TODO: duplicated constants
const GENERAL = 'general_mode';
const VISUAL = 'visual_mode';
const ENTER = '\n';

export class Application {
    /** @type {DOMBinder} */
    #domBinder = undefined;

    /** @type {Router} */
    #router = undefined;

    /** @type {Controller} */
    #controller = undefined;

    /** @type {VimEditor} */
    #vim = undefined;

    /** @type {TextUtil} */
    #textUtil = undefined;

    /**
     * Elements of vim_editor.js #application
     * @type {Array<HTMLInputElement|HTMLTextAreaElement>}
     */
    #fields = undefined;

    /** @type {HTMLTextAreaElement|HTMLInputElement} */
    #currentField = undefined;

    /** @type {Config} */
    #config = Config;

    /** @type {string} */
    #clipboard = undefined;

    /** @type {Array} */
    #doList = [];

    /** @type {number} */
    #doListDeep = 100;

    /** @type {number|string} */
    #previousCode = undefined;

    /** @type {number} */
    #previousCodeTime = 0;

    /** @type {string} */
    #numericPrefix = '';

    /** @type {Object<string, function>} */
    #events = undefined;

    get clipboard() { return this.#clipboard; }
    set clipboard(value) { this.#clipboard = value; }

    /**
     *
     * @param {DOMBinder} domBinder
     * @param {Router} router
     * @param {Controller} controller
     * @param {VimEditor} vim
     * @param {TextUtil} textUtil
     * @param {Object} options
     */
    constructor(domBinder, router, controller, vim, textUtil, options) {
        this.#domBinder = domBinder;
        this.#router = router;
        this.#controller = controller;
        this.#vim = vim;
        this.#textUtil = textUtil;

        this.#config = new Config(options);

        this.log(this);
        this.#start();
    }

    #start() {
        this.#route();
        this.#bind();
    }

    #route() { setupRoutesEx(this.#router); }

    #bind() { this.#domBinder.listen(this); }

    loadFields(fields) {
        this.#fields = fields;
        this.#currentField = fields[0];
    }

    /**
     *
     * @param {Event} event
     */
    onResetCursorPositionHandler(event) {
        if (this.#vim.isMode(GENERAL) || this.#vim.isMode(VISUAL)) {
            this.#vim.resetCursorByMouse();
        }
    }

    /**
     *
     * @param {KeyboardEvent}event
     * @param {boolean}replaced
     */
    onKeyDownHandler(event, replaced) {
        let code = getCode(event);

        this.log('mode:' + this.#vim.currentMode);

        if (replaced) {
            this.recordText();
            return;
        }

        if (filter.code(this, code)) {
            const unionCode = this.isUnionCode(code, -1);

            if (unionCode && (this.#router.keymap)[unionCode]) {
                code = unionCode;
            }

            this.log('key code:' + code);
            this.parseRoute(code, event);
        }
    }

    /**
     * Register an event
     * @param {string} event
     * @param {function} fn
     * @return {Application}
     */
    on(event, fn) {
        if (!this.#events) {
            this.#events = {};
        }

        if (fn && typeof fn === 'function') {
            this.#events[event] = fn;
        }

        return this;
    }

    /**
     * Trigger an event
     * @param {string} event
     * @return {Application}
     */
    fire(event) {
        if (!this.#events || !this.#events[event]) {
            return this;
        }

        const args = Array.prototype.slice.call(arguments, 1) || [];
        const fn = this.#events[event];

        fn.apply(this, args);

        return this;
    }

    log(message, debugOverride = false) {
        const debug = debugOverride
            ? debugOverride
            : this.#config.debug;

        if (debug) {
            console.log(message);
        }
    }

    repeat(action, repeatCount) {
        if (typeof action !== 'function') {
            return;
        }

        if (repeatCount === undefined || isNaN(repeatCount)) {
            repeatCount = 1;
        }

        let lastResult = undefined;

        for (let i = 0; i < repeatCount; i++) {
            lastResult = action.apply();

            if (!lastResult) { continue; }

            // TODO: Executed on first iteration only
            if (!i) {
                this.#clipboard = '';
            }

            // TODO: Executed on last iteration only
            if (i === repeatCount - 1) {
                // Remove line break char
                lastResult = lastResult.replace(ENTER, '');
            }

            this.#clipboard += lastResult;
        }
    }

    recordText(text, position) {
        text = text === undefined
            ? this.#textUtil.getText()
            : text;

        position = position === undefined
            ? this.#textUtil.getCursorPosition()
            : position;

        const data = new Data(position, text);
        const key = this.getElementIndex();

        if (!this.#doList[key]) {
            this.#doList[key] = [];
        }

        if (this.#doList[key].length >= this.#doListDeep) {
            this.#doList[key].shift();
        }

        this.#doList[key].push(data);
        this.log(this.#doList);
    }

    getElementIndex() {
        return indexOf(this.#fields, this.#currentField);
    }

    numericPrefixParser(code) {
        if (code === 68 || code === 89) {
            // Prevent numerical calculation errors when ndd and nyy, such as when code is 68，
            // If it is not intercepted, resetNumericPrefix() will be executed later, resulting in the inability to obtain the
            // value during dd.
            return undefined;
        }

        const charCode = parseInt(String.fromCharCode(code));

        if (!isNaN(charCode) && charCode >= 0 && charCode <= 9) {
            this.#numericPrefix = this.#numericPrefix + '' + charCode;
            this.log('number:' + this.#numericPrefix);

            return undefined;
        }

        const currentPrefix = this.#numericPrefix;
        this.resetNumericPrefix();

        return currentPrefix
            ? parseInt(currentPrefix)
            : undefined;
    }

    resetNumericPrefix() {
        this.#numericPrefix = '';
    }

    isUnionCode(code, maxTime = 600) {
        const currentTime = getCurrentTime();
        const previousCodeTime = this.#previousCodeTime;
        const previousCode = this.#previousCode;

        this.#previousCode = code;
        this.#previousCodeTime = currentTime;

        if (previousCode && (maxTime < 0 || currentTime - previousCodeTime <= maxTime)) {
            if (previousCode === code) {
                this.#previousCode = undefined;
            }
            return previousCode + '_' + code;
        }

        return undefined;
    }

    /**
     *
     * @param code
     * @param event
     * @return {boolean}
     */
    parseRoute(code, event) {
        if (code === 27) {
            this.#controller.switchModeToGeneral();
            return false;
        }

        const route = this.#router.keymap[code];

        if (!route || !this.#vim.isMode(GENERAL) && !this.#vim.isMode(VISUAL)) {
            return false;
        }

        if (route.mode && !this.#vim.isMode(route.mode)) {
            return false;
        }

        let fixedRouteName = route.name;

        if (event.shiftKey) {
            const upperCaseRouteName = fixedRouteName.toUpperCase();

            if (fixedRouteName === upperCaseRouteName) {
                fixedRouteName = 'shift_' + fixedRouteName;
            } else {
                fixedRouteName = upperCaseRouteName;
            }
        }

        this.#router.executeActionEx(
            code,
            fixedRouteName,
            this.recordText,
            () => this.log(route[fixedRouteName]),
            this.resetNumericPrefix)

        return true;
    }
}
