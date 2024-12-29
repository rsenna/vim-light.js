/**
 * Created by top on 15-9-6.
 */

import * as _ from './util/helper.js';
import * as filter from './filter.js';

// TODO: duplicated constants
const GENERAL = 'general_mode';
const VISUAL = 'visual_mode';

// TODO: static class
export class Binder {
    /**
     * @type {App|undefined}
     */
    static #app = undefined;

    /**
     *
     * @param {App}app
     */
    static listen(app) {
        Binder.#app = app;
        const boxes = window.document.querySelectorAll('input, textarea');
        Binder.#app.boxes = boxes;

        for (let i = 0; i < boxes.length; i++) {
            const box = boxes[i];

            box.onfocus = Binder.onFocus;
            box.onclick = Binder.onClick;
            box.onkeydown = Binder.onKeyDown;
        }
        Binder.#app._on('reset_cursor_position', function (_) {
            if (Binder.#app.vim.isMode(GENERAL) || #app.vim.isMode(VISUAL)) {
                Binder.#app.vim.resetCursorByMouse();
            }
        });
        Binder.#app._on('input', function (ev, replaced) {
            let code = Binder.getCode(ev);
            Binder.#app._log('mode:' + Binder.#app.vim.currentMode);

            if (replaced) {
                Binder.#app.recordText();
                return;
            }

            if (filter.code(Binder.#app, code)) {
                const unionCode = Binder.#app.isUnionCode(code, -1);
                const vimKeys = Binder.#app.router.keymap;

                if (unionCode && vimKeys[unionCode]) {
                    code = unionCode;
                }

                Binder.#app._log('key code:' + code);
                const num = Binder.#app.numberManager(code);
                Binder.#app.parseRoute(code, ev, num);
            }
        });
    };

    static onFocus() {
        Binder.#app.currentEle = this;
        Binder.#app.textUtil.setEle(this);
        Binder.#app.vim.setTextUtil(Binder.#app.textUtil);
        Binder.#app.vim.resetVim();
        Binder.#app.controller.setVim(Binder.#app.vim);
        Binder.#app.controller.setTextUtil(Binder.#app.textUtil);
        Binder.#app.initNumber();
    }

    static onClick(e) {
        const ev = e || event || window.event;
        Binder.#app._fire('reset_cursor_position', ev);
    }

    static onKeyDown(e) {
        let replaced = false;
        const ev = Binder.getEvent(e);
        const code = Binder.getCode(e);

        if (_.indexOf(Binder.#app.config.key_code_white_list, code) !== -1) {
            return;
        }

        if (Binder.#app.vim.isMode(GENERAL) || Binder.#app.vim.isMode(VISUAL)) {
            if (Binder.#app.vim.replaceRequest) {
                replaced = true;
                Binder.#app.vim.replaceRequest = false;
                setTimeout(function () {
                    Binder.#app.vim.selectPrevCharacter();
                }, 50);
            } else if (ev.preventDefault) {
                ev.preventDefault();
            } else {
                ev.returnValue = false;
            }
        } else if (code !== 27) {
            const position = Binder.#app.textUtil.getCursorPosition();

            let newPosition = position - 1 >= 0
                ? position - 1
                : position;

            Binder.#app.recordText(undefined, newPosition);
        }

        Binder.#app._fire('input', ev, replaced);
    }

    static getEvent(e) {
        return e || event || window.event;
    }

    static getCode(ev) {
        const e = Binder.getEvent(ev);
        return e.keyCode || e.which || e.charCode;
    }
}
