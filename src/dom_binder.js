import * as _ from './helper.js';
import {getCode} from './helper.js';
import {GENERAL, VISUAL} from './consts';

// TODO: static class
export class DOMBinder {
    /** @type {Application} */
    #application = undefined;

    /**
     *
     * @param {Application} application
     */
    listen(application) {
        const fields = window.document.querySelectorAll('input, textarea');

        application.loadFields(fields);

        for (let i = 0; i < fields.length; i++) {
            const field = fields[i];

            field.onfocus = this.onFocus;
            field.onclick = this.onClick;
            field.onkeydown = this.onKeyDown;
        }

        application.on('reset_cursor_position', application.onResetCursorPositionHandler);
        application.on('input', application.onKeyDownHandler);

        this.#application = application;
    }

    /**
     *
     * @param {FocusEvent} event
     */
    onFocus(event) {
        this.#application.#currentElement = this;
        this.#application.#textUtil.setEle(this);
        this.#application.#vim.setTextUtil(this.#application.#textUtil);
        this.#application.#vim.resetVim();
        this.#application.#controller.setVim(this.#application.#vim);
        this.#application.#controller.setTextUtil(this.#application.#textUtil);
        this.#application.resetNumericPrefix();
    }

    /**
     *
     * @param {Event} event
     */
    onClick(event) {
        this.#application.fire('reset_cursor_position', event);
    }

    /**
     *
     * @param {KeyboardEvent} event
     */
    onKeyDown(event) {
        let replaced = false;

        const code = getCode(event);

        if (_.indexOf(this.#application.#config.key_code_white_list, code) !== -1) {
            return;
        }

        if (this.#application.#vim.isMode(GENERAL) || this.#application.#vim.isMode(VISUAL)) {
            if (this.#application.#vim.replaceRequest) {
                replaced = true;
                this.#application.#vim.replaceRequest = false;
                setTimeout(function () {
                    this.#application.#vim.selectPrevCharacter();
                }, 50);
            } else {
                event.preventDefault();
            }
        } else if (code !== 27) {
            const position = this.#application.#textUtil.getCursorPosition();

            let newPosition = position - 1 >= 0
                ? position - 1
                : position;

            this.#application.recordText(undefined, newPosition);
        }

        this.#application.fire('input', event, replaced);
    }
}
