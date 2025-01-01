import {KeyboardHandler} from './keyboard_handler';
import {MODIFIER, VIM_MODE} from './globals';

/**
 * @author rsenna
 * New version of the keymap routing engine, using lambdas instead of _evil
 * {@link eval} magic_...
 * @remarks
 * By making the keymap more "strongly typed", I managed to identify a missing
 * implementation {@link VimController#shiftX}, which is required for executing
 * the `<S-x>` command (normal and visual modes)
 * @todo
 * Duplication in `codeName` arguments on {@link KeyboardHandler#map} and
 * {@link KeyboardHandler#action} calls
 *
 * @param keyboardHandler
 * @param {KeyboardHandler}keyboardHandler
 */
export function setupKeymap(keyboardHandler) {
    // ---------------------------
    // System feature keys
    // ---------------------------

    keyboardHandler.map(35, 'End').action(c => c.moveToCurrentLineTail);
    keyboardHandler.map(36, 'Home').action(c => c.moveToCurrentLineHead);
    keyboardHandler.map(37, 'Left').action(c => c.selectPrevCharacter);
    keyboardHandler.map(38, 'Up').action(c => c.selectPrevLine);
    keyboardHandler.map(39, 'Right').action(c => c.selectNextCharacter);
    keyboardHandler.map(40, 'Down').action(c => c.selectNextLine);
    keyboardHandler.map(45, 'Insert').action(c => c.insert);
    keyboardHandler.map(46, 'Delete').action(c => c.delCharAfter).record(true);

    // ---------------------------
    // VimEditor feature keys
    // ---------------------------

    // 0:move to current line head
    keyboardHandler.map(48, '0').action(c => c.moveToCurrentLineHead);

    // &:move to current line tail
    keyboardHandler.map(52, '4').action(c => c.moveToCurrentLineTail, MODIFIER.SHIFT);

    // insertAtLineEnd
    keyboardHandler.map(65, 'a')
        .action(c => c.append)
        .action(c => c.appendLineTail, MODIFIER.SHIFT);

    // insertAtLineStart
    keyboardHandler.map(73, 'i')
        .action(c => c.insert)
        .action(c => c.insertLineHead, MODIFIER.SHIFT);

    // new line
    keyboardHandler.map(79, 'o')
        .action(c => c.appendNewLine)
        .action(c => c.insertNewLine, MODIFIER.SHIFT)
        .record(true);

    // replace
    keyboardHandler.map(82, 'r').action(c => c.replaceChar);

    // down
    keyboardHandler.map(13, 'enter').action(c => c.selectNextLine);
    keyboardHandler.map(74, 'j').action(c => c.selectNextLine);

    // up
    keyboardHandler.map(75, 'k').action(c => c.selectPrevLine);

    // left
    keyboardHandler.map(72, 'h').action(c => c.selectPrevCharacter);

    // right
    keyboardHandler.map(76, 'l').action(c => c.selectNextCharacter);

    // paste
    keyboardHandler.map(80, 'p')
        .action(c => c.pasteAfter)
        .action(c => c.pasteBefore, MODIFIER.SHIFT)
        .record(true);

    // back
    keyboardHandler.map(85, 'u').action(c => c.backToHistory);

    // copy char
    keyboardHandler.map(89, 'y').action(c => c.copyChar).mode(VIM_MODE.VISUAL);
    keyboardHandler.map('89_89', 'yy').action(c => c.copyCurrentLine);

    // v
    keyboardHandler.map(86, 'v')
        .action(c => c.switchModeToVisual)
        .action(c => c.switchModeToVisual, MODIFIER.SHIFT);

    // delete character
    keyboardHandler.map(88, 'x')
        .action(c => c.delCharAfter)
        .action(c => c.shiftX, MODIFIER.SHIFT) // TODO: was missing, must test new implementation
        .record(true);

    // delete selected char in visual mode
    keyboardHandler.map(68, 'd')
        .action(c => c.delCharAfter)
        .mode(VIM_MODE.VISUAL)
        .record(true);

    // delete line
    keyboardHandler.map('68_68', 'dd')
        .action(c => c.delCurrLine)
        .record(true);

    // G
    keyboardHandler.map(71, 'g')
        .action(c => c.moveToLastLine, MODIFIER.SHIFT);

    // gg
    keyboardHandler.map('71_71', 'gg').action(c => c.moveToFirstLine);

    // move to next word
    keyboardHandler.map(87, 'w')
        .action(c => c.moveToNextWord)
        .action(c => c.moveToNextWord, MODIFIER.SHIFT);

    // copy word
    keyboardHandler.map('89_87', 'yw').action(c => c.copyWord);

    // delete one word
    keyboardHandler.map('68_87', 'dw')
        .action(c => c.deleteWord)
        .record(true);
}
