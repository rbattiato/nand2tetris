"use strict";
exports.__esModule = true;
var Parser_1 = require("./Parser");
var CodeWriter_1 = require("./CodeWriter");
if (process.argv.length < 3) {
    console.log("Usage: node assembler FILENAME");
    process.exit(1);
}
var files = (0, Parser_1["default"])();
(0, CodeWriter_1["default"])(files);
