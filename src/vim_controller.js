import {WebEnvironment} from './web_environment';
import {VimEditor} from './vim_editor';
import {HTMLEditorBuffer} from './html_editor_buffer';
import {ENTER, VIM_MODE} from './globals';

export class VimController {
    /**@type {WebEnvironment} */
    #environment;

    /**@type {VimEditor} */
    #vimEditor;

    /** @type {HTMLEditorBuffer} */
    #htmlEditorBuffer;

    // TODO: remove property setters (state should not be changed like that)

    get vim() { return this.#vimEditor; }
    set vim(value) { this.#vimEditor = value; }

    // unused: get htmlEditorBuffer() { return this.#htmlEditorBuffer; }
    set htmlEditorBuffer(value) { this.#htmlEditorBuffer = value; }

    constructor(environment, vimEditor, htmlEditorBuffer) {
        this.#environment = environment;
        this.#vimEditor = vimEditor;
        this.#htmlEditorBuffer = htmlEditorBuffer;
    }

    selectPrevCharacter(repeatCount) {
        this.#environment.repeat(this.#vimEditor.selectPrevCharacter, repeatCount);
    }

    selectNextCharacter(repeatCount) {
        this.#environment.repeat(this.#vimEditor.selectNextCharacter, repeatCount);
    }

    switchModeToGeneral() {
        const mode = this.#vimEditor.currentMode;

        if (this.#vimEditor.isMode(VIM_MODE.GENERAL)) {
            return;
        }

        this.#vimEditor.switchModeTo(VIM_MODE.GENERAL);

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

        if (this.#htmlEditorBuffer.getCharBefore(start) === ENTER) {
            this.#htmlEditorBuffer.select(start, start + 1);
        }

        this.#vimEditor.switchModeTo(VIM_MODE.GENERAL);
    }

    append() {
        this.#vimEditor.append();
        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.EDIT), 100);
    }

    appendLineTail() {
        this.#vimEditor.moveToCurrentLineTail();
        this.append();
    }

    insert() {
        this.#vimEditor.insert();
        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.EDIT), 100);
    }

    insertLineHead() {
        this.#vimEditor.moveToCurrentLineHead();
        this.insert();
    }

    selectNextLine(repeatCount) {
        this.#environment.repeat(this.#vimEditor.selectNextLine, repeatCount);
    }

    selectPrevLine(repeatCount) {
        this.#environment.repeat(this.#vimEditor.selectPrevLine, repeatCount);
    }

    copyChar() {
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

    pasteAfter() {
        if (this.#environment.clipboard === undefined) { return; }

        if (this.#vimEditor.pasteNewLineRequested) {
            const end = this.#htmlEditorBuffer.getLengthToLineEnd();
            this.#htmlEditorBuffer.insertAtLineEnd(ENTER + this.#environment.clipboard, end, true, true);
        } else {
            this.#htmlEditorBuffer.insertAtLineEnd(this.#environment.clipboard, undefined, true, false);
        }
    }

    pasteBefore() {
        if (this.#environment.clipboard === undefined) { return; }

        if (this.#vimEditor.pasteNewLineRequested) {
            const start = this.#htmlEditorBuffer.getLineStart();
            this.#htmlEditorBuffer.insertAtLineStart(this.#environment.clipboard + ENTER, start, true, true);
        } else {
            this.#htmlEditorBuffer.insertAtLineStart(this.#environment.clipboard, undefined, true, false);
        }
    }

    moveToCurrentLineHead() {
        this.#vimEditor.moveToCurrentLineHead();
    }

    moveToCurrentLineTail() {
        this.#vimEditor.moveToCurrentLineTail();
    }

    replaceChar() {
        this.#vimEditor.replaceCharRequested = true;
    }

    clearReplaceCharRequest() {
        this.#vimEditor.replaceCharRequested = false;
    }

    appendNewLine() {
        this.#vimEditor.appendNewLine();

        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.EDIT), 100);
    }

    insertNewLine() {
        this.#vimEditor.insertNewLine();

        setTimeout(() => this.#vimEditor.switchModeTo(VIM_MODE.EDIT), 100);
    }

    /**
     * Delete char(s) on and after cursor, or delete selection if active
     * @param {number} repeatCount
     */
    delCharAfter(repeatCount) {
        this.#environment.repeat(this.#vimEditor.deleteSelected, repeatCount);
        this.switchModeToGeneral();
    }

    backToHistory() {
        const key = this.#environment.getElementIndex();
        const list = this.#environment.undoList[key];
        this.#vimEditor.backToHistory(list);
    }

    /**
     *
     * @param {number} repeatCount
     */
    delCurrLine(repeatCount) {
        this.#environment.repeat(this.#vimEditor.delCurrLine, repeatCount);
    }

    moveToFirstLine() {
        this.#vimEditor.moveToFirstLine();
    }

    moveToLastLine() {
        this.#vimEditor.moveToLastLine();
    }

    moveToNextWord(repeatCount) {
        this.#environment.repeat(this.#vimEditor.moveToNextWord, repeatCount);
    }

    copyWord(repeatCount) {
        this.#vimEditor.pasteNewLineRequested = false;

        const start = this.#htmlEditorBuffer.getCursorPosition();
        const end = this.getCurrentWordEndPosition(repeatCount);

        this.#environment.clipboard = this.#htmlEditorBuffer.getSubstring(start, end);
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

    deleteWord(repeatCount) {
        this.#vimEditor.pasteNewLineRequested = false;
        this.#environment.repeat(this.#vimEditor.deleteWord, repeatCount);
    }

    /**
     * @author rsenna
     * Delete char before or current line, according to visual mode
     */
    shiftX() {
        this.#vimEditor.pasteNewLineRequested = false;
        this.#vimEditor.delCurrentLineOrCharBefore()
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
