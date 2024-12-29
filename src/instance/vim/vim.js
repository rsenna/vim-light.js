/**
 * Created by top on 15-9-6.
 */

import {TextUtil} from '../text/text';

// TODO: duplicated constants
const GENERAL = 'general_mode';
const COMMAND = 'command_mode';
const EDIT = 'edit_mode';
const VISUAL = 'visual_mode';
const ENTER = '\n';

/**
 * Represents a Vim editor, bound to a text element in the current page
 * @remarks
 * Terminology should be changed, to reflect {@link https://www.vim.org/|Vim} documentation,
 * and to help distinguishing between this class and {@link TextUtil}
 * @example
 * `Yank` instead of `Paste`
 * @see {TextUtil}
 * @see {HTMLInputElement}
 * @see {HTMLTextAreaElement}
 */
export class Vim {
    /**
     * default mode
     * @type {string}
     */
    currentMode = 'edit_mode';

    /**
     * Whether there has been a request to replace a character
     * @type {boolean}
     */
    replaceRequest = false;

    /**
     * Whether there has been a request to paste a new line
     * TODO: not sure what this is for
     * @type {boolean}
     */
    pasteInNewLineRequest = false;

    /**
     * The starting position of selected text (visual mode)
     * @type {number|undefined}
     */
    visualStart = undefined;

    /**
     * The end position of selected text (visual mode)
     * @type {number|undefined}
     */
    visualCursor = undefined;

    /**
     * A reference to {@link TextUtil} dependency
     * @type {TextUtil}
     */
    textUtil = undefined;

    resetVim() {
        this.replaceRequest = false;
        this.visualStart = undefined;
        this.visualCursor = undefined;
    }

    /**
     *
     * @param {TextUtil}textUtil1
     */
    setTextUtil(textUtil1) {
        this.textUtil = textUtil1;
    }

    /**
     *
     * @param modeName
     * @returns {boolean}
     * @todo Use [rest parameter syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)
     *       So it can receive multiple modes (to be tested with `or` logic,
     *       of course)
     */
    isMode(modeName) {
        return this.currentMode === modeName;
    }

    static modeNames = [GENERAL, COMMAND, EDIT, VISUAL];

    switchModeTo(modeName) {
        if (Vim.modeNames.indexOf(modeName) > -1) {
            this.currentMode = modeName;
        }
    }

    resetCursorByMouse() {
        this.switchModeTo(GENERAL);

        const position = this.textUtil.getCursorPosition();
        const start = this.textUtil.getCurrLineStartPos();
        const count = this.textUtil.getCurrLineCount();

        if (position === start && !count) {
            this.textUtil.appendText(' ', position);
        }

        const ns = this.textUtil.getNextSymbol(position - 1);

        if (!ns || ns === ENTER) {
            this.textUtil.select(position - 1, position);
        } else {
            this.textUtil.select(position, position + 1);
        }
    }

    /**
     * Helper for {@link selectNextCharacter}
     *
     * @returns {number|undefined}
     * @private
     */
    #getCursorPosition() {
        let position = this.textUtil.getCursorPosition();

        if (this.isMode(VISUAL) && this.visualCursor !== undefined) {
            position = this.visualCursor;
        }

        if (this.isMode(GENERAL) && this.textUtil.getNextSymbol(position) === ENTER) {
            return undefined;
        }

        if (this.isMode(VISUAL) && this.textUtil.getNextSymbol(position - 1) === ENTER) {
            return undefined;
        }

        if (position + 1 > this.textUtil.getText().length) {
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
            start = this.visualStart;
            this.visualCursor = position + 1;

            lastVisualCursor = this.visualCursor;
            lastVisualStart = this.visualStart;
            lastCursorPosition = this.textUtil.getCursorPosition();
        }

        this.textUtil.select(start, position + 2);

        if (!this.isMode(VISUAL)) {
            return;
        }

        if (start === position) {
            this.textUtil.select(start, position + 2);
            this.visualCursor = position + 2;
        } else {
            this.textUtil.select(start, position + 1);
        }

        if (lastVisualStart > lastVisualCursor && lastVisualStart > lastCursorPosition) {
            this.textUtil.select(start, position + 1);
        } else if (lastVisualCursor === lastVisualStart && lastVisualStart - lastCursorPosition === 1) {
            this.visualStart = lastVisualStart - 1;
            this.visualCursor = position + 2;
            this.textUtil.select(start - 1, position + 2);
        }
    }

    /**
     * Helper for {@link selectPrevCharacter}
     *
     * @param position
     * @returns {[number|undefined, number]} `[start, new-position]` tuple,
     * representing the updated visual selection coordinates
     * @private
     */
    #updateVisualPosition(position) {
        if (!this.isMode(VISUAL)) {
            return [position - 1, position];
        }

        let start = this.visualStart;

        if (position > start && this.textUtil.getPrevSymbol(position - 1) === ENTER) {
            return [undefined, position];
        }

        if (position === start) {
            this.visualStart = ++position;
            this.visualCursor = --start;

        } else if (position === start + 1) {
            this.visualStart = ++start;
            this.visualCursor = (position -= 2);

        } else if (position === start - 1) {
            this.visualCursor = position = start - 2;

        } else if (position > start && position === this.textUtil.getSelectEndPos() - 1) {
            this.visualCursor = position;

        } else {
            this.visualCursor = --position;
        }

        return [start, position];
    }

    selectPrevCharacter() {
        let position1 = this.textUtil.getCursorPosition();

        if (this.isMode(VISUAL) && this.visualCursor !== undefined) {
            position1 = this.visualCursor;
        }

        if (this.textUtil.getPrevSymbol(position1) === ENTER) {
            return;
        }

        const [start, position] = this.#updateVisualPosition(position1);

        if (start === undefined) {
            return;
        }

        this.visualCursor = Math.max(this.visualCursor, 0);

        if (start >= 0 && this.isMode(GENERAL) || this.isMode(VISUAL)) {
            this.textUtil.select(start, position);
        }
    }

    append() {
        const p = this.textUtil.getCursorPosition();
        this.textUtil.select(p + 1, p + 1);
    }

    insert() {
        const p = this.textUtil.getCursorPosition();
        this.textUtil.select(p, p);
    }

    #adjustNextLineVisual(nextLineStart, position) {
        if (!this.isMode(VISUAL)) {
            return [position - 1, position];
        }

        let start = this.visualStart;

        if (start > position) {
            position--;
        }

        this.visualCursor = position;

        if (this.textUtil.getSymbol(nextLineStart) === ENTER) {

            this.textUtil.appendText(' ', nextLineStart);
            this.visualCursor = ++position;

            if (start > position) {
                // Because the new space character is added, the total number of characters increases,
                // and the starting position of the visual increases accordingly.
                this.visualStart = ++start;
            }
        }

        return [start, position];
    }

    #adjustNextLine(nextLineStart, adjustedLength) {
        let position1 = nextLineStart + adjustedLength;

        if (position1 > this.textUtil.getText().length) {
            return;
        }

        const [start, position] = this.#adjustNextLineVisual(nextLineStart, position1);
        this.textUtil.select(start, position);

        if (this.isMode(GENERAL) && this.textUtil.getSymbol(nextLineStart) === ENTER) {
            this.textUtil.appendText(' ', nextLineStart);
        }
    }

    selectNextLine() {
        const visualCursor = this.isMode(VISUAL) && this.visualCursor;

        const nextLineStart = this.textUtil.getNextLineStart(visualCursor);
        const nextLineEnd = this.textUtil.getNextLineEnd(visualCursor);
        const nextLineLength = nextLineEnd - nextLineStart;

        let currentLineSelectedLength = this.textUtil.getCountFromStartToPosInCurrLine(visualCursor);

        if (this.isMode(VISUAL) && this.visualCursor !== undefined && this.visualStart < this.visualCursor) {
            currentLineSelectedLength--;
        }

        const adjustedLength = currentLineSelectedLength > nextLineLength
            ? nextLineLength
            : currentLineSelectedLength;

        this.#adjustNextLine(nextLineStart, adjustedLength);
    }

    #getLengthToCursor(cursorPosition) {
        let lengthToCursor = this.textUtil.getCountFromStartToPosInCurrLine(cursorPosition);

        return this.isMode(VISUAL) && this.visualCursor !== undefined && this.visualStart < this.visualCursor
            ? lengthToCursor - 1
            : lengthToCursor;
    }

    #makeLastLineSelectionVisual(position) {
        let start = position - 1;
        let end = position;

        if (this.isMode(VISUAL)) {
            start = this.visualStart;

            if (this.textUtil.getPrevSymbol(position) !== ENTER && start !== position - 1 && end < start) {
                end = position - 1;
            }

            this.visualCursor = end;
        }

        this.textUtil.select(start, end);
    }

    selectPrevLine() {
        let cursorPosition = undefined;

        if (this.isMode(VISUAL) && this.visualCursor !== undefined) {
            cursorPosition = this.visualCursor;
        }

        const prevLineStart = this.textUtil.getPrevLineStart(cursorPosition);
        const prevLineEnd = this.textUtil.getPrevLineEnd(cursorPosition);
        const lengthToCursor = this.#getLengthToCursor(cursorPosition);

        const prevLineLength = prevLineEnd - prevLineStart;
        const position = prevLineStart + (lengthToCursor > prevLineLength ? prevLineLength : lengthToCursor);

        if (position < 0) { return; }

        this.#makeLastLineSelectionVisual(position);

        if (this.isMode(GENERAL) && this.textUtil.getSymbol(prevLineStart) === ENTER) {
            this.textUtil.appendText(' ', prevLineStart);
        }
    }

    moveToCurrentLineHead() {
        const position = this.textUtil.getCurrLineStartPos();

        if (this.isMode(GENERAL)) {
            this.textUtil.select(position, position + 1);
        }

        if (this.isMode(VISUAL)) {
            const start = this.visualCursor === undefined
                ? this.textUtil.getCursorPosition()
                : this.visualCursor;

            for (let i = start; i > position; i--) {
                this.selectPrevCharacter();
            }
        }
    }

    moveToCurrentLineTail() {
        if (this.isMode(GENERAL)) {
            let position = this.textUtil.getCurrLineEndPos();
            this.textUtil.select(position - 1, position);
        }

        if (this.isMode(VISUAL)) {
            let start = this.visualCursor || this.textUtil.getCursorPosition();
            let position = this.textUtil.getCurrLineEndPos(start);

            if (start === position - 1) {
                position--;
            }

            for (let i = start; i < position; i++) {
                this.selectNextCharacter();
            }
        }
    }

    appendNewLine() {
        const position = this.textUtil.getCurrLineEndPos();

        this.textUtil.appendText(ENTER + ' ', position);
        this.textUtil.select(position + 1, position + 1);
    }

    insertNewLine() {
        const position = this.textUtil.getCurrLineStartPos();

        this.textUtil.appendText(' ' + ENTER, position);
        this.textUtil.select(position, position);
    }

    deleteSelected() {
        const position = this.textUtil.getCursorPosition();
        const deletedText = this.textUtil.delSelected();

        this.textUtil.select(position, position + 1);
        this.pasteInNewLineRequest = false;

        return deletedText;
    }

    /**
     * @author rsenna
     * If there's no selection, delete char before cursor
     * If selection is active, **delete whole line**
     * @remarks
     * That's the default behaviour of `S-X` on Vim/Neovim
     */
    delCurrentLineOrCharBefore() {
        if (this.isMode(VISUAL)) {
            this.delCurrLine();
        } else {
            this.textUtil.deleteCharBefore();
        }

        this.switchModeTo(GENERAL);
    }

    copyCurrentLine(position) {
        const start = this.textUtil.getCurrLineStartPos(position);
        const end = this.textUtil.getCurrLineEndPos(position);

        this.pasteInNewLineRequest = true;
        return this.textUtil.getText(start, end + 1);
    }

    backToHistory(list) {
        if (!list) { return; }

        const data = list.pop();
        if (data === undefined) { return; }

        this.textUtil.setText(data.t);
        this.textUtil.select(data.p, data.p + 1);
    }

    delCurrLine() {
        const start = this.textUtil.getCurrLineStartPos();
        const end = this.textUtil.getCurrLineEndPos();
        const text = this.textUtil.deleteText(start, end + 1);

        this.textUtil.select(start, start + 1);
        this.pasteInNewLineRequest = true;

        return text;
    }

    moveToFirstLine() {
        if (this.isMode(GENERAL)) {
            this.textUtil.select(0, 1);

        } else if (this.isMode(VISUAL)) {
            this.textUtil.select(this.visualStart, 0);
            this.visualCursor = 0;
        }
    }

    moveToLastLine() {
        const text = this.textUtil.getText().length;
        const start = this.textUtil.getCurrLineStartPos(text - 1);

        if (this.isMode(GENERAL)) {
            this.textUtil.select(start, start + 1);

        } else if (this.isMode(VISUAL)) {
            this.textUtil.select(this.visualStart, start + 1);
            this.visualCursor = start + 1;
        }
    }

    moveToNextWord() {
        const visualCursor = this.isMode(VISUAL)
            ? this.visualCursor
            : undefined;

        const [_, lastCharPos] = this.textUtil.getCurrWordPos(visualCursor);
        if (!lastCharPos) { return; }

        if (this.isMode(GENERAL)) {
            this.textUtil.select(lastCharPos, lastCharPos + 1);

        } else if (this.isMode(VISUAL)) {
            this.textUtil.select(this.visualStart, lastCharPos + 1);
            this.visualCursor = lastCharPos + 1;
        }
    }

    // TODO: why copyWord?!?
    copyWord(position) {
        const [_, lastCharPos] = this.textUtil.getCurrWordPos(position);
        return lastCharPos;
    }

    deleteWord() {
        const [position, lastCharPos] = this.textUtil.getCurrWordPos();
        if (lastCharPos === undefined) { return undefined; }

        const text = this.textUtil.deleteText(position, lastCharPos);
        this.textUtil.select(position, position + 1);
        return text;
    }
}
