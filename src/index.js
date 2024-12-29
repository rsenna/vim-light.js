import * as _ from 'util/helper';
import { Router } from 'instance/router/router'

/**
 * Vim constructor
 * @constructor
 */
function Vim(textUtil) {
    this._init(textUtil);
}

let prototype = Vim.prototype;
_.extend(prototype, require('./instance/vim/vim.js'));

/**
 * textUtil constructor
 * @constructor
 */
function TextUtil(element) {
    this._init(element);
}

let prototype = TextUtil.prototype;
_.extend(prototype, require('./instance/text/text.js'));

/**
 *
 * @constructor
 */
function Controller(app) {
    this._init(app);
}

let prototype = Controller.prototype;
_.extend(prototype, require('./instance/controller.js'));

/**
 * App constructor
 * @constructor
 */
function App(options) {
    this._init(options);
}

let prototype = App.prototype;
_.extend(prototype, require('./instance/app/app.js'));
prototype.class('Router', Router);
prototype.class('Vim', Vim);
prototype.class('TextUtil', TextUtil);
prototype.class('Controller', Controller);

/**
 * define vim
 * @type {{open: Function}}
 */
window.vim = {
    open: function (options) {
        return new App(options);
    }
};
