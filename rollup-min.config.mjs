import babel from '@rollup/plugin-babel';
import terser from "@rollup/plugin-terser";
import gzipPlugin from 'rollup-plugin-gzip';

export default {
    input: 'index.js',
    output: {
        file: 'build/rollup/vim-light.min.js',
        format: 'iife',
        name: 'vim',
        sourcemap: false
    },
    plugins: [
        babel({
            excluded: 'node_modules/**',
            babelHelpers: 'bundled'
        }),
        gzipPlugin(),
        terser({
            compress: {
                arguments: true,
                booleans_as_integers: true,
                drop_console: true,
                ecma: 5,
                hoist_funs: true,
                keep_fargs: false,
                module: true,
                passes: 1,
                pure_getters: false,
                toplevel: true,
                unsafe: true,
            },
            format: {
                ascii_only: true,
                comments: false,
                ecma: 5,
                beautify: false,
                indent_level: 0,
                max_line_len: 500
            },
            mangle: {
                eval: true,
                module: true,
                toplevel: true,
                properties: {
                    keep_quoted: 'strict',
                },
            },
        })
    ]
};