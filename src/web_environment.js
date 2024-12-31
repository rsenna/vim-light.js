import {Config} from './config';
import {VimController, UndoItem} from './vim_controller';
import {KeyboardHandler} from './keyboard_handler';
import {HTMLEditorBuffer} from './html_editor_buffer';
import {VimEditor} from './vim_editor';
import {setupKeybindings} from './vim_keybindings.js';
import {
    ENTER,
    ERROR_MESSAGE,
    getCode,
    getCurrentTime,
    indexOf,
    isFunction,
    showMsg,
    VALID_KEY_CODES,
    VIM_MODE
} from './globals';

export class WebEnvironment {
    /** @type {KeyboardHandler} */
    #keyboardHandler = undefined;

    /** @type {VimController} */
    #vimController = undefined;

    /** @type {VimEditor} */
    #vimEditor = undefined;

    /** @type {HTMLEditorBuffer} */
    #htmlEditorBuffer = undefined;

    /** @type {Array<HTMLInputElement|HTMLTextAreaElement>} */
    #fields = undefined;

    /** @type {HTMLTextAreaElement|HTMLInputElement} */
    #currentField = undefined;

    /** @type {Config} */
    #config = Config;

    /** @type {string} */
    #clipboard = undefined;

    /** @type {Array} */
    #undoList = [];

    /** @type {number} */
    #undoListLimit = 100;

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

    get undoList() { return this.#undoList; }

    /**
     * Start up web environment
     * @param {Object}options
     */
    constructor(options) {
        this.#htmlEditorBuffer = new HTMLEditorBuffer();
        this.#vimEditor = new VimEditor();
        this.#vimController = new VimController(this, this.#vimEditor, this.#htmlEditorBuffer);
        this.#keyboardHandler = new KeyboardHandler(this.#vimController);

        this.#config = new Config(options);

        this.log(this);
        this.#start();
    }

    #start() {
        this.#route();
        this.#connect();
    }

    #route() { setupKeybindings(this.#keyboardHandler); }

    loadFields(fields) {
        this.#fields = fields;
        this.#currentField = fields[0];
    }

    /**
     *
     * @param {number}code
     * @return {boolean}
     */
    filterCode(code) {
        if (code === 229 && (this.#vimEditor.isMode(VIM_MODE.GENERAL) || this.#vimEditor.isMode(VIM_MODE.VISUAL))) {
            this.log(ERROR_MESSAGE);
            showMsg(ERROR_MESSAGE);

            return false;
        }

        return true;
    }

    // TODO: Many Event related methods, not sure we need (most of) them
    //       E.g. on*(), on(), fire()

    /**
     *
     * @param {Event} _event (unused)
     */
    onResetCursorPositionHandler(_event) {
        if (this.#vimEditor.isMode(VIM_MODE.GENERAL) || this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            this.#vimEditor.resetCursorByMouse();
        }
    }

    /**
     *
     * @param {KeyboardEvent}event
     * @param {boolean}replaced
     */
    onKeyDownHandler(event, replaced) {
        let code = getCode(event);

        this.log('mode:' + this.#vimEditor.currentMode);

        if (replaced) {
            this.recordText();
            return;
        }

        if (this.filterCode(code)) {
            const unionCode = this.isUnionCode(code, -1);

            if (unionCode && (this.#keyboardHandler.keymap)[unionCode]) {
                code = unionCode;
            }

            this.log('key code:' + code);
            const number = this.numericPrefixParser(code);
            this.parseRoute(number, event);
        }
    }

    /**
     *
     * @param {HTMLTextAreaElement|HTMLInputElement} field
     */
    onFieldFocus(field) {
        this.#currentField = field;
        this.#htmlEditorBuffer.attachHTMLField(field);

        this.#vimEditor.htmlEditorBuffer = this.#htmlEditorBuffer;
        this.#vimEditor.resetVim();

        this.#vimController.vim = this.#vimEditor;
        this.#vimController.htmlEditorBuffer = this.#htmlEditorBuffer;
        this.#vimController.clearReplaceCharRequest();

        this.resetNumericPrefix();
    }

    /**
     *
     * @param {Event} event
     */
    onFieldClick(event) {
        this.fire('reset_cursor_position', event);
    }

    /**
     *
     * @param {KeyboardEvent} event
     */
    onFieldKeyDown(event) {
        const code = getCode(event);
        let replaced = false;

        if (indexOf(VALID_KEY_CODES, code) !== -1) {
            return;
        }

        if (this.#vimEditor.isMode(VIM_MODE.GENERAL) || this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            if (this.#vimEditor.replaceCharRequested) {
                replaced = true;
                this.#vimEditor.replaceCharRequested = false;

                setTimeout(() => this.#vimEditor.selectPrevCharacter(), 50);
            } else {
                event.preventDefault();
            }
        } else if (code !== 27) {
            const position = this.#htmlEditorBuffer.getCursorPosition();

            let newPosition = position - 1 >= 0
                ? position - 1
                : position;

            this.recordText(undefined, newPosition);
        }

        this.fire('input', event, replaced);
    }

    /**
     * Register an event
     * @param {string} event
     * @param {function} fn
     * @return {WebEnvironment}
     */
    on(event, fn) {
        if (!this.#events) {
            this.#events = {};
        }

        if (isFunction(fn)) {
            this.#events[event] = fn;
        }

        return this;
    }

    /**
     * Trigger an event
     * @param {string} event
     * @return {WebEnvironment}
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
        if (!isFunction(action)) {
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
            ? this.#htmlEditorBuffer.text
            : text;

        position = position === undefined
            ? this.#htmlEditorBuffer.getCursorPosition()
            : position;

        const data = new UndoItem(position, text);
        const key = this.getElementIndex();

        if (!this.#undoList[key]) {
            this.#undoList[key] = [];
        }

        if (this.#undoList[key].length >= this.#undoListLimit) {
            this.#undoList[key].shift();
        }

        this.#undoList[key].push(data);
        this.log(this.#undoList);
    }

    getElementIndex() {
        return indexOf(this.#fields, this.#currentField);
    }

    numericPrefixParser(code) {
        if (code === 68 || code === 89) {
            // TODO: Understand what the original author meant
            // Prevent numerical calculation errors when ndd and nyy, such as
            // when code is 68; if it is not intercepted, resetNumericPrefix()
            // will be executed later, resulting in the inability to obtain the
            // value during dd.
            return undefined;
        }

        const digit = parseInt(String.fromCharCode(code));

        if (!isNaN(digit) && digit >= 0 && digit <= 9) {
            this.#numericPrefix = this.#numericPrefix + '' + digit;
            this.log('number:' + this.#numericPrefix);

            return undefined;
        }

        const currentPrefix = this.#numericPrefix;
        this.resetNumericPrefix(); // TODO: This only allows single digit numeric prefixes

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
            this.#vimController.switchModeToGeneral();
            return false;
        }

        const route = this.#keyboardHandler.keymap[code];

        if (!route || !this.#vimEditor.isMode(VIM_MODE.GENERAL) && !this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            return false;
        }

        if (route.mode && !this.#vimEditor.isMode(route.mode)) {
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

        this.#keyboardHandler.executeActionEx(
            code,
            fixedRouteName,
            this.recordText,
            () => this.log(route[fixedRouteName]),
            this.resetNumericPrefix)

        return true;
    }

    #connect() {
        const fields = window.document.querySelectorAll('input, textarea');

        this.loadFields(fields);

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            field.onfocus = this.onFieldFocus;
            field.onclick = this.onFieldClick;
            field.onkeydown = this.onFieldKeyDown;
        }

        this.on('reset_cursor_position', this.onResetCursorPositionHandler);
        this.on('input', this.onKeyDownHandler);
    }
}
