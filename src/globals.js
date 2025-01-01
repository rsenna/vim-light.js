export const ENTER = '\n';
export const ENTER_REGEXP = /\n/;

export const charRegEx1 = /[\w\u4e00-\u9fa5]/;
export const charRegEx2 = /[^|]/;

export const symbolRegEx1 = /\W/;
export const symbolRegEx2 = /\S/;

export const findSymbolChar = /[^\w\u4e00-\u9fa5]/;
export const findGeneralChar = /[\w\u4e00-\u9fa5]/;

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

/**
 *
 * @param {Array<Object>}array
 * @param {Object} key
 * @return {number}
 */
export const indexOf = (array, key) =>
    array.indexOf(key);

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
