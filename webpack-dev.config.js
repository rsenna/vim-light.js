const path = require('path');

module.exports = {
    devServer: {
        static: {
            directory: path.join(__dirname, 'demo'),
        },
        compress: true,
        port: 8080
    },
    devtool: 'inline-source-map',
    entry: {
        script: './index.js'
    },
    output: {
        path: path.resolve('./build'),
        filename: 'vim-light.js',
        publicPath: '/build'
    },
    mode: 'development',
};
