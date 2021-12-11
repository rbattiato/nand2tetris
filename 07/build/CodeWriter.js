"use strict";
exports.__esModule = true;
var fs_1 = require("fs");
var templates_1 = require("./templates");
function writeArithmetic(command) {
    var instruction = ["// Performing ".concat(command, " operation\n")];
    instruction.push.apply(instruction, (0, templates_1.handleArithmeticalLogical)(command));
    return instruction.join("\n");
}
function writePushPop(command, segment, index) {
    var instruction = ["// Performing ".concat(command, " from/to ").concat(segment, " ").concat(index)];
    switch (segment) {
        case "constant":
            instruction.push.apply(instruction, (0, templates_1.handleConstant)(index));
            break;
        case "pointer":
            instruction.push.apply(instruction, (0, templates_1.handlePointerMemorySegment)(command, index));
            break;
        case "static":
            instruction.push.apply(instruction, (0, templates_1.handleStaticMemorySegment)(command, index));
            break;
        default:
            instruction.push.apply(instruction, (0, templates_1.handleBasicMemorySegment)(command, segment, index));
    }
    return instruction.join("\n");
}
function default_1(lines) {
    var content = lines
        .map(function (line) {
        switch (line.type) {
            case "C_ARITHMETIC":
                return writeArithmetic(line.arg1);
            case "C_PUSH":
                return writePushPop("push", line.arg1, line.arg2);
            case "C_POP":
                return writePushPop("pop", line.arg1, line.arg2);
            default:
                return "";
        }
    })
        .join("\n");
    content += (0, templates_1.closeProgram)();
    var filename = process.argv[2];
    var outputFileName = filename.replace(".vm", ".asm");
    (0, fs_1.writeFile)(outputFileName, content, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log("All done!");
    });
}
exports["default"] = default_1;
