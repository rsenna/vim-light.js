import {MODIFIER, VIM_MODE} from './globals';

/**
 * @author rsenna
 * New version of the keymap routing engine, using lambdas instead of _evil
 * {@link eval} magic_...
 * @remarks
 * By making the keymap more "strongly typed", I managed to identify a missing
 * implementation {@link VimController#shiftX}, which is required for executing
 * the `<S-x>` command (normal and visual modes)
 *
 * @param {KeyboardHandler}h
 * @param {VimController}c
 */
export function bindKeymap(h, c) {
    // ---------------------------
    // System feature keys
    // ---------------------------

    h.map(35, 'End').action(() => c.moveToCurrentLineTail());
    h.map(36, 'Home').action(() => c.moveToCurrentLineHead());
    h.map(37, 'Left').action(() => c.selectPreviousChar());
    h.map(38, 'Up').action(() => c.selectPreviousLine());
    h.map(39, 'Right').action(() => c.selectNextChar());
    h.map(40, 'Down').action(() => c.selectNextLine());
    h.map(45, 'Insert').action(() => c.insert());
    h.map(46, 'Delete').action(n => c.deleteCharAfter(n)).record(true);

    // ---------------------------
    // VimEditor feature keys
    // ---------------------------

    // 0: move to current line head
    h.map(48, '0').action(() => c.moveToCurrentLineHead());

    // $: move to current line tail
    h.map(52, '4').action(() => c.moveToCurrentLineTail(), MODIFIER.SHIFT);

    // insertAtLineEnd
    h.map(65, 'a')
        .action(() => c.append())
        .action(() => c.appendLineTail(), MODIFIER.SHIFT);

    // insertAtLineStart
    h.map(73, 'i')
        .action(() => c.insert())
        .action(() => c.insertLineHead(), MODIFIER.SHIFT);

    // new line
    h.map(79, 'o')
        .action(() => c.appendNewLine())
        .action(() => c.insertNewLine(), MODIFIER.SHIFT)
        .record(true);

    // replace
    h.map(82, 'r').action(() => c.replaceChar());

    // down
    h.map(13, 'enter').action(() => c.selectNextLine());
    h.map(74, 'j').action(() => c.selectNextLine());

    // up
    h.map(75, 'k').action(() => c.selectPreviousLine());

    // left
    h.map(72, 'h').action(() => c.selectPreviousChar());

    // right
    h.map(76, 'l').action(() => c.selectNextChar());

    // paste
    h.map(80, 'p')
        .action(() => c.pasteAfter())
        .action(() => c.pasteBefore(), MODIFIER.SHIFT)
        .record(true);

    // back
    h.map(85, 'u').action(() => c.undo());

    // copy char
    h.map(89, 'y').action(() => c.copy()).mode(VIM_MODE.VISUAL);
    h.map('89_89', 'yy').action(() => c.copyCurrentLine());

    // v
    h.map(86, 'v')
        .action(() => c.switchModeToVisual())
        .action(() => c.switchModeToVisual(), MODIFIER.SHIFT);

    // delete character
    h.map(88, 'x')
        .action(n => c.deleteCharAfter(n))
        .action(() => c.shiftX(), MODIFIER.SHIFT) // TODO: was missing, must test new implementation
        .record(true);

    // delete selected char in visual mode
    h.map(68, 'd')
        .action(n => c.deleteCharAfter(n))
        .mode(VIM_MODE.VISUAL)
        .record(true);

    // delete line
    h.map('68_68', 'dd')
        .action(n => c.deleteCurrentLine(n))
        .record(true);

    // G
    h.map(71, 'g').action(() => c.moveToLastLine(), MODIFIER.SHIFT);

    // gg
    h.map('71_71', 'gg').action(() => c.moveToFirstLine());

    // move to next word
    h.map(87, 'w')
        .action(() => c.moveToNextWord())
        .action(() => c.moveToNextWord(), MODIFIER.SHIFT);

    // copy word
    h.map('89_87', 'yw').action(() => c.copyWord());

    // delete one word
    h.map('68_87', 'dw')
        .action(() => c.deleteWord())
        .record(true);
}
