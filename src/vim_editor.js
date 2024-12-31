import {HTMLEditorBuffer} from './html_editor_buffer';
import {UndoItem} from './vim_controller';
import {COMMAND, EDIT, ENTER, GENERAL, VISUAL} from './globals';

/**
 * Represents a Vim Editor, bound to a {@link HTMLEditorBuffer}
 * @remarks
 * Terminology should be changed, to reflect {@link https://www.vim.org/|Vim} documentation,
 * and to help distinguishing between this class and {@link HTMLEditorBuffer}
 * @example
 * `Yank` instead of `Paste`
 * @see {HTMLEditorBuffer}
 * @see {HTMLInputElement}
 * @see {HTMLTextAreaElement}
 */
export class VimEditor {
    /** @type {string} */
    #currentMode = EDIT;

    /**
     * The starting position of selected text (visual mode)
     * @type {number}
     */
    #visualStart = undefined;

    /**
     * The end position of selected text (visual mode)
     * @type {number}
     */
    #visualCursor = undefined;

    /** @type {HTMLEditorBuffer} */
    #htmlEditorBuffer = undefined;

    /** @type {boolean} */
    #replaceCharRequested = false;

    /** @type {boolean} */
    #pasteNewLineRequested = false;

    // TODO: remove property setters (state should not be changed like that)

    get currentMode() { return this.#currentMode; }

    // unused: get htmlEditorBuffer() { return this.#htmlEditorBuffer; }
    set htmlEditorBuffer(value) { this.#htmlEditorBuffer = value; }

    get visualCursor() { return this.#visualCursor; }
    get visualStart() { return this.#visualStart; }

    get replaceCharRequested() { return this.#replaceCharRequested; }
    set replaceCharRequested(value) { this.#replaceCharRequested = value; }

    get pasteNewLineRequested() { return this.#pasteNewLineRequested; }
    set pasteNewLineRequested(value) { return this.#pasteNewLineRequested = value; }

    resetVim() {
        this.#visualStart = undefined;
        this.#visualCursor = undefined;
    }

    /**
     *
     * @param {string} modeName
     * @return {boolean}
     * @todo Use [rest parameter syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)
     *       So it can receive multiple modes (to be tested with `or` logic,
     *       of course)
     */
    isMode(modeName) {
        return this.#currentMode === modeName;
    }

    static modeNames = [GENERAL, COMMAND, EDIT, VISUAL];

    switchModeTo(modeName) {
        if (VimEditor.modeNames.indexOf(modeName) > -1) {
            this.#currentMode = modeName;
        }
    }

    resetCursorByMouse() {
        this.switchModeTo(GENERAL);

        const position = this.#htmlEditorBuffer.getCursorPosition();
        const start = this.#htmlEditorBuffer.getLineStart();
        const count = this.#htmlEditorBuffer.getLineLength();

        if (position === start && !count) {
            this.#htmlEditorBuffer.insertAtLineEnd(' ', position);
        }

        const nextSymbol = this.#htmlEditorBuffer.getCharAfter(position - 1);

        if (!nextSymbol || nextSymbol === ENTER) {
            this.#htmlEditorBuffer.select(position - 1, position);
        } else {
            this.#htmlEditorBuffer.select(position, position + 1);
        }
    }

    resetVisualMode() {
        this.#visualStart = this.#htmlEditorBuffer.getCursorPosition();
        this.#visualCursor = undefined;
    }

    /**
     * Helper for {@link selectNextCharacter}
     *
     * @return {number|undefined}
     * @private
     */
    #getCursorPosition() {
        const position = this.isMode(VISUAL) && this.#visualCursor !== undefined
            ? this.#visualCursor
            : this.#htmlEditorBuffer.getCursorPosition();

        if (this.isMode(GENERAL) && this.#htmlEditorBuffer.getCharAfter(position) === ENTER) {
            return undefined;
        }

        if (this.isMode(VISUAL) && this.#htmlEditorBuffer.getCharAfter(position - 1) === ENTER) {
            return undefined;
        }

        if (position + 1 > this.#htmlEditorBuffer.text.length) {
            return undefined;
        }

        return position;
    }

    selectNextCharacter() {
        const position = this.#getCursorPosition();

        if (position === undefined) {
            return;
        }

        let start = position + 1;
        let lastVisualCursor = undefined;
        let lastVisualStart = undefined;
        let lastCursorPosition = undefined;

        if (this.isMode(VISUAL)) {
            start = this.#visualStart;
            lastVisualCursor = this.#visualCursor = position + 1;
            lastVisualStart = this.#visualStart;
            lastCursorPosition = this.#htmlEditorBuffer.getCursorPosition();
        }

        this.#htmlEditorBuffer.select(start, position + 2);

        if (!this.isMode(VISUAL)) {
            return;
        }

        if (start === position) {
            this.#htmlEditorBuffer.select(start, position + 2);
            this.#visualCursor = position + 2;
        } else {
            this.#htmlEditorBuffer.select(start, position + 1);
        }

        if (lastVisualStart > lastVisualCursor && lastVisualStart > lastCursorPosition) {
            this.#htmlEditorBuffer.select(start, position + 1);
        } else if (lastVisualCursor === lastVisualStart && lastVisualStart - lastCursorPosition === 1) {
            this.#visualStart = lastVisualStart - 1;
            this.#visualCursor = position + 2;
            this.#htmlEditorBuffer.select(start - 1, position + 2);
        }
    }

    /**
     * Helper for {@link selectPrevCharacter}
     *
     * @param position
     * @return {[number|undefined, number]} `[start, new-position]` tuple,
     * representing the updated visual selection coordinates
     * @private
     */
    #updateVisualPosition(position) {
        if (!this.isMode(VISUAL)) {
            return [position - 1, position];
        }

        let start = this.#visualStart;

        if (position > start && this.#htmlEditorBuffer.getCharBefore(position - 1) === ENTER) {
            return [undefined, position];
        }

        if (position === start) {
            this.#visualStart = ++position;
            this.#visualCursor = --start;

        } else if (position === start + 1) {
            this.#visualStart = ++start;
            this.#visualCursor = (position -= 2);

        } else if (position === start - 1) {
            this.#visualCursor = position = start - 2;

        } else if (position > start && position === this.#htmlEditorBuffer.getSelectionEnd() - 1) {
            this.#visualCursor = position;

        } else {
            this.#visualCursor = --position;
        }

        return [start, position];
    }

    selectPrevCharacter() {
        let position1 = this.#htmlEditorBuffer.getCursorPosition();

        if (this.isMode(VISUAL) && this.#visualCursor !== undefined) {
            position1 = this.#visualCursor;
        }

        if (this.#htmlEditorBuffer.getCharBefore(position1) === ENTER) {
            return;
        }

        const [start, position] = this.#updateVisualPosition(position1);

        if (start === undefined) {
            return;
        }

        this.#visualCursor = Math.max(this.#visualCursor, 0);

        if (start >= 0 && this.isMode(GENERAL) || this.isMode(VISUAL)) {
            this.#htmlEditorBuffer.select(start, position);
        }
    }

    append() {
        const p = this.#htmlEditorBuffer.getCursorPosition();
        this.#htmlEditorBuffer.select(p + 1, p + 1);
    }

    insert() {
        const p = this.#htmlEditorBuffer.getCursorPosition();
        this.#htmlEditorBuffer.select(p, p);
    }

    #adjustNextLineVisual(nextLineStart, position) {
        if (!this.isMode(VISUAL)) {
            return [position - 1, position];
        }

        let start = this.#visualStart;

        if (start > position) {
            position--;
        }

        this.#visualCursor = position;

        if (this.#htmlEditorBuffer.getCharAt(nextLineStart) === ENTER) {

            this.#htmlEditorBuffer.insertAtLineEnd(' ', nextLineStart);
            this.#visualCursor = ++position;

            if (start > position) {
                // Because the new space character is added, the total number of characters increases,
                // and the starting position of the visual increases accordingly.
                this.#visualStart = ++start;
            }
        }

        return [start, position];
    }

    #adjustNextLine(nextLineStart, adjustedLength) {
        let position1 = nextLineStart + adjustedLength;

        if (position1 > this.#htmlEditorBuffer.text.length) {
            return;
        }

        const [start, position] = this.#adjustNextLineVisual(nextLineStart, position1);
        this.#htmlEditorBuffer.select(start, position);

        if (this.isMode(GENERAL) && this.#htmlEditorBuffer.getCharAt(nextLineStart) === ENTER) {
            this.#htmlEditorBuffer.insertAtLineEnd(' ', nextLineStart);
        }
    }

    selectNextLine() {
        const visualCursor = this.isMode(VISUAL) && this.#visualCursor;

        const nextLineStart = this.#htmlEditorBuffer.getNextLineStart(visualCursor);
        const nextLineEnd = this.#htmlEditorBuffer.getNextLineEnd(visualCursor);
        const nextLineLength = nextLineEnd - nextLineStart;

        let currentLineSelectedLength = this.#htmlEditorBuffer.getLengthFromLineStart(visualCursor);

        if (this.isMode(VISUAL) && this.#visualCursor !== undefined && this.#visualStart < this.#visualCursor) {
            currentLineSelectedLength--;
        }

        const adjustedLength = currentLineSelectedLength > nextLineLength
            ? nextLineLength
            : currentLineSelectedLength;

        this.#adjustNextLine(nextLineStart, adjustedLength);
    }

    #getLengthToCursor(cursorPosition) {
        let lengthToCursor = this.#htmlEditorBuffer.getLengthFromLineStart(cursorPosition);

        return this.isMode(VISUAL) && this.#visualCursor !== undefined && this.#visualStart < this.#visualCursor
            ? lengthToCursor - 1
            : lengthToCursor;
    }

    #makeLastLineSelectionVisual(position) {
        let start = position - 1;
        let end = position;

        if (this.isMode(VISUAL)) {
            start = this.#visualStart;

            if (this.#htmlEditorBuffer.getCharBefore(position) !== ENTER && start !== position - 1 && end < start) {
                end = position - 1;
            }

            this.#visualCursor = end;
        }

        this.#htmlEditorBuffer.select(start, end);
    }

    selectPrevLine() {
        let cursorPosition = undefined;

        if (this.isMode(VISUAL) && this.#visualCursor !== undefined) {
            cursorPosition = this.#visualCursor;
        }

        const prevLineStart = this.#htmlEditorBuffer.getPreviousLineStart(cursorPosition);
        const prevLineEnd = this.#htmlEditorBuffer.getPreviousLineEnd(cursorPosition);
        const lengthToCursor = this.#getLengthToCursor(cursorPosition);

        const prevLineLength = prevLineEnd - prevLineStart;
        const position = prevLineStart + (lengthToCursor > prevLineLength ? prevLineLength : lengthToCursor);

        if (position < 0) { return; }

        this.#makeLastLineSelectionVisual(position);

        if (this.isMode(GENERAL) && this.#htmlEditorBuffer.getCharAt(prevLineStart) === ENTER) {
            this.#htmlEditorBuffer.insertAtLineEnd(' ', prevLineStart);
        }
    }

    moveToCurrentLineHead() {
        const position = this.#htmlEditorBuffer.getLineStart();

        if (this.isMode(GENERAL)) {
            this.#htmlEditorBuffer.select(position, position + 1);
        }

        if (this.isMode(VISUAL)) {
            const start = this.#visualCursor === undefined
                ? this.#htmlEditorBuffer.getCursorPosition()
                : this.#visualCursor;

            for (let i = start; i > position; i--) {
                this.selectPrevCharacter();
            }
        }
    }

    moveToCurrentLineTail() {
        if (this.isMode(GENERAL)) {
            let position = this.#htmlEditorBuffer.getLengthToLineEnd();
            this.#htmlEditorBuffer.select(position - 1, position);
        }

        if (this.isMode(VISUAL)) {
            let start = this.#visualCursor || this.#htmlEditorBuffer.getCursorPosition();
            let position = this.#htmlEditorBuffer.getLengthToLineEnd(start);

            if (start === position - 1) {
                position--;
            }

            for (let i = start; i < position; i++) {
                this.selectNextCharacter();
            }
        }
    }

    appendNewLine() {
        const position = this.#htmlEditorBuffer.getLengthToLineEnd();

        this.#htmlEditorBuffer.insertAtLineEnd(ENTER + ' ', position);
        this.#htmlEditorBuffer.select(position + 1, position + 1);
    }

    insertNewLine() {
        const position = this.#htmlEditorBuffer.getLineStart();

        this.#htmlEditorBuffer.insertAtLineEnd(' ' + ENTER, position);
        this.#htmlEditorBuffer.select(position, position);
    }

    deleteSelected() {
        const position = this.#htmlEditorBuffer.getCursorPosition();
        const deletedText = this.#htmlEditorBuffer.deleteSelection();

        this.#htmlEditorBuffer.select(position, position + 1);

        return deletedText;
    }

    /**
     * @author rsenna
     * If there's no selection, delete char before cursor
     * If selection is active, **delete whole line**
     * @remarks
     * That's the default behaviour of `S-X` on VimEditor/Neovim
     */
    delCurrentLineOrCharBefore() {
        if (this.isMode(VISUAL)) {
            this.delCurrLine();
        } else {
            this.#htmlEditorBuffer.deleteCharBefore();
        }

        this.switchModeTo(GENERAL);
    }

    copyCurrentLine(position) {
        const start = this.#htmlEditorBuffer.getLineStart(position);
        const end = this.#htmlEditorBuffer.getLengthToLineEnd(position);

        this.#pasteNewLineRequested = true;
        return this.#htmlEditorBuffer.getSubstring(start, end + 1);
    }

    /**
     *
     * @param {Array<UndoItem>} list
     */
    backToHistory(list) {
        if (!list) { return; }

        const data = list.pop();
        if (data === undefined) { return; }

        this.#htmlEditorBuffer.text = data.text;
        this.#htmlEditorBuffer.select(data.position, data.position + 1);
    }

    delCurrLine() {
        const start = this.#htmlEditorBuffer.getLineStart();
        const end = this.#htmlEditorBuffer.getLengthToLineEnd();
        const text = this.#htmlEditorBuffer.delete(start, end + 1);

        this.#htmlEditorBuffer.select(start, start + 1);
        this.#pasteNewLineRequested = true;

        return text;
    }

    moveToFirstLine() {
        if (this.isMode(GENERAL)) {
            this.#htmlEditorBuffer.select(0, 1);

        } else if (this.isMode(VISUAL)) {
            this.#htmlEditorBuffer.select(this.#visualStart, 0);
            this.#visualCursor = 0;
        }
    }

    moveToLastLine() {
        const text = this.#htmlEditorBuffer.text.length;
        const start = this.#htmlEditorBuffer.getLineStart(text - 1);

        if (this.isMode(GENERAL)) {
            this.#htmlEditorBuffer.select(start, start + 1);

        } else if (this.isMode(VISUAL)) {
            this.#htmlEditorBuffer.select(this.#visualStart, start + 1);
            this.#visualCursor = start + 1;
        }
    }

    moveToNextWord() {
        const visualCursor = this.isMode(VISUAL)
            ? this.#visualCursor
            : undefined;

        const [_, lastCharPosition] = this.#htmlEditorBuffer.getWordPosition(visualCursor);
        if (!lastCharPosition) { return; }

        if (this.isMode(GENERAL)) {
            this.#htmlEditorBuffer.select(lastCharPosition, lastCharPosition + 1);

        } else if (this.isMode(VISUAL)) {
            this.#htmlEditorBuffer.select(this.#visualStart, lastCharPosition + 1);
            this.#visualCursor = lastCharPosition + 1;
        }
    }

    // TODO: why copyWord?!?
    copyWord(position) {
        const [_, lastCharPos] = this.#htmlEditorBuffer.getWordPosition(position);
        return lastCharPos;
    }

    deleteWord() {
        const [position, lastCharPosition] = this.#htmlEditorBuffer.getWordPosition();
        if (lastCharPosition === undefined) { return undefined; }

        const text = this.#htmlEditorBuffer.delete(position, lastCharPosition);
        this.#htmlEditorBuffer.select(position, position + 1);
        return text;
    }
}
