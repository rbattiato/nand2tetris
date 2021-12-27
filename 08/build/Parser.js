"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var path_1 = require("path");
var commands_1 = require("./commands");
var utils_1 = require("./utils");
function read(filename) {
    var paths = [];
    if (filename.indexOf(".vm") !== -1) {
        paths.push(filename);
    }
    else {
        paths = (0, fs_1.readdirSync)(filename)
            .filter(function (name) { return name.includes(".vm"); })
            .map(function (name) {
            if (filename[filename.length - 1] === path_1.sep)
                return filename + name;
            return filename + path_1.sep + name;
        });
    }
    return paths.map(function (path) {
        var splitPath = path.split(path_1.sep);
        var cleanFileName = "";
        if (splitPath[splitPath.length - 1]) {
            cleanFileName = splitPath[splitPath.length - 1];
        }
        else {
            cleanFileName = splitPath[splitPath.length - 2];
        }
        console.log("About to read file...", cleanFileName);
        return {
            name: cleanFileName,
            lines: (0, fs_1.readFileSync)(path)
                .toString()
                .replace(/\r\n/g, "\n")
                .split("\n")
                .filter(function (line) { return !(0, utils_1.isWhitespace)(line); })
        };
    });
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
    else if (commands_1.branchingCommands.includes(command)) {
        switch (command) {
            case "label":
                return "C_LABEL";
            case "goto":
                return "C_GOTO";
            case "if-goto":
                return "C_IF";
        }
    }
    else if (commands_1.functionCommands.includes(command)) {
        switch (command) {
            case "function":
                return "C_FUNCTION";
            case "call":
                return "C_CALL";
            case "return":
                return "C_RETURN";
        }
    }
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
    var files = read(filename);
    return files.map(function (file) { return ({
        name: file.name,
        lines: file.lines.map(function (line) { return parse(line); })
    }); });
}
exports["default"] = default_1;
