export const ENTER = '\n';
export const ENTER_REGEXP = /\n/;

export const ID_REGEX_1 = /[\w\u4e00-\u9fa5]/;
export const ID_REGEX_2 = /[^|]/;

export const SYMBOL_REGEX_1 = /\W/;
export const SYMBOL_REGEX_2 = /\S/;

export const FIND_SYMBOL = /[^\w\u4e00-\u9fa5]/;
export const FIND_ID = /[\w\u4e00-\u9fa5]/;

export const VIM_MODE = Object.freeze({
    GENERAL: 1,
    EDIT: 2,
    VISUAL: 3,
    COMMAND: 4, // TODO: currently unused
});

export const MODIFIER = Object.freeze({
    NONE: 0,
    SHIFT: 1,
    ALT: 2,
    CTRL: 3,
});

export const ERROR_MESSAGE = 'Execution failure! Please use the vim ' +
    'instructions in the English input method.';

/**
 *
 * @param {KeyboardEvent} event
 * @returns {number|string}
 */
export const getCode = (event) =>
    event.keyCode || event.which || event.charCode || event.code || event.key;

/**
 *
 * @returns {number}
 */
export const getCurrentTime = () =>
    Date.now();

export const isFunction = fn =>
    fn && typeof fn === 'function';

// TODO: should not generate any code in production mode
export const showMsg = (msg, code) =>
    alert(msg + ' code: ' + code);

/**
 * Array of valid key codes
 * @type {Array<number>}
 */
export const VALID_KEY_CODES = [
    9, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123
];
