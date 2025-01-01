/* eslint no-undef: 0 */
const path = require('path');
const ESLintPlugin = require('eslint-webpack-plugin');

module.exports = {
    devServer: {
        static: {
            directory: path.join(__dirname, 'demo'),
        },
        compress: true,
        port: 8080,
    },
    devtool: 'inline-source-map',
    entry: {
        script: './index.js',
    },
    output: {
        path: path.resolve('./build'),
        filename: 'vim-light.js',
        publicPath: '/build',
    },
    plugins: [
        new ESLintPlugin({
            configType: 'flat',
            files: 'src/**/*.js',
            exclude: 'build/**/*.js',
        }),
    ],
    mode: 'development',
};
