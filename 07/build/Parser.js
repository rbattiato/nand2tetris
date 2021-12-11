"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var commands_1 = require("./commands");
var utils_1 = require("./utils");
function read(filename) {
    return (0, fs_1.readFileSync)(filename)
        .toString()
        .replace(/\r\n/g, "\n")
        .split("\n")
        .filter(function (line) { return !(0, utils_1.isWhitespace)(line); });
}
function commandType(line) {
    var command = line.split(" ")[0];
    if (commands_1.memoryAccessCommands.includes(command)) {
        switch (command) {
            case "push":
                return "C_PUSH";
            case "pop":
                return "C_POP";
        }
    }
    else if (commands_1.arithmeticLogicalCommands.includes(command))
        return "C_ARITHMETIC";
    return "C_ARITHMETIC";
}
function arg1(line, type) {
    var _a = line.split(" "), command = _a[0], arg1 = _a[1];
    if (type === "C_ARITHMETIC")
        return command;
    return arg1;
}
function arg2(line, type) {
    var _a = line.split(" "), command = _a[0], arg1 = _a[1], arg2 = _a[2];
    return parseInt(arg2);
}
function parse(line) {
    var parsedLine = {
        value: line,
        arg1: "",
        type: commandType(line)
    };
    if (parsedLine.type !== "C_RETURN")
        parsedLine.arg1 = arg1(line, parsedLine.type);
    if (commands_1.twoArgumentsCommands.includes(parsedLine.type))
        parsedLine.arg2 = arg2(line, parsedLine.type);
    return parsedLine;
}
function default_1() {
    var filename = process.argv[2];
    console.log("About to parse file:", filename);
    var lines = read(filename);
    return lines.map(function (line) { return parse(line); });
}
exports["default"] = default_1;
