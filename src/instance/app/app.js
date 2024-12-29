/**
 * Created by top on 15-9-6.
 */
import * as _ from '../../util/helper';
import {Binder as bind} from '../../bind';
import {Router} from '../router/router';
import {TextUtil} from '../text/text';
import {Vim} from '../vim/vim';
import {Config} from '../../config';
import {setupRoutes, setupRoutesEx} from '../../routes.js';

// TODO: duplicated constants
const GENERAL = 'general_mode';
const VISUAL = 'visual_mode';
const ENTER = '\n';

export class App {
    /**
     * current element
     * @type {undefined}
     */
    currentEle = undefined;

    /**
     * elements of vim.js app
     * @type {Vim|undefined}
     */
    boxes = undefined;

    /**
     * app config
     * @type {Config}
     */
    config = Config;

    /**
     * Router instance
     * @type {Router|undefined}
     */
    router = undefined;

    /**
     * Vim instance
     * @type {Vim|undefined}
     */
    vim = undefined;

    /**
     * TextUtil instance
     * @type {TextUtil|undefined}
     */
    textUtil = undefined;

    /**
     * clipboard of app
     * @type {undefined}
     */
    clipboard = undefined;

    /**
     * app do list
     * @type {Array}
     */
    doList = [];

    /**
     * app do list deep
     * @type {number}
     */
    doListDeep = 100;

    /**
     * previous key code
     * @type {undefined}
     */
    prevCode = undefined;

    /**
     *
     * @type {number}
     */
    prevCodeTime = 0;

    /**
     * numerical for vim command
     * @type {string}
     * @private
     */
    _number = '';

    // TODO: try to remove
    classes = [];

    _init(options) {
        this.config = new Config(options);

        // TODO: review
        this.router = this.createClass('Router');
        this.textUtil = this.createClass('TextUtil', this.currentEle);
        this.vim = this.createClass('Vim', this.textUtil);
        this.controller = this.createClass('Controller', this);

        this._log(this);
        this._start();
    }

    _start() {
        this._route();
        this._bind();
    }

    _route() { setupRoutesEx(this.router); }

    _bind() { bind.listen(this); }

    _on(event, fn) {
        if (!this._events) {
            this._events = {};
        }

        if (typeof fn === 'function') {
            this._events[event] = fn;
        }

        return this;
    }

    _fire(event) {
        if (!this._events || !this._events[event]) {
            return;
        }

        const args = Array.prototype.slice.call(arguments, 1) || [];
        const fn = this._events[event];

        fn.apply(this, args);

        return this;
    }

    _log(message, debugOverride = false) {
        const debug = debugOverride
            ? debugOverride
            : this.config.debug;

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
                this.clipboard = '';
            }

            // TODO: Executed on last iteration only
            if (i === repeatCount - 1) {
                // Remove line break char
                lastResult = lastResult.replace(ENTER, '');
            }

            this.clipboard = this.clipboard + lastResult;
        }
    }

    recordText(text, position) {
        text = text === undefined
            ? this.textUtil.getText()
            : text;

        position = position === undefined
            ? this.textUtil.getCursorPosition()
            : position;

        const data = {
            t: text,
            p: position
        };

        const key = this.getEleKey();

        if (!this.doList[key]) {
            this.doList[key] = [];
        }

        if (this.doList[key].length >= this.doListDeep) {
            this.doList[key].shift();
        }

        this.doList[key].push(data);
        this._log(this.doList);
    }

    getEleKey() { return _.indexOf(this.boxes, this.currentEle); }

    numberManager(code) {
        if (code === 68 || code === 89) {
            // Prevent numerical calculation errors when ndd and nyy, such as when code is 68，
            // If it is not intercepted, initNumber() will be executed later, resulting in the inability to obtain the
            // value during dd.
            return undefined;
        }

        const charCode = parseInt(String.fromCharCode(code));

        if (!isNaN(charCode) && charCode >= 0 && charCode <= 9) {
            this._number = this._number + '' + charCode;
            this._log('number:' + this._number);

            return undefined;
        }

        const number = this._number;
        this.initNumber();

        return number
            ? parseInt(number)
            : undefined;
    }

    initNumber() {
        this._number = '';
    }

    isUnionCode(code, maxTime) {
        if (maxTime === undefined) {
            maxTime = 600;
        }

        const ct = _.currentTime();
        const pt = this.prevCodeTime;
        const pc = this.prevCode;

        this.prevCode = code;
        this.prevCodeTime = ct;

        if (pc && (maxTime < 0 || ct - pt <= maxTime)) {
            if (pc === code) {
                this.prevCode = undefined;
            }
            return pc + '_' + code;
        }

        return undefined;
    }

    parseRoute(code, event) {
        const keybindings = this.router.keymap;

        if (code === 27) {
            this.controller.switchModeToGeneral();
            return;
        }

        if (!keybindings[code] || !this.vim.isMode(GENERAL) && !this.vim.isMode(VISUAL)) {
            return;
        }

        const mode = keybindings[code].mode;

        if (mode && !this.vim.isMode(mode)) {
            return false;
        }

        let keybindingName = keybindings[code].name;

        if (event.shiftKey) {
            if (keybindingName === keybindingName.toUpperCase()) {
                keybindingName = 'shift_' + keybindingName;
            } else {
                keybindingName = keybindingName.toUpperCase();
            }
        }

        this._log(keybindings[code][keybindingName] + suffix);

        if (keybindings[code][keybindingName]) {
            // record
            if (keybindings[code].record) {
                this.recordText();
            }

            const _c = this.controller;
            const prefix = '_c.';
            const suffix = '(param)';
            eval(prefix + keybindings[code][keybindingName] + suffix);

            // init number
            this.initNumber();
        }
    }

    class(name, fn) {
        if (!name) {
            throw new Error('first param is required');
        }

        if (typeof fn !== 'function') {
            throw new Error('second param must be a function');
        }

        this.classes[name] = fn;
    }

    createClass(name, arg) {
        const fn = this.classes[name];

        if (typeof fn !== 'function') {
            throw new Error(`Class ${name} is not defined.`);
        }

        return new fn(arg);
    }
}
