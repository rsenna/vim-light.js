import {CR_CHAR, VIM_MODE} from './globals';

export class VimController {
    /**@type {WebEnvironment} */
    #environment;

    /** @type {HTMLEditorBuffer} */
    #htmlEditorBuffer;

    /**@type {VimEditor} */
    #vimEditor;

    // TODO: remove property setters (state should not be changed like that)

    // unused: get htmlEditorBuffer() { return this.#htmlEditorBuffer; }
    set htmlEditorBuffer(value) { this.#htmlEditorBuffer = value; }

    get vim() { return this.#vimEditor; }

    set vim(value) { this.#vimEditor = value; }

    constructor(environment, vimEditor, htmlEditorBuffer) {
        this.#environment = environment;
        this.#vimEditor = vimEditor;
        this.#htmlEditorBuffer = htmlEditorBuffer;
    }

    append() {
        this.#vimEditor.append();
        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.INSERT), 100);
    }

    appendLineTail() {
        this.#vimEditor.moveToCurrentLineTail();
        this.append();
    }

    appendNewLine() {
        this.#vimEditor.appendNewLine();

        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.INSERT), 100);
    }

    clearReplaceCharRequest() {
        this.#vimEditor.replaceCharRequested = false;
    }

    copy() {
        this.#vimEditor.pasteNewLineRequested = false;
        this.#environment.clipboard = this.#htmlEditorBuffer.getSelectedText();

        if (this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            this.switchModeToGeneral();
        }
    }

    copyCurrentLine(repeatCount) {
        const data = new UndoItem();

        this.#environment.repeat(() => {
            data.text = this.#vimEditor.copyCurrentLine(data.position);
            data.position = this.#htmlEditorBuffer.getNextLineStart(data.position);

            return data.text;
        }, repeatCount);
    }

    copyWord(repeatCount) {
        this.#vimEditor.pasteNewLineRequested = false;

        const start = this.#htmlEditorBuffer.getCursorPosition();
        const end = this.getCurrentWordEndPosition(repeatCount);

        this.#environment.clipboard = this.#htmlEditorBuffer.getSubstring(start, end);
    }

    /**
     * Delete char(s) on and after cursor, or delete selection if active
     * @param {number} repeatCount
     */
    deleteCharAfter(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.deleteSelected(), repeatCount);
        this.switchModeToGeneral();
    }

    /**
     *
     * @param {number} repeatCount
     */
    deleteCurrentLine(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.delCurrLine(), repeatCount);
    }

    deleteWord(repeatCount) {
        this.#vimEditor.pasteNewLineRequested = false;
        this.#environment.repeat(() => this.#vimEditor.deleteWord(), repeatCount);
    }

    /**
     *
     * @param {number} repeatCount
     * @return {number|undefined}
     */
    getCurrentWordEndPosition(repeatCount) {
        let end = undefined;

        this.#environment.repeat(() => {
            end = this.#vimEditor.copyWord(end);
        }, repeatCount);

        return end;
    }

    insert() {
        this.#vimEditor.insert();
        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.INSERT), 100);
    }

    insertLineHead() {
        this.#vimEditor.moveToCurrentLineHead();
        this.insert();
    }

    insertNewLine() {
        this.#vimEditor.insertNewLine();
        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.INSERT), 100);
    }

    moveToCurrentLineHead() {
        this.#vimEditor.moveToCurrentLineHead();
    }

    moveToCurrentLineTail() {
        this.#vimEditor.moveToCurrentLineTail();
    }

    moveToFirstLine() {
        this.#vimEditor.moveToFirstLine();
    }

    moveToLastLine() {
        this.#vimEditor.moveToLastLine();
    }

    moveToNextWord(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.moveToNextWord(), repeatCount);
    }

    pasteAfter() {
        if (this.#environment.clipboard === undefined) { return; }

        if (this.#vimEditor.pasteNewLineRequested) {
            const end = this.#htmlEditorBuffer.getLengthToLineEnd();
            this.#htmlEditorBuffer.insertAtLineEnd(CR_CHAR + this.#environment.clipboard, end, true, true);
        } else {
            this.#htmlEditorBuffer.insertAtLineEnd(this.#environment.clipboard, undefined, true, false);
        }
    }

    pasteBefore() {
        if (this.#environment.clipboard === undefined) { return; }

        if (this.#vimEditor.pasteNewLineRequested) {
            const start = this.#htmlEditorBuffer.getLineStart();
            this.#htmlEditorBuffer.insertAtLineStart(this.#environment.clipboard + CR_CHAR, start, true, true);
        } else {
            this.#htmlEditorBuffer.insertAtLineStart(this.#environment.clipboard, undefined, true, false);
        }
    }

    replaceChar() {
        this.#vimEditor.replaceCharRequested = true;
    }

    selectNextChar(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.selectNextCharacter(), repeatCount);
    }

    selectNextLine(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.selectNextLine(), repeatCount);
    }

    selectPreviousChar(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.selectPrevCharacter(), repeatCount);
    }

    selectPreviousLine(repeatCount) {
        this.#environment.repeat(() => this.#vimEditor.selectPrevLine(), repeatCount);
    }

    /**
     * @author rsenna
     * Delete char before or current line, according to visual mode
     */
    shiftX() {
        this.#vimEditor.pasteNewLineRequested = false;
        this.#vimEditor.deleteCurrentLineOrCharBefore();
    }

    switchModeToGeneral() {
        const mode = this.#vimEditor.currentMode;

        if (this.#vimEditor.isMode(VIM_MODE.NORMAL)) {
            return;
        }

        this.#vimEditor.switchModeTo(VIM_MODE.NORMAL);

        const position = this.#htmlEditorBuffer.getCursorPosition();
        const start = this.#htmlEditorBuffer.getLineStart();

        if (position !== start) {
            if (mode === VIM_MODE.VISUAL) { // TODO: is this ever called?
                this.#vimEditor.selectNextCharacter();
            }

            this.#vimEditor.selectPrevCharacter();
            return;
        }

        const lineCount = this.#htmlEditorBuffer.getLineLength();

        if (!lineCount) {
            this.#htmlEditorBuffer.insertAtLineEnd(' ', position);
        }

        this.#vimEditor.selectNextCharacter();
        this.#vimEditor.selectPrevCharacter();

        if (this.#htmlEditorBuffer.getLineLength() === 1) {
            this.#htmlEditorBuffer.select(position, position + 1);
        }
    }

    switchModeToVisual() {
        if (!this.#vimEditor.isMode(VIM_MODE.VISUAL)) {
            this.#vimEditor.switchModeTo(VIM_MODE.VISUAL);
            this.#vimEditor.resetVisualMode();
            return;
        }

        const start = this.#vimEditor.visualCursor;
        if (start === undefined) { return; }

        const position = this.#vimEditor.visualStart;

        if (position < start) {
            this.#htmlEditorBuffer.select(start - 1, start);
        } else {
            this.#htmlEditorBuffer.select(start, start + 1);
        }

        if (this.#htmlEditorBuffer.getCharBefore(start) === CR_CHAR) {
            this.#htmlEditorBuffer.select(start, start + 1);
        }

        this.#vimEditor.switchModeTo(VIM_MODE.NORMAL);
    }

    undo() {
        const fieldIndex = this.#environment.getFieldIndex();
        const undoHistory = this.#environment.getUndoHistory(fieldIndex);
        this.#vimEditor.applyUndoItem(undoHistory);
    }
}

export class UndoItem {
    /** @type {number} */
    #position;

    /** @type {string} */
    #text;

    get position() { return this.#position; }

    set position(value) { this.#position = value; }

    get text() { return this.#text; }

    set text(value) { this.#text = value; }

    /**
     *
     * @param {number}position
     * @param {string}text
     */
    constructor(position = undefined, text = '') {
        this.#position = position;
        this.#text = text;
    }
}
