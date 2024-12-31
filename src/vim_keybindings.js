import {KeyboardHandler} from './keyboard_handler';
import {VIM_MODE} from './globals';

/**
 * @author rsenna
 * New version of the keybinding routing engine, using lambdas instead of _evil
 * {@link eval} magic_...
 * @remarks
 * By making binding more "strongly typed", I managed to identify a missing
 * implementation {@link VimController#shiftX}, which is required for executing
 * the `<S-x>` command (normal and visual modes)
 * @todo
 * Duplication in `codeName` arguments on {@link KeyboardHandler#code} and
 * {@link KeyboardHandler#actionEx} calls
 *
 * @param keyboardHandler
 * @param {KeyboardHandler}keyboardHandler
 */
export function setupKeybindings(keyboardHandler) {
    // ---------------------------
    // System feature keys
    // ---------------------------

    keyboardHandler.code(35, 'End').actionEx('End', c => c.moveToCurrentLineTail);
    keyboardHandler.code(36, 'Home').actionEx('Home', c => c.moveToCurrentLineHead);
    keyboardHandler.code(37, 'Left').actionEx('Left', c => c.selectPrevCharacter);
    keyboardHandler.code(38, 'Up').actionEx('Up', c => c.selectPrevLine);
    keyboardHandler.code(39, 'Right').actionEx('Right', c => c.selectNextCharacter);
    keyboardHandler.code(40, 'Down').actionEx('Down', c => c.selectNextLine);
    keyboardHandler.code(45, 'Insert').actionEx('Insert', c => c.insert);
    keyboardHandler.code(46, 'Delete').actionEx('Delete', c => c.delCharAfter).record(true);

    // ---------------------------
    // VimEditor feature keys
    // ---------------------------

    // 0:move to current line head
    keyboardHandler.code(48, '0').actionEx('0', c => c.moveToCurrentLineHead);

    // &:move to current line tail
    keyboardHandler.code(52, '4').actionEx('shift_4', c => c.moveToCurrentLineTail);

    // insertAtLineEnd
    keyboardHandler.code(65, 'a')
        .actionEx('a', c => c.append)
        .actionEx('A', c => c.appendLineTail);

    // insertAtLineStart
    keyboardHandler.code(73, 'i')
        .actionEx('i', c => c.insert)
        .actionEx('I', c => c.insertLineHead);

    // new line
    keyboardHandler.code(79, 'o')
        .actionEx('o', c => c.appendNewLine)
        .actionEx('O', c => c.insertNewLine)
        .record(true);

    // replace
    keyboardHandler.code(82, 'r').actionEx('r', c => c.replaceChar);

    // down
    keyboardHandler.code(13, 'enter').actionEx('enter', c => c.selectNextLine);
    keyboardHandler.code(74, 'j').actionEx('j', c => c.selectNextLine);

    // up
    keyboardHandler.code(75, 'k').actionEx('k', c => c.selectPrevLine);

    // left
    keyboardHandler.code(72, 'h').actionEx('h', c => c.selectPrevCharacter);

    // right
    keyboardHandler.code(76, 'l').actionEx('l', c => c.selectNextCharacter);

    // paste
    keyboardHandler.code(80, 'p')
        .actionEx('p', c => c.pasteAfter)
        .actionEx('P', c => c.pasteBefore)
        .record(true);

    // back
    keyboardHandler.code(85, 'u').actionEx('u', c => c.backToHistory);

    // copy char
    keyboardHandler.code(89, 'y').actionEx('y', c => c.copyChar).mode(VIM_MODE.VISUAL);
    keyboardHandler.code('89_89', 'yy').actionEx('yy', c => c.copyCurrentLine);

    // v
    keyboardHandler.code(86, 'v')
        .actionEx('v', c => c.switchModeToVisual)
        .actionEx('V', c => c.switchModeToVisual);

    // delete character
    keyboardHandler.code(88, 'x')
        .actionEx('x', c => c.delCharAfter)
        .actionEx('X', c => c.shiftX) // TODO: was missing, must test new implementation
        .record(true);

    // delete selected char in visual mode
    keyboardHandler.code(68, 'd')
        .actionEx('d', c => c.delCharAfter)
        .mode(VIM_MODE.VISUAL)
        .record(true);

    // delete line
    keyboardHandler.code('68_68', 'dd')
        .actionEx('dd', c => c.delCurrLine)
        .record(true);

    // G
    keyboardHandler.code(71, 'g').actionEx('G', c => c.moveToLastLine);

    // gg
    keyboardHandler.code('71_71', 'gg').actionEx('gg', c => c.moveToFirstLine);

    // move to next word
    keyboardHandler.code(87, 'w')
        .actionEx('w', c => c.moveToNextWord)
        .actionEx('W', c => c.moveToNextWord);

    // copy word
    keyboardHandler.code('89_87', 'yw').actionEx('yw', c => c.copyWord);

    // delete one word
    keyboardHandler.code('68_87', 'dw')
        .actionEx('dw', c => c.deleteWord)
        .record(true);
}
