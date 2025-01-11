import {WebEnvironment} from './src/web_environment';

/* eslint no-undef: 0 */
window.vim = {
    open: function (options) {
        return new WebEnvironment(options);
    },
};
