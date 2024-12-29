/**
 * Created by top on 15-9-6.
 */

import {VimEditor} from './vim_editor';
import * as consts from './consts';

/**
 * Text helper class
 *
 * @remarks
 * There's considerable feature overlap between this class, {@Link Controller}, {@link VimEditor}
 * @todo
 * Refactor {@link TextUtil}, turn it into a simpler interface for supported element types
 * @see {HTMLInputElement}
 * @see {HTMLTextAreaElement}
 */
export class TextUtil {
    /**
     *
     * @global
     * @type {HTMLInputElement|HTMLTextAreaElement}
     */
    textElement;

    /**
     *
     * @param {HTMLInputElement|HTMLTextAreaElement} element
     * @return {void}
     */
    _init(element) {
        this.textElement = element;
        document.selection = undefined;
    }

    /**
     *
     * @param {HTMLInputElement|HTMLTextAreaElement} element
     * @return {void}
     */
    /**
     *
     * @param {number} start
     * @param {number} end
     * @return {string}
     */
    getText(start = -1, end = -1) {
        return start === -1 || end === -1
            ? this.textElement.value
            : this.textElement.value.slice(start, end);
    }

    /**
     *
     * @param {string} text
     * @return {void}
     */
    setText(text) { this.textElement.value = text; }

    /**
     *
     * @return {string}
     */
    getSelectedText() {
        const text = document.selection
            ? document.selection.createRange().text
            : this.textElement.value.substring(this.textElement.selectionStart, this.textElement.selectionEnd);

        return text + '';
    }

    /**
     *
     * @return {number|null}
     */
    getCursorPosition() {
        if (document.selection) {
            this.textElement.focus();
        }

        return this.textElement.selectionStart;
    }

    /**
     *
     * @return {number}
     */
    getSelectEndPos() {
        if (document.selection) {
            this.textElement.focus();
        }

        return this.textElement.selectionEnd;
    }

    /**
     *
     * @param {number} start
     * @param {number} end
     * @return {void}
     */
    select(start, end) {
        if (start > end) {
            [start, end] = [end, start]; // Swap
        }

        const textLength = this.textElement.value.length; // Get the length of the input/textarea value

        start = Math.max(0, start);
        end = Math.min(textLength, end);

        this.textElement.setSelectionRange(start, end);
        this.textElement.focus();
    }

    /**
     *
     * @param {boolean} isAppend
     * @param {string} text
     * @param {number} position
     * @param {boolean} paste
     * @param {boolean} isNewLine
     * @return {void}
     */
    #insertAppendText(
        isAppend,
        text,
        position,
        paste,
        isNewLine
    ) {
        const originalText = this.getText();

        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const newText =
            originalText.slice(0, position) +
            text +
            originalText.slice(position, originalText.length);

        this.setText(newText);

        if (!paste) {
            this.select(position, position + text.length);
        } else if (isAppend && isNewLine && position) {
            this.select(position + 1, position + 2);
        } else if (!isAppend && isNewLine) {
            this.select(position, position + 1);
        } else {
            this.select(position + text.length, position + text.length - 1);
        }

        this.textElement.focus();
    }

    /**
     *
     * @param {string} text
     * @param {number} position
     * @param {boolean} paste
     * @param {boolean} isNewLine
     * @return {void}
     */
    appendText(text, position, paste = false, isNewLine = false) {
        this.#insertAppendText(true, text, position, paste, isNewLine);
    }

    /**
     *
     * @param {string} text
     * @param {number} position
     * @param {boolean} paste
     * @param {boolean} isNewLine
     * @return {void}
     */
    insertText(text, position, paste = false, isNewLine = false) {
        this.#insertAppendText(false, text, position, paste, isNewLine);
    }

    /**
     *
     * @param {number} start
     * @param {number} end
     * @return {string|undefined}
     */
    deleteText(start, end) {
        if (start > end) {
            [start, end] = [end, start]; // Swap
        }

        if (end - start === 0) {
            return undefined;
        }

        const text = this.getText();
        const newText = text.slice(0, start) + text.slice(end) || ' ';

        this.setText(newText);
        return text.slice(start, end);
    }

    /**
     *
     * @return {string|undefined}
     */
    delSelected() {
        const start = this.getCursorPosition();
        const end = this.getSelectEndPos();

        return this.deleteText(start, end);
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     */
    getCountFromStartToPosInCurrLine(position) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const start = this.getCurrLineStartPos(position);
        return position - start + 1;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     */
    getCurrLineStartPos(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const start = this.findSymbolBefore(position, consts.ENTER);
        return start || 0;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     */
    getCurrLineEndPos(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        if (this.getSymbol(position) === consts.ENTER) {
            return position;
        }

        const end = this.findSymbolAfter(position, consts.ENTER_REGEXP);
        return end || this.getText().length;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     */
    getCurrLineCount(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const left = this.findSymbolBefore(position, consts.ENTER);
        const right = this.findSymbolAfter(position, consts.ENTER_REGEXP);

        return left === undefined
            ? right
            : right - left;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     */
    getNextLineStart(position) {
        const start = this.getCurrLineStartPos(position);
        const count = this.getCurrLineCount(position);

        return start + count + 1;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number|undefined}
     */
    getNextLineEnd(position) {
        const start = this.getNextLineStart(position);
        if (start === undefined) { return undefined; }

        const end = this.findSymbolAfter(start, consts.ENTER_REGEXP);
        return end || this.getText().length;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number|undefined}
     */
    getPrevLineEnd(position) {
        return this.getCurrLineStartPos(position) > 0
            ? this.getCurrLineStartPos(position) - 1
            : undefined;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number|undefined}
     */
    getPrevLineStart(position) {
        position = this.getPrevLineEnd(position);
        if (position === undefined) { return undefined; }

        const start = this.findSymbolBefore(position, consts.ENTER);
        return start || 0;
    }

    /**
     *
     * @param {number} position
     * @param {string} char
     * @return {number}
     */
    findSymbolBefore(position, char) {
        const text = this.getText();

        for (let i = position - 1; i >= 0; i--) {
            if (text.charAt(i) === char) {
                return i + 1;
            }
        }

        return 0;
    }

    /**
     *
     * @param {number} position
     * @param {RegExp} pattern
     * @param {RegExp|undefined} andPattern
     * @return {number}
     */
    findSymbolAfter = (
        position,
        pattern,
        andPattern = undefined
    ) => {
        const text = this.getText();

        // And conditions
        for (let i = position; i < text.length; i++) {
            if (pattern.test(text.charAt(i))) {
                if (!andPattern || andPattern.test(text.charAt(i))) {
                    return i;
                }

            }
        }

        return text.length;
    };

    /**
     *
     * @param {number} position
     * @return {string|undefined}
     */

    getSymbol(position) {
        const text = this.getText();
        return text.charAt(position) || undefined;
    }

    /**
     *
     * @param {number} position
     * @return {string|undefined}
     */
    getNextSymbol(position) {
        return this.getSymbol(position + 1);
    }

    /**
     *
     * @param {number} position
     * @return {string|undefined}
     */
    getPrevSymbol(position) {
        return this.getSymbol(position - 1);
    }

    /**
     *
     * @param {string}char
     * @return {RegExp|undefined}
     */
    getCharType(char) {
        if (consts.charRegEx1.test(char) && consts.charRegEx2.test(char)) {
            // This char is a general character(such as a-z,0-9,_, etc),
            // and should find symbol character(such as *&^%$|{(, etc).
            return consts.findSymbolChar;
        }

        if (consts.symbolRegEx1.test(char) && consts.symbolRegEx2.test(char)) {
            //this char is a symbol character (such as *&^%$, etc),
            //and should find general character (such as a-z,0-9,_, etc).
            return consts.findGeneralChar;
        }

        return undefined;
    }

    /**
     * Parse and get current word`s last character`s right position,
     * and in other word, get the next word`s first character`s left position
     * @param {RegExp|undefined} currentCharType
     * @param {number} position
     * @return {number}
     */
    getLastCharPos(currentCharType, position) {
        if (currentCharType) {
            // Get first invisible character position
            const firstInvisible = this.findSymbolAfter(position, /\s/);

            // Get first visible character which after first invisible space
            const firstVisible = this.findSymbolAfter(firstInvisible, /\S/);

            // Get position
            const lastCharPos = this.findSymbolAfter(position, currentCharType, /\S/);

            return lastCharPos - position < firstInvisible - position
                ? lastCharPos
                : firstVisible;
        }

        // Get any visible symbol`s position
        return this.findSymbolAfter(position, /\S/);
    }

    /**
     *
     * @param {number|undefined} position
     * @return {[number, number|undefined]}
     */
    getCurrWordPos(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const currentChar = this.getSymbol(position);
        const currentCharType = this.getCharType(currentChar);

        let lastCharPos = this.getLastCharPos(currentCharType, position);
        if (lastCharPos >= this.getText().length) {
            lastCharPos = undefined;
        }

        return [position, lastCharPos];
    }

    /**
     * @author rsenna
     * Delete char before cursor
     */
    deleteCharBefore() {
        const cursor = this.getCursorPosition();
        const start = cursor === null || cursor <= 0
            ? undefined
            : cursor;
        const end = start - 1;

        return this.deleteText(start, end);
    }
}
