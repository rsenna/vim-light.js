/**
 * Created by top on 15-9-6.
 */

/**
 * @deprecated
 * Used to import methods into an object
 *
 * @param {Object} to
 * @param {Object} form
 * @returns {Object}
 */
export const extend = (to, form) => {
    for (const key in form) {
        to[key] = form[key]
    }
    return to
};

/**
 *
 * @param {Array<string>}array
 * @param {string} key
 * @returns {number}
 */
export const indexOf = (array, key) =>
    array.indexOf(key);

export const currentTime = () =>
    Date.now();
