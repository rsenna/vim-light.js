import {Config} from './config';
import {HTMLEditorBuffer} from './html_editor_buffer';
import {KeyboardHandler} from './keyboard_handler';
import {ConsoleLogger, Logger} from './logger';
import {UndoItem, VimController} from './vim_controller';
import {VimEditor} from './vim_editor';
import {setupKeymap} from './vim_keymap.js';
import {ENTER, ERROR_MESSAGE, getCode, getCurrentTime, isFunction, MODIFIER, showMsg, VALID_KEY_CODES, VIM_MODE} from './globals';

export class WebEnvironment {
    /** @type {Logger} */
    #logger = undefined;

    /** @type {KeyboardHandler} */
    #keyboardHandler = undefined;

    /** @type {VimController} */
    #vimController = undefined;

    /** @type {VimEditor} */
    #vimEditor = undefined;

    /** @type {HTMLEditorBuffer} */
    #htmlEditorBuffer = undefined;

    /** @type {NodeListOf<HTMLInputElement|HTMLTextAreaElement>} */
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
     * @param {Object} options
     */
    constructor(options) {
        this.#logger.log('Starting up...');

        this.#config = new Config(options);

        // TODO: should use (dummy) Logger in production - or complete remove log calls
        this.#logger = new ConsoleLogger(this.#config);
        this.#htmlEditorBuffer = new HTMLEditorBuffer();
        this.#vimEditor = new VimEditor();
        this.#vimController = new VimController(this, this.#vimEditor, this.#htmlEditorBuffer);
        this.#keyboardHandler = new KeyboardHandler(this.#logger, this.#vimController);

        this.#logger.log(this);
        this.#start();

        this.#logger.log('Startup done.');
    }

    #start() {
        setupKeymap(this.#keyboardHandler);
        this.#connect();
    }

    /**
     *
     * @param {NodeListOf<HTMLInputElement|HTMLTextAreaElement>}fields
     */
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
            this.#logger.log(ERROR_MESSAGE);
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

        this.#logger.log(`mode: ${this.#vimEditor.currentMode}`);

        if (replaced) {
            this.recordText();
            return;
        }

        if (this.filterCode(code)) {
            const unionCode = this.isUnionCode(code, -1);

            if (unionCode && (this.#keyboardHandler.keymap)[unionCode]) {
                code = unionCode;
            }

            this.#logger.log(`key code:${code}`);
            const prefix = this.numericPrefixParser(code);
            this.parseKeymapping(event, prefix, code);
        }
    }

    /**
     *
     * @param {FocusEvent} event
     * @param {HTMLTextAreaElement|HTMLInputElement} field
     */
    onFieldFocus(event, field) {
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
     * @param {MouseEvent} event
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

        if (VALID_KEY_CODES.indexOf(code) !== -1) {
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
        this.#logger.log(this.#undoList);
    }

    getElementIndex() {
        // Note: cannot use Array.indexOf(), #fields is of type NodeListOf<>
        for (let i = 0; i< this.#fields.length; i++) {
            if (this.#fields[i] === this.#currentField) {
                return i;
            }
        }
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
            this.#logger.log('number:' + this.#numericPrefix);

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
     * @param event
     * @param prefix
     * @param code
     * @return {boolean}
     */
    parseKeymapping(event, prefix, code) {
        if (code === 27) {
            this.#vimController.switchModeToGeneral();
            return false;
        }

        const keymapping = this.#keyboardHandler.keymap[code];

        if (!keymapping || !this.#vimEditor.isMode(VIM_MODE.GENERAL) && !this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            return false;
        }

        if (keymapping.mode && !this.#vimEditor.isMode(keymapping.mode)) {
            return false;
        }

        // TODO: deal with other modifiers
        const modifier = event.shiftKey
            ? MODIFIER.SHIFT
            : MODIFIER.NONE;

        this.#keyboardHandler.executeActionEx(
            prefix,
            code,
            modifier,
            this.recordText,
            () => this.#logger.log(`modifier: ${modifier}, keymapping: ${keymapping}`),
            this.resetNumericPrefix)

        return true;
    }

    #connect() {
        /** @type {NodeListOf<HTMLInputElement|HTMLTextAreaElement>} */
        const fields = window.document
            .querySelectorAll('input, textarea');

        this.loadFields(fields);

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            field.onfocus = (event) => this.onFieldFocus(event, field);
            field.onclick = (event) => this.onFieldClick(event);
            field.onkeydown = (event) => this.onFieldKeyDown(event);
        }

        this.on('reset_cursor_position', this.onResetCursorPositionHandler);
        this.on('input', this.onKeyDownHandler);
    }
}
