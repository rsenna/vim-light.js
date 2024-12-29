const path = require("path");
module.exports = {
    entry: {
        script: "./src/index.js"
    },
    output: {
        path: path.resolve("./build"),
        filename: "vim_editor.js",
        publicPath: "/build"
    },
    devtool: '#source-map'
};
