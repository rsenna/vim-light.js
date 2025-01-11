/* eslint no-undef: 0 */
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const CompressionPlugin = require("compression-webpack-plugin");

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
                        arguments: true,
                        booleans_as_integers: true,
                        drop_console: true,
                        ecma: 2015,
                        hoist_funs: true,
                        keep_fargs: false,
                        module: true,
                        passes: 1,
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
        path: path.resolve('./build/webpack'),
        filename: 'vim-light.min.js',
        publicPath: '/build/webpack/',
    },
    plugins: [
        new CompressionPlugin({
            algorithm: "gzip",
            test: /\.js$|\.css$|\.html$/,
            threshold: 10240,
            minRatio: 0.8
        }),
    ],
};
