import {Config} from './config';
import {
    CR_CHAR,
    ERROR_MESSAGE,
    EXTRA_KEY_CODES,
    getCode,
    getCurrentTime,
    isFunction,
    MODIFIER,
    showMsg,
    VIM_MODE,
} from './globals';
import {HTMLEditorBuffer} from './html_editor_buffer';
import {KeyboardHandler} from './keyboard_handler';
import {BrowserLogger} from './logger';
import {UndoItem, VimController} from './vim_controller';
import {VimEditor} from './vim_editor';
import {bindKeymap} from './vim_keymap.js';

export class WebEnvironment {
    /**
     * Undo history for all known fields
     * @todo items should be trees, not lists (like Vim undo trees)
     *
     * @type {Record<number, UndoItem[]>}
     */
    #allUndoHistory = [];
    // TODO: should provide access to OS clipboard too
    /** @type {string} */
    #clipboard = undefined;
    /** @type {Config} */
    #config = Config;
    /** @type {HTMLTextAreaElement|HTMLInputElement} */
    #currentField = undefined;
    /** @type {NodeListOf<HTMLInputElement|HTMLTextAreaElement>} */
    #fields = undefined;
    /** @type {HTMLEditorBuffer} */
    #htmlEditorBuffer = undefined;
    /** @type {KeyboardHandler} */
    #keyboardHandler = undefined;
    /** @type {Logger} */
    #logger = undefined;
    // TODO: should be a list of registers
    /** @type {string} */
    #numericPrefix = '';
    /** @type {number|string} */
    #previousCode = undefined;
    /** @type {number} */
    #previousCodeTime = 0;
    /** @type {number} */
    #undoHistoryLimit = 100;
    /** @type {VimController} */
    #vimController = undefined;
    /** @type {VimEditor} */
    #vimEditor = undefined;

    get clipboard() { return this.#clipboard; }

    set clipboard(value) { this.#clipboard = value; }

    /**
     * Start up web environment
     * @param {Object} options
     */
    constructor(options) {
        this.#config = new Config(options);
        this.#logger = new BrowserLogger(this.#config);

        // TODO: should use (dummy) Logger in production - or complete remove log calls
        this.#logger.log(this.constructor, 'Starting up...');

        this.#htmlEditorBuffer = new HTMLEditorBuffer();
        this.#vimEditor = new VimEditor();
        this.#vimController = new VimController(this, this.#vimEditor, this.#htmlEditorBuffer);
        this.#keyboardHandler = new KeyboardHandler(this.#logger, this.#vimController);
        this.#start();

        this.#logger.log(this.constructor,'Startup done.');
    }

    #bindFields() {
        /** @type {NodeListOf<HTMLInputElement|HTMLTextAreaElement>} */
        const fields = window.document
            .querySelectorAll('input, textarea');

        this.#fields = fields;
        this.#currentField = fields[0];

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            field.onfocus = (event) => this.onFieldFocus(event, field);
            field.onclick = (event) => this.onFieldClick(event);
            field.onkeydown = (event) => this.onFieldKeyDown(event);
        }
    }

    /**
     *
     * @param {number}code
     * @return {boolean}
     */
    #filterCode(code) {
        const error = code === 229 &&
            (this.#vimEditor.isMode(VIM_MODE.NORMAL) ||
                this.#vimEditor.isMode(VIM_MODE.VISUAL));

        if (!error) {
            return true;
        }

        this.#logger.log(this.#filterCode, ERROR_MESSAGE);
        showMsg(ERROR_MESSAGE);

        return false;
    }

    #isUnionCode(code, maxTime = 600) {
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

    #numericPrefixParser(code) {
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
            this.#logger.log(this.#numericPrefixParser, 'number:' + this.#numericPrefix);

            return undefined;
        }

        const currentPrefix = this.#numericPrefix;
        this.#numericPrefix = ''; // TODO: only single digit numeric prefixes?

        return currentPrefix
            ? parseInt(currentPrefix)
            : undefined;
    }

    /**
     *
     * @param event
     * @param prefix
     * @param code
     * @return {boolean}
     */
    #parseKeymapping(event, prefix, code) {
        if (code === 27) {
            this.#vimController.switchModeToGeneral();
            return false;
        }

        const keymapping = this.#keyboardHandler.keymap[code];

        if (!keymapping || !this.#vimEditor.isMode(VIM_MODE.NORMAL) && !this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            return false;
        }

        if (keymapping.mode && !this.#vimEditor.isMode(keymapping.mode)) {
            return false;
        }

        // TODO: deal with other modifiers
        const modifier = event.shiftKey
            ? MODIFIER.SHIFT
            : MODIFIER.NONE;

        this.#keyboardHandler.executeMapping(
            prefix,
            code,
            modifier,
            () => this.#recordUndoHistory(),
            () => this.#logger.log(this.#parseKeymapping, `modifier: ${modifier}, keymapping: ${keymapping}`),
            () => this.#numericPrefix = '');

        return true;
    }

    #recordUndoHistory(text, position) {
        text = text === undefined
            ? this.#htmlEditorBuffer.text
            : text;

        position = position === undefined
            ? this.#htmlEditorBuffer.getCursorPosition()
            : position;

        const data = new UndoItem(position, text);
        const fieldIndex = this.getFieldIndex();

        if (!this.#allUndoHistory[fieldIndex]) {
            this.#allUndoHistory[fieldIndex] = [];
        }

        if (this.#allUndoHistory[fieldIndex].length >= this.#undoHistoryLimit) {
            this.#allUndoHistory[fieldIndex].shift();
        }

        this.#allUndoHistory[fieldIndex].push(data);
        this.#logger.log(this.#recordUndoHistory, this.#allUndoHistory);
    }

    #start() {
        bindKeymap(this.#keyboardHandler, this.#vimController);
        this.#bindFields();
    }

    getFieldIndex() {
        // Note: cannot use Array.indexOf(), #fields is of type NodeListOf<>
        for (let i = 0; i < this.#fields.length; i++) {
            if (this.#fields[i] === this.#currentField) {
                return i;
            }
        }
    }

    /** @type {UndoItem[]} */
    getUndoHistory(index) { return this.#allUndoHistory[index]; }

    /**
     *
     * @param {MouseEvent} _event (unused
     */
    onFieldClick(_event) {
        if (this.#vimEditor.isMode(VIM_MODE.NORMAL) || this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            this.#vimEditor.resetCursorByMouse();
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

        this.#numericPrefix = '';
    }

    /**
     *
     * @param {KeyboardEvent} event
     */
    onFieldKeyDown(event) {
        const code = getCode(event);
        let replaced = false;

        if (EXTRA_KEY_CODES.indexOf(code) !== -1) {
            return;
        }

        if (this.#vimEditor.isMode(VIM_MODE.NORMAL) || this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
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

            this.#recordUndoHistory(undefined, newPosition);
        }

        this.#logger.log(this.onFieldKeyDown, `mode: ${this.#vimEditor.currentMode}`);

        if (replaced) {
            this.#recordUndoHistory();
        }

        if (!this.#filterCode(code)) {
            return;
        }

        const unionCode = this.#isUnionCode(code, -1);
        const actualCode = unionCode && (this.#keyboardHandler.keymap)[unionCode]
            ? unionCode
            : code;

        this.#logger.log(this.onFieldKeyDown, `key code:${actualCode}`);

        const prefix = this.#numericPrefixParser(actualCode);
        this.#parseKeymapping(event, prefix, actualCode);
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
                lastResult = lastResult.replace(CR_CHAR, '');
            }

            this.#clipboard += lastResult;
        }
    }
}
