/**
 * Created by top on 15-9-6.
 */
import {Application} from 'src/application';
import {ERROR_MESSAGE, GENERAL, VISUAL} from './consts';

/**
 *
 * @param {Application}application
 * @param {number}code
 * @return {boolean}
 */
export const code = (application, code) => {
    if (code === 229 && (application.#vim.isMode(GENERAL) || application.#vim.isMode(VISUAL))) {
        application.log(ERROR_MESSAGE);
        application.#config.showMsg(ERROR_MESSAGE);

        return false;
    }

    return true;
};
