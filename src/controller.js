/**
 * Created by top on 15-9-6.
 */

import {Application} from './application';
import {VimEditor} from './vim_editor';
import {TextUtil} from './text_util';
import {EDIT, ENTER, GENERAL, VISUAL} from './consts';

export class Data {
    /** @type {number|undefined} */
    #position;

    /** @type {string} */
    #text;

    get position() { return this.#position; }
    set position(value) { this.#position = value; }

    get text() { return this.#text; }
    set text(value) { this.#text = value; }

    constructor(position = undefined, text = '') {
        this.#position = position;
        this.#text = text;
    }
}

export class Controller {
    /**@type {Application} */
    #application;

    /**@type {VimEditor} */
    #vim;

    /** @type {TextUtil} */
    #textUtil;

    constructor(application, vim, textUtil) {
        this.#application = application;
        this.#vim = vim;
        this.#textUtil = textUtil;
    }

    selectPrevCharacter(repeatCount) {
        this.#application.repeat(this.#vim.selectPrevCharacter, repeatCount);
    }

    selectNextCharacter(repeatCount) {
        this.#application.repeat(this.#vim.selectNextCharacter, repeatCount);
    }

    switchModeToGeneral() {
        const cMode = this.#vim.currentMode;

        if (this.#vim.isMode(GENERAL)) {
            return;
        }

        this.#vim.switchModeTo(GENERAL);

        const position = this.#textUtil.getCursorPosition();
        const start = this.#textUtil.getCurrLineStartPos();

        if (position !== start) {
            if (cMode === VISUAL) { // TODO: is this ever called?
                this.#vim.selectNextCharacter();
            }

            this.#vim.selectPrevCharacter();
            return;
        }

        const lineCount = this.#textUtil.getCurrLineCount();

        if (!lineCount) {
            this.#textUtil.appendText(' ', position);
        }

        this.#vim.selectNextCharacter();
        this.#vim.selectPrevCharacter();

        if (this.#textUtil.getCurrLineCount() === 1) {
            this.#textUtil.select(position, position + 1);
        }
    }

    switchModeToVisual() {
        if (!this.#vim.isMode(VISUAL)) {
            this.#vim.switchModeTo(VISUAL);
            this.#vim.visualStart = this.#textUtil.getCursorPosition();
            this.#vim.visualCursor = undefined;
            return;
        }

        const start = this.#vim.visualCursor;
        if (start === undefined) { return; }

        const position = this.#vim.visualStart;

        if (position < start) {
            this.#textUtil.select(start - 1, start);
        } else {
            this.#textUtil.select(start, start + 1);
        }

        if (this.#textUtil.getPrevSymbol(start) === ENTER) {
            this.#textUtil.select(start, start + 1);
        }

        this.#vim.switchModeTo(GENERAL);
    }

    append() {
        this.#vim.append();
        setTimeout(() => this.#vim.switchModeTo(EDIT), 100);
    }

    appendLineTail() {
        this.#vim.moveToCurrentLineTail();
        this.append();
    }

    insert() {
        this.#vim.insert();
        setTimeout(() => this.#vim.switchModeTo(EDIT), 100);
    }

    insertLineHead() {
        this.#vim.moveToCurrentLineHead();
        this.insert();
    }

    selectNextLine(repeatCount) {
        this.#application.repeat(this.#vim.selectNextLine, repeatCount);
    }

    selectPrevLine(repeatCount) {
        this.#application.repeat(this.#vim.selectPrevLine, repeatCount);
    }

    copyChar() {
        this.#vim.pasteInNewLineRequest = false;
        this.#application.clipboard = this.#textUtil.getSelectedText();

        if (this.#vim.isMode(VISUAL)) {
            this.switchModeToGeneral();
        }
    }

    copyCurrentLine(repeatCount) {
        // TODO: define `Data` class with meaningful property names
        const data = new Data();

        this.#application.repeat(() => {
            data.text = this.#vim.copyCurrentLine(data.position);
            data.position = this.#textUtil.getNextLineStart(data.position);

            return data.text;
        }, repeatCount);
    }

    pasteAfter() {
        if (this.#application.clipboard === undefined) { return; }

        if (this.#vim.pasteInNewLineRequest) {
            const end = this.#textUtil.getCurrLineEndPos();
            this.#textUtil.appendText(ENTER + this.#application.clipboard, end, true, true);
        } else {
            this.#textUtil.appendText(this.#application.clipboard, undefined, true, false);
        }
    }

    pasteBefore() {
        if (this.#application.clipboard === undefined) { return; }

        if (this.#vim.pasteInNewLineRequest) {
            const start = this.#textUtil.getCurrLineStartPos();
            this.#textUtil.insertText(this.#application.clipboard + ENTER, start, true, true);
        } else {
            this.#textUtil.insertText(this.#application.clipboard, undefined, true, false);
        }
    }

    moveToCurrentLineHead() {
        this.#vim.moveToCurrentLineHead();
    }

    moveToCurrentLineTail() {
        this.#vim.moveToCurrentLineTail();
    }

    replaceChar() {
        this.#vim.replaceRequest = true;
    }

    appendNewLine() {
        this.#vim.appendNewLine();

        setTimeout(() => this.#vim.switchModeTo(EDIT), 100);
    }

    insertNewLine() {
        this.#vim.insertNewLine();

        setTimeout(() => this.#vim.switchModeTo(EDIT), 100);
    }

    /**
     * Delete char(s) on and after cursor, or delete selection if active
     * @param {number} repeatCount
     */
    delCharAfter(repeatCount) {
        this.#application.repeat(this.#vim.deleteSelected, repeatCount);
        this.switchModeToGeneral();
    }

    backToHistory() {
        const key = this.#application.getElementIndex();
        const list = this.#application.#doList[key];
        this.#vim.backToHistory(list);
    }

    /**
     *
     * @param {number} repeatCount
     */
    delCurrLine(repeatCount) {
        this.#application.repeat(this.#vim.delCurrLine, repeatCount);
    }

    moveToFirstLine() {
        this.#vim.moveToFirstLine();
    }

    moveToLastLine() {
        this.#vim.moveToLastLine();
    }

    moveToNextWord(repeatCount) {
        this.#application.repeat(this.#vim.moveToNextWord, repeatCount);
    }

    copyWord(repeatCount) {
        this.#vim.pasteInNewLineRequest = false;

        const start = this.#textUtil.getCursorPosition();
        const end = this.getCurrentWordEndPosition(repeatCount);

        this.#application.clipboard = this.#textUtil.getText(start, end);
    }

    /**
     *
     * @param {number} repeatCount
     * @return {number|undefined}
     */
    getCurrentWordEndPosition(repeatCount) {
        let end = undefined;

        this.#application.repeat(() => {
            end = this.#vim.copyWord(end);
        }, repeatCount);

        return end;
    }

    deleteWord(repeatCount) {
        this.#vim.pasteInNewLineRequest = false;
        this.#application.repeat(this.#vim.deleteWord, repeatCount);
    }

    /**
     * @author rsenna
     * Delete char before or current line, according to visual mode
     */
    shiftX() {
        this.#vim.pasteInNewLineRequest = false; // TODO: Why?
        this.#vim.delCurrentLineOrCharBefore()
    }
}
