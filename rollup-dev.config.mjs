import eslint from "@rollup/plugin-eslint";
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'

export default {
    input: 'index.js',
    output: {
        file: 'build/rollup/vim-light.js',
        format: 'iife',
        name: 'vim',
        sourcemap: 'inline'
    },
    plugins: [
        eslint({
            // configType: 'flat',
            fix: true,
            exclude: [
                'build/**',
                'node_modules/**'
            ]
        }),
        livereload({
            delay: 2000,
            watch: ['build', 'demo'],
            port: 8000,
            verbose: true,
        }),
        serve({
            openPage: '/demo/demo.html',
            contentBase: ['build', 'demo'],
            port: 8000,
            host: 'localhost',

            onListening: function (server) {
                const address = server.address();
                const host = address.address === '::' ? 'localhost' : address.address;
                const protocol = this.https ? 'https' : 'http';

                console.log(`Server listening at ${protocol}://${host}:${address.port}/`);
            }
        })
    ]
};