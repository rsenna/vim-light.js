/**
 * Created by top on 15-9-6.
 */

export function setupRoutes(router) {
    // ---------------------------
    // System feature keys
    // ---------------------------

    router.code(35, 'End').action('End', 'moveToCurrentLineTail');
    router.code(36, 'Home').action('Home', 'moveToCurrentLineHead');
    router.code(37, 'Left').action('Left', 'selectPrevCharacter');
    router.code(38, 'Up').action('Up', 'selectPrevLine');
    router.code(39, 'Right').action('Right', 'selectNextCharacter');
    router.code(40, 'Down').action('Down', 'selectNextLine');
    router.code(45, 'Insert').action('Insert', 'insert');
    router.code(46, 'Delete').action('Delete', 'delCharAfter').record(true);

    // ---------------------------
    // VimEditor feature keys
    // ---------------------------

    // 0:move to current line head
    router.code(48, '0').action(0, 'moveToCurrentLineHead');

    // &:move to current line tail
    router.code(52, '4').action('shift_4', 'moveToCurrentLineTail');

    // append
    router.code(65, 'a').action('a', 'append').action('A', 'appendLineTail');

    // insert
    router.code(73, 'i').action('i', 'insert').action('I', 'insertLineHead');

    // new line
    router.code(79, 'o').action('o', 'appendNewLine').action('O', 'insertNewLine').record(true);

    // replace
    router.code(82, 'r').action('r', 'replaceChar');

    // down
    router.code(13, 'enter').action('enter', 'selectNextLine');
    router.code(74, 'j').action('j', 'selectNextLine');

    // up
    router.code(75, 'k').action('k', 'selectPrevLine');

    // left
    router.code(72, 'h').action('h', 'selectPrevCharacter');

    // right
    router.code(76, 'l').action('l', 'selectNextCharacter');

    // paste
    router.code(80, 'p').action('p', 'pasteAfter').action('P', 'pasteBefore').record(true);

    // back
    router.code(85, 'u').action('u', 'backToHistory');

    // copy char
    router.code(89, 'y').action('y', 'copyChar').mode('visual_mode');
    router.code('89_89', 'yy').action('yy', 'copyCurrentLine');

    // v
    router.code(86, 'v').action('v', 'switchModeToVisual').action('V', 'switchModeToVisual');

    // delete character
    router.code(88, 'x').action('x', 'delCharAfter').action('X', 'delCharBefore').record(true);

    // delete selected char in visual mode
    router.code(68, 'd').action('d', 'delCharAfter').mode('visual_mode').record(true);

    // delete line
    router.code('68_68', 'dd').action('dd', 'delCurrLine').record(true);

    // G
    router.code(71, 'g').action('G', 'moveToLastLine');

    // gg
    router.code('71_71', 'gg').action('gg', 'moveToFirstLine');

    // move to next word
    router.code(87, 'w').action('w', 'moveToNextWord').action('W', 'moveToNextWord');

    // copy word
    router.code('89_87', 'yw').action('yw', 'copyWord');

    // delete one word
    router.code('68_87', 'dw').action('dw', 'deleteWord').record(true);
}

/**
 * @author rsenna
 * New version of {@link setupRoutes}, using lambdas instead of evil {@link eval} magic...
 * @param router
 * @remarks
 * By making binding more "strongly typed", I managed to identify a missing
 * implementation {@link Controller#shiftX}, which is required for executing
 * the <S-x> command (normal and visual modes)
 */
export function setupRoutesEx(router) {
    // ---------------------------
    // System feature keys
    // ---------------------------

    router.code(35, 'End').actionEx('End', c => c.moveToCurrentLineTail);
    router.code(36, 'Home').actionEx('Home', c => c.moveToCurrentLineHead);
    router.code(37, 'Left').actionEx('Left', c => c.selectPrevCharacter);
    router.code(38, 'Up').actionEx('Up', c => c.selectPrevLine);
    router.code(39, 'Right').actionEx('Right', c => c.selectNextCharacter);
    router.code(40, 'Down').actionEx('Down', c => c.selectNextLine);
    router.code(45, 'Insert').actionEx('Insert', c => c.insert);
    router.code(46, 'Delete').actionEx('Delete', c => c.delCharAfter).record(true);

    // ---------------------------
    // VimEditor feature keys
    // ---------------------------

    // 0:move to current line head
    router.code(48, '0').actionEx(0, c => c.moveToCurrentLineHead);

    // &:move to current line tail
    router.code(52, '4').actionEx('shift_4', c => c.moveToCurrentLineTail);

    // append
    router.code(65, 'a')
        .actionEx('a', c => c.append)
        .actionEx('A', c => c.appendLineTail);

    // insert
    router.code(73, 'i')
        .actionEx('i', c => c.insert)
        .actionEx('I', c => c.insertLineHead);

    // new line
    router.code(79, 'o')
        .actionEx('o', c => c.appendNewLine)
        .actionEx('O', c => c.insertNewLine)
        .record(true);

    // replace
    router.code(82, 'r').actionEx('r', c => c.replaceChar);

    // down
    router.code(13, 'enter').actionEx('enter', c => c.selectNextLine);
    router.code(74, 'j').actionEx('j', c => c.selectNextLine);

    // up
    router.code(75, 'k').actionEx('k', c => c.selectPrevLine);

    // left
    router.code(72, 'h').actionEx('h', c => c.selectPrevCharacter);

    // right
    router.code(76, 'l').actionEx('l', c => c.selectNextCharacter);

    // paste
    router.code(80, 'p')
        .action('p', c => c.pasteAfter)
        .action('P', c => c.pasteBefore)
        .record(true);

    // back
    router.code(85, 'u').actionEx('u', c => c.backToHistory);

    // copy char
    router.code(89, 'y').actionEx('y', c => c.copyChar).mode('visual_mode');
    router.code('89_89', 'yy').actionEx('yy', c => c.copyCurrentLine);

    // v
    router.code(86, 'v')
        .actionEx('v', c => c.switchModeToVisual)
        .actionEx('V', c => c.switchModeToVisual);

    // delete character
    router.code(88, 'x')
        .actionEx('x', c => c.delCharAfter)
        .actionEx('X', c => c.shiftX) // TODO: was missing, must test new implementation
        .record(true);

    // delete selected char in visual mode
    router.code(68, 'd')
        .actionEx('d', c => c.delCharAfter)
        .mode('visual_mode')
        .record(true);

    // delete line
    router.code('68_68', 'dd')
        .actionEx('dd', c => c.delCurrLine)
        .record(true);

    // G
    router.code(71, 'g').actionEx('G', c => c.moveToLastLine);

    // gg
    router.code('71_71', 'gg').actionEx('gg', c => c.moveToFirstLine);

    // move to next word
    router.code(87, 'w')
        .actionEx('w', c => c.moveToNextWord)
        .actionEx('W', c => c.moveToNextWord);

    // copy word
    router.code('89_87', 'yw').actionEx('yw', c => c.copyWord);

    // delete one word
    router.code('68_87', 'dw')
        .actionEx('dw', c => c.deleteWord)
        .record(true);
}
