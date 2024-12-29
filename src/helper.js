
/**
 *
 * @param {KeyboardEvent} event
 * @returns {number}
 */
export const getCode = (event) =>
    event.keyCode || event.which || event.charCode || event.code || event.key

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
