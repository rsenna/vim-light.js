/* eslint no-undef: 0 */
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
    entry: {
        script: './index.js',
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    parse: {
                        // parse options
                    },
                    compress: {
                        // compress options
                        drop_console: true,
                        ecma: 2015,
                        hoist_funs: true,
                        keep_fargs: true,
                        module: true,
                        passes: 1, // TODO: increase later to see if it makes a difference
                        pure_getters: false, // TODO: check if it makes a difference
                        toplevel: true,
                        unsafe: true,
                    },
                    ecma: 2015,
                    format: {
                        // format options (can also use `output` for backwards compatibility)
                        ascii_only: true,
                        comments: false,
                        ecma: 2015,
                    },
                    mangle: {
                        // mangle options
                        eval: true,
                        module: true,
                        toplevel: true,

                        properties: {
                            // mangle property options
                            keep_quoted: 'strict',
                        },
                    },
                    sourceMap: {
                        // source map options
                    },
                },
            }),
        ],
    },
    mode: 'production',
    output: {
        path: path.resolve('./build'),
        filename: 'vim-light.min.js',
        publicPath: '/build',
    },
};
