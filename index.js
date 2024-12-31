import { WebEnvironment } from 'src/web_environment';

window.vim = {
    open: function (options) {
        return new WebEnvironment(options);
    }
};
