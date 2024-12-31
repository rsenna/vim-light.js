const path = require('path');

module.exports = {
    entry: {
        script: './index.js'
    },
    output: {
        path: path.resolve('./build'),
        filename: 'vim-light.js',
        publicPath: '/build'
    },
    mode: 'development',
    devtool: 'inline-source-map'
};
