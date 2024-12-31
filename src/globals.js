export const ENTER = '\n';
export const ENTER_REGEXP = /\n/;

export const charRegEx1 = /[\w\u4e00-\u9fa5]/;
export const charRegEx2 = /[^|]/;

export const symbolRegEx1 = /\W/;
export const symbolRegEx2 = /\S/;

export const findSymbolChar = /[^\w\u4e00-\u9fa5]/;
export const findGeneralChar = /[\w\u4e00-\u9fa5]/;

export const GENERAL = 'general_mode';
export const EDIT = 'edit_mode';
export const VISUAL = 'visual_mode';
export const COMMAND = 'command_mode'; // TODO: unused?

export const ERROR_MESSAGE = 'Execution failure! Please use the vim ' +
    'instructions in the English input method.';

/**
 *
 * @param {KeyboardEvent} event
 * @returns {number}
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

export const showMsg = (msg, code) =>
    alert(msg + ' code: ' + code);

/**
 * VimEditor key codes whitelist
 * @type {Array<number>}
 */
export const key_code_white_list = [
    9, 112, 113, 114, 115, 116, 117, 118, 119, 120, 121, 122, 123
];
