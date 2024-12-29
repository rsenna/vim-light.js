import * as _ from 'src/helper';
import { Application } from 'src/application';
import { Controller } from 'src/controller';
import { Router } from 'src/router'
import { TextUtil } from 'src/text_util';
import { VimEditor } from 'src/vim_editor';

const init = () => {
    const Application = new Application(undefined, undefined, undefined);

}




/**
 * define #vim
 * @type {{open: Function}}
 */
window.vim = {
    open: function (options) {
        return new Application(undefined, options, undefined, undefined, undefined, undefined);
    }
};
