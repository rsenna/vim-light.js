/**
 * Created by top on 15-9-6.
 */

import {App} from './app/app';
import {Vim} from './vim/vim';
import {TextUtil} from './text/text';

const GENERAL = 'general_mode';
const EDIT = 'edit_mode';
const VISUAL = 'visual_mode';
const ENTER = '\n';

export class Controller {
    /**
     * @type {App}
     */
    app;

    /**
     * @type {Vim}
     */
    vim;

    /**
     * @type {TextUtil}
     */
    textUtil;

    /**
     *
     * @param {App} app
     */
    _init(app) {
        this.app = app;
        this.vim = app.vim;
        this.textUtil = app.textUtil;
    }

    /**
     *
     * @param {Vim} vim
     */
    setVim(vim) { this.vim = vim; }

    /**
     *
     * @param {TextUtil} textUtil
     */
    setTextUtil(textUtil) { this.textUtil = textUtil; }

    selectPrevCharacter(repeatCount) {
        this.app.repeat(this.vim.selectPrevCharacter, repeatCount);
    }

    selectNextCharacter(repeatCount) {
        this.app.repeat(this.vim.selectNextCharacter, repeatCount);
    }

    switchModeToGeneral() {
        const cMode = this.vim.currentMode;

        if (this.vim.isMode(GENERAL)) {
            return;
        }

        this.vim.switchModeTo(GENERAL);

        const position = this.textUtil.getCursorPosition();
        const start = this.textUtil.getCurrLineStartPos();

        if (position !== start) {
            if (cMode === VISUAL) { // TODO: is this ever called?
                this.vim.selectNextCharacter();
            }

            this.vim.selectPrevCharacter();
            return;
        }

        const lineCount = this.textUtil.getCurrLineCount();

        if (!lineCount) {
            this.textUtil.appendText(' ', position);
        }

        this.vim.selectNextCharacter();
        this.vim.selectPrevCharacter();

        if (this.textUtil.getCurrLineCount() === 1) {
            this.textUtil.select(position, position + 1);
        }
    }

    switchModeToVisual() {
        if (!this.vim.isMode(VISUAL)) {
            this.vim.switchModeTo(VISUAL);
            this.vim.visualStart = this.textUtil.getCursorPosition();
            this.vim.visualCursor = undefined;
            return;
        }

        const start = this.vim.visualCursor;
        if (start === undefined) { return; }

        const position = this.vim.visualStart;

        if (position < start) {
            this.textUtil.select(start - 1, start);
        } else {
            this.textUtil.select(start, start + 1);
        }

        if (this.textUtil.getPrevSymbol(start) === ENTER) {
            this.textUtil.select(start, start + 1);
        }

        this.vim.switchModeTo(GENERAL);
    }

    append() {
        this.vim.append();
        setTimeout(() => this.vim.switchModeTo(EDIT), 100);
    }

    appendLineTail() {
        this.vim.moveToCurrentLineTail();
        this.append();
    }

    insert() {
        this.vim.insert();
        setTimeout(() => this.vim.switchModeTo(EDIT), 100);
    }

    insertLineHead() {
        this.vim.moveToCurrentLineHead();
        this.insert();
    }

    selectNextLine(repeatCount) {
        this.app.repeat(this.vim.selectNextLine, repeatCount);
    }

    selectPrevLine(repeatCount) {
        this.app.repeat(this.vim.selectPrevLine, repeatCount);
    }

    copyChar() {
        this.vim.pasteInNewLineRequest = false;
        this.app.clipboard = this.textUtil.getSelectedText();

        if (this.vim.isMode(VISUAL)) {
            this.switchModeToGeneral();
        }
    }

    copyCurrentLine(repeatCount) {
        // TODO: define `Data` class with meaningful property names
        const data = {
            p: undefined,
            t: ''
        };

        this.app.repeat(() => {
            data.t = this.vim.copyCurrentLine(data.p);
            data.p = this.textUtil.getNextLineStart(data.p);

            return data.t;
        }, repeatCount);
    }

    pasteAfter() {
        if (this.app.clipboard === undefined) { return; }

        if (this.vim.pasteInNewLineRequest) {
            const end = this.textUtil.getCurrLineEndPos();
            this.textUtil.appendText(ENTER + this.app.clipboard, end, true, true);
        } else {
            this.textUtil.appendText(this.app.clipboard, undefined, true, false);
        }
    }

    pasteBefore() {
        if (this.app.clipboard === undefined) { return; }

        if (this.vim.pasteInNewLineRequest) {
            const start = this.textUtil.getCurrLineStartPos();
            this.textUtil.insertText(this.app.clipboard + ENTER, start, true, true);
        } else {
            this.textUtil.insertText(this.app.clipboard, undefined, true, false);
        }
    }

    moveToCurrentLineHead() {
        this.vim.moveToCurrentLineHead();
    }

    moveToCurrentLineTail() {
        this.vim.moveToCurrentLineTail();
    }

    replaceChar() {
        this.vim.replaceRequest = true;
    }

    appendNewLine() {
        this.vim.appendNewLine();

        setTimeout(() => this.vim.switchModeTo(EDIT), 100);
    }

    insertNewLine() {
        this.vim.insertNewLine();

        setTimeout(() => this.vim.switchModeTo(EDIT), 100);
    }

    /**
     * Delete char(s) on and after cursor, or delete selection if active
     * @param {number} repeatCount
     */
    delCharAfter(repeatCount) {
        this.app.repeat(this.vim.deleteSelected, repeatCount);
        this.switchModeToGeneral();
    }

    backToHistory() {
        const key = this.app.getEleKey();
        const list = this.app.doList[key];
        this.vim.backToHistory(list);
    }

    /**
     *
     * @param {number} repeatCount
     */
    delCurrLine(repeatCount) {
        this.app.repeat(this.vim.delCurrLine, repeatCount);
    }

    moveToFirstLine() {
        this.vim.moveToFirstLine();
    }

    moveToLastLine() {
        this.vim.moveToLastLine();
    }

    moveToNextWord(repeatCount) {
        this.app.repeat(this.vim.moveToNextWord, repeatCount);
    }

    copyWord(repeatCount) {
        this.vim.pasteInNewLineRequest = false;

        const start = this.textUtil.getCursorPosition();
        const end = this.getCurrentWordEndPosition(repeatCount);

        this.app.clipboard = this.textUtil.getText(start, end);
    }

    /**
     *
     * @param {number} repeatCount
     * @returns {number|undefined}
     */
    getCurrentWordEndPosition(repeatCount) {
        let end = undefined;

        this.app.repeat(() => {
            end = this.vim.copyWord(end);
        }, repeatCount);

        return end;
    }

    deleteWord(repeatCount) {
        this.vim.pasteInNewLineRequest = false;
        this.app.repeat(this.vim.deleteWord, repeatCount);
    }

    /**
     * @author rsenna
     * Delete char before or current line, according to visual mode
     */
    shiftX() {
        this.vim.pasteInNewLineRequest = false; // TODO: Why?
        this.vim.delCurrentLineOrCharBefore()
    }
}
