import globals from "globals";
import pluginJs from "@eslint/js";
import stylisticJs from '@stylistic/eslint-plugin-js'

/** @type {import('eslint').Linter.Config[]} */
export default [
    pluginJs.configs.recommended,
    {
        files: ["src/*.js"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: globals.browser,
        },
        plugins: {
            "@stylistic/js": stylisticJs,
        },
        rules: {
            "no-unused-vars": [
                "error",
                {
                    "argsIgnorePattern": "^_",
                    "varsIgnorePattern": "^_",
                    "caughtErrorsIgnorePattern": "^_",
                },
            ],
            "@stylistic/js/indent": ["warn", 4],
            "@stylistic/js/linebreak-style": ["warn", "unix"],
            // "@stylistic/js/quotes": ["warn", "single", {
            //     "avoidEscape": true,
            //     "allowTemplateLiterals": true
            // }],
            "@stylistic/js/semi": ["error", "always"],
        },
    },
];
