import * as globals from './globals';
import {VimEditor} from './vim_editor';
import {VimController} from './vim_controller';

/**
 * Editor Buffer class
 * @summary
 * Represents a unified "text buffer" for client classes, abstracting the
 * underlying medium: an HTML element, either {@link HTMLInputElement} or
 * {@link HTMLTextAreaElement}.
 * @todo
 * - There's considerable feature overlap between this class and both
 *   {@Link VimController} and {@link VimEditor}, we need to improve on that.
 * - Support multiple cursors.
 * - Extract a generic interface, so other "text buffers" are possible
 *   e.g.`InMemoryEditorBuffer`, `HTMLCanvasEditorBuffer`, etc.
 */
export class HTMLEditorBuffer {
    /** @type {HTMLInputElement|HTMLTextAreaElement} */
    #field = undefined;

    /** @return {string}
     * @public */
    get text() { return this.#field.value; }

    /** @param {string} text
     * @public */
    set text(text) { this.#field.value = text; }

    /**
     *
     * @param {HTMLInputElement|HTMLTextAreaElement} field
     * @return {void}
     * @public
     */
    attachHTMLField(field) {
        this.#field = field;
        document.selection = undefined;
    }

    /**
     *
     * @param {number} start
     * @param {number} end
     * @return {string|undefined}
     * @public
     */
    delete(start, end) {
        if (start > end) {
            [start, end] = [end, start]; // Swap
        }

        if (end - start === 0) {
            return undefined;
        }

        const text = this.text;
        this.text = text.slice(0, start) + text.slice(end) || ' ';
        return text.slice(start, end);
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

        return this.delete(start, end);
    }

    /**
     *
     * @return {string|undefined}
     * @public
     */
    deleteSelection() {
        const start = this.getCursorPosition();
        const end = this.getSelectionEnd();

        return this.delete(start, end);
    }

    /**
     *
     * @param {number} position
     * @return {string|undefined}
     * @public
     * @todo Inline and delete it
     */
    getCharAfter(position) {
        return this.getCharAt(position + 1);
    }

    /**
     *
     * @param {number} position
     * @return {string|undefined}
     * @public
     * @todo Inline and delete it
     */
    getCharAt(position) {
        return this.text.charAt(position) || undefined;
    }

    /**
     *
     * @param {number} position
     * @return {string|undefined}
     * @public
     * @todo Inline and delete it
     */
    getCharBefore(position) {
        return this.getCharAt(position - 1);
    }

    /**
     * Get the absolute caret position inside the view, OR the selection start
     * @return {number|null}
     * @public
     * @todo Providing both "cursor position" and "selection start" is a
     *       accidental property of how HTML fields work; should be abstracted
     *       away
     */
    getCursorPosition() {
        // TODO: Why? We should not have to focus the HTML element here
        if (document.selection) {
            this.#field.focus();
        }

        return this.#field.selectionStart;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     * @public
     * @todo Move to ???
     */
    getLengthToLineEnd(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        if (this.getCharAt(position) === globals.ENTER) {
            return position;
        }

        const end = this.#findExpressionAfter(position, globals.ENTER_REGEXP);
        return end || this.text.length;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     * @public
     * @todo Move to ???
     */
    getLengthFromLineStart(position) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const start = this.getLineStart(position);
        return position - start + 1;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     * @public
     * @todo Move to ???
     */
    getLineLength(position = undefined) {
        // TODO: Remove this call, should be explicit (caller or another method)
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const left = this.#findCharBefore(position, globals.ENTER);
        const right = this.#findExpressionAfter(position, globals.ENTER_REGEXP);

        return left === undefined
            ? right
            : right - left;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     * @public
     * @todo Move to ???
     */
    getLineStart(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const start = this.#findCharBefore(position, globals.ENTER);
        return start || 0;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number|undefined}
     * @public
     * @todo Move to ???
     */
    getNextLineEnd(position) {
        const start = this.getNextLineStart(position);
        if (start === undefined) { return undefined; }

        const end = this.#findExpressionAfter(start, globals.ENTER_REGEXP);
        return end || this.text.length;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number}
     * @public
     * @todo Move to ???
     */
    getNextLineStart(position) {
        const start = this.getLineStart(position);
        const count = this.getLineLength(position);

        return start + count + 1;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number|undefined}
     * @public
     * @todo Move to ???
     */
    getPreviousLineEnd(position) {
        return this.getLineStart(position) > 0
            ? this.getLineStart(position) - 1
            : undefined;
    }

    /**
     *
     * @param {number|undefined} position
     * @return {number|undefined}
     * @public
     * @todo Move to ???
     */
    getPreviousLineStart(position) {
        position = this.getPreviousLineEnd(position);
        if (position === undefined) { return undefined; }

        const start = this.#findCharBefore(position, globals.ENTER);
        return start || 0;
    }

    /**
     *
     * @return {number}
     * @public
     */
    getSelectionEnd() {
        if (document.selection) {
            this.#field.focus();
        }

        return this.#field.selectionEnd;
    }

    /**
     *
     * @return {string}
     * @public
     */
    getSelectedText() {
        const text = document.selection
            ? document.selection.createRange().text
            : this.#field.value.substring(this.#field.selectionStart, this.#field.selectionEnd);

        return text + '';
    }

    /**
     *
     * @param {number} start
     * @param {number} end
     * @return {string}
     * @public
     */
    getSubstring(start = -1, end = -1) {
        return start === -1 || end === -1
            ? this.#field.value
            : this.#field.value.slice(start, end);
    }

    /**
     *
     * @param {number|undefined} position
     * @return {[number, number|undefined]}
     * @public
     * @todo Move to ???
     */
    getWordPosition(position = undefined) {
        position = position === undefined
            ? this.getCursorPosition()
            : position;

        const char = this.getCharAt(position);
        const wordLimitRegEx = this.#getWordLimitRegEx(char);
        const lastCharPosition = this.#getLastCharPosition(wordLimitRegEx, position);

        return [
            position,
            lastCharPosition >= this.text.length ? undefined : lastCharPosition
        ];
    }

    /**
     *
     * @param {string} text
     * @param {number} position
     * @param {boolean} paste
     * @param {boolean} isNewLine
     * @return {void}
     * @public
     */
    insertAtLineEnd(text, position, paste = false, isNewLine = false) {
        this.#insertAtLineStartOrEnd(true, text, position, paste, isNewLine);
    }

    /**
     *
     * @param {string} text
     * @param {number} position
     * @param {boolean} paste
     * @param {boolean} isNewLine
     * @return {void}
     * @public
     */
    insertAtLineStart(text, position, paste = false, isNewLine = false) {
        this.#insertAtLineStartOrEnd(false, text, position, paste, isNewLine);
    }

    /**
     *
     * @param {number} start
     * @param {number} end
     * @return {void}
     * @public
     */
    select(start, end) {
        if (start > end) {
            [start, end] = [end, start]; // Swap
        }

        const textLength = this.#field.value.length; // Get the length of the input/textarea value

        start = Math.max(0, start);
        end = Math.min(textLength, end);

        this.#field.setSelectionRange(start, end);
        this.#field.focus();
    }

    /**
     *
     * @param {number} position
     * @param {string} char
     * @return {number}
     * @private
     */
    #findCharBefore(position, char) {
        const text = this.text;

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
     * @private
     */
    #findExpressionAfter = (
        position,
        pattern,
        andPattern = undefined
    ) => {
        const text = this.text;

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
     * Parse and get current word`s last character`s right position,
     * and in other word, get the next word`s first character`s left position
     * @param {RegExp|undefined} currentCharType
     * @param {number} position
     * @return {number}
     * @private
     */
    #getLastCharPosition(currentCharType, position) {
        if (currentCharType) {
            // Get first invisible character position
            const firstInvisible = this.#findExpressionAfter(position, /\s/);

            // Get first visible character which after first invisible space
            const firstVisible = this.#findExpressionAfter(firstInvisible, /\S/);

            // Get position
            const lastCharPosition = this.#findExpressionAfter(position, currentCharType, /\S/);

            return lastCharPosition - position < firstInvisible - position
                ? lastCharPosition
                : firstVisible;
        }

        // Get any visible symbol`s position
        return this.#findExpressionAfter(position, /\S/);
    }

    /**
     *
     * @param {string}char
     * @return {RegExp|undefined}
     * @remarks
     * This is bound to Vim's definition of a word. From Vim's `:help :word`:
     * > A word consists of a sequence of letters, digits and underscores, or a
     * > sequence of other non-blank characters, separated with white space
     * > (spaces, tabs, <EOL>). [...] An empty line is also considered to be a
     * > word.
     * @private
     * @todo This is Vim specific, should be moved to {@link VimController}
     */
    #getWordLimitRegEx(char) {
        // Given that
        // - An `i` (identifier) char is a letter, a digit or an underscore
        // - A `s` (symbol) char is any other non-blank char
        // - A `w` (whitespace) char is a tab, space or other blank chars

        if (globals.charRegEx1.test(char) && globals.charRegEx2.test(char)) {
            // If it's an `i` char, then we look for a `w or `s` char next:
            return globals.findSymbolChar;
        }

        if (globals.symbolRegEx1.test(char) && globals.symbolRegEx2.test(char)) {
            // If it's an 's' char, then we look for a `w` or `i` char next:
            return globals.findGeneralChar;
        }

        return undefined;
    }

    /**
     *
     * @param {boolean} atEnd
     * @param {string} text
     * @param {number} position
     * @param {boolean} paste
     * @param {boolean} isNewLine
     * @return {void}
     * @private
     */
    #insertAtLineStartOrEnd(
        atEnd,
        text,
        position,
        paste,
        isNewLine
    ) {
        const originalText = this.text;

        position = position === undefined
            ? this.getCursorPosition()
            : position;

        this.text = originalText.slice(0, position) +
            text +
            originalText.slice(position, originalText.length);

        if (!paste) {
            this.select(position, position + text.length);
        } else if (atEnd && isNewLine && position) {
            this.select(position + 1, position + 2);
        } else if (!atEnd && isNewLine) {
            this.select(position, position + 1);
        } else {
            this.select(position + text.length, position + text.length - 1);
        }

        this.#field.focus();
    }
}
