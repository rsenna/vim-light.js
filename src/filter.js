/**
 * Created by top on 15-9-6.
 */
import { App } from 'instance/app/app';

const GENERAL = 'general_mode';
const COMMAND = 'command_mode';
const EDIT    = 'edit_mode';
const VISUAL  = 'visual_mode';

const errorMessage = 'Execution failure! Please use the vim instructions in the English input method.';

/**
 *
 * @param {App}app
 * @param {number}code
 * @returns {boolean}
 */
export const code = (app, code) => {
    if (code === 229 && (app.vim.isMode(GENERAL) || app.vim.isMode(VISUAL))) {
        app._log(errorMessage);
        app.config.showMsg(errorMessage);

        return false;
    }

    return true;
};
