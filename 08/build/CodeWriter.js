"use strict";
exports.__esModule = true;
exports.writeBootstrap = void 0;
var fs_1 = require("fs");
var path_1 = require("path");
var templates_1 = require("./templates");
var callStack = ["Sys.init"];
function writeBootstrap() {
    var instructions = [];
    instructions.push("// Set SP to 256");
    instructions.push("@256", "D=A", "@SP", "M=D", "\n");
    instructions.push("// call Sys.init");
    instructions.push(writeCall("Sys.init", 0));
    return instructions.join("\n");
}
exports.writeBootstrap = writeBootstrap;
function writeArithmetic(command) {
    var instruction = ["// Performing ".concat(command, " operation\n")];
    instruction.push.apply(instruction, (0, templates_1.handleArithmeticalLogical)(command));
    instruction.push("\n");
    return instruction.join("\n");
}
function writePushPop(command, segment, index, filename) {
    var instruction = ["// Performing ".concat(command, " from/to ").concat(segment, " ").concat(index)];
    switch (segment) {
        case "constant":
            instruction.push.apply(instruction, (0, templates_1.handleConstant)(index));
            break;
        case "pointer":
            instruction.push.apply(instruction, (0, templates_1.handlePointerMemorySegment)(command, index));
            break;
        case "static":
            instruction.push.apply(instruction, (0, templates_1.handleStaticMemorySegment)(command, index, filename));
            break;
        default:
            instruction.push.apply(instruction, (0, templates_1.handleBasicMemorySegment)(command, segment, index));
    }
    instruction.push("\n");
    return instruction.join("\n");
}
function writeLabel(label) {
    var instruction = ["// Applying label: ".concat(label, "\n")];
    instruction.push("(".concat(label, ")"));
    instruction.push("\n");
    return instruction.join("\n");
}
function writeGoto(label) {
    var instruction = ["// Unconditionally going to label: ".concat(label, "\n")];
    instruction.push("@".concat(label), "0;JMP");
    instruction.push("\n");
    return instruction.join("\n");
}
function writeIf(label) {
    var instruction = ["// Conditionally going to label: ".concat(label, "\n")];
    instruction.push("@SP", "M=M-1", "A=M");
    instruction.push("D=M");
    instruction.push("@".concat(label));
    instruction.push("D;JNE");
    instruction.push("\n");
    return instruction.join("\n");
}
function writeFunction(functionName, nVars) {
    return (0, templates_1.handleFunction)(functionName, nVars);
}
function writeCall(functionName, nVars) {
    var instruction = [
        "// Calling function ".concat(functionName, " passing ").concat(nVars, " arguments\n"),
    ];
    var callingFunction = "";
    var timesCalled = 0;
    if (callStack.length > 0) {
        callingFunction = callStack[callStack.length - 1];
        timesCalled = callStack.reduce(function (count, curr) { return (curr === callingFunction ? count + 1 : count); }, 0);
    }
    callStack.push(functionName);
    if (callingFunction)
        instruction.push.apply(instruction, (0, templates_1.handleCallPushRetAddr)(callingFunction, timesCalled));
    instruction.push.apply(instruction, (0, templates_1.handleCallSavePointer)("LCL"));
    instruction.push.apply(instruction, (0, templates_1.handleCallSavePointer)("ARG"));
    instruction.push.apply(instruction, (0, templates_1.handleCallSavePointer)("THIS"));
    instruction.push.apply(instruction, (0, templates_1.handleCallSavePointer)("THAT"));
    instruction.push.apply(instruction, (0, templates_1.handleCallArg)(nVars));
    instruction.push.apply(instruction, (0, templates_1.handleCallFinal)(functionName));
    if (callingFunction) {
        instruction.push("// Return label for ".concat(callingFunction));
        instruction.push("(".concat(callingFunction, "$ret").concat(timesCalled, ")"));
    }
    instruction.push("\n");
    return instruction.join("\n");
}
function writeReturn() {
    var instruction = ["// Function end, return\n"];
    instruction.push.apply(instruction, (0, templates_1.handleFunctionReturnVars)());
    instruction.push.apply(instruction, (0, templates_1.handleFunctionReturnStackChange)());
    instruction.push.apply(instruction, (0, templates_1.handleFunctionReturnRestoreCaller)());
    instruction.push("\n");
    return instruction.join("\n");
}
function default_1(files) {
    var translatedContents = files.map(function (file) {
        return file.lines
            .map(function (line) {
            switch (line.type) {
                case "C_ARITHMETIC":
                    return writeArithmetic(line.arg1);
                case "C_PUSH":
                    return writePushPop("push", line.arg1, line.arg2, file.name);
                case "C_POP":
                    return writePushPop("pop", line.arg1, line.arg2, file.name);
                case "C_LABEL":
                    return writeLabel(line.arg1);
                case "C_GOTO":
                    return writeGoto(line.arg1);
                case "C_IF":
                    return writeIf(line.arg1);
                case "C_FUNCTION":
                    return writeFunction(line.arg1, line.arg2);
                case "C_CALL":
                    return writeCall(line.arg1, line.arg2);
                case "C_RETURN":
                    return writeReturn();
                default:
                    return "";
            }
        })
            .join("\n");
    });
    var content = "";
    var filename = process.argv[2];
    var outputFileName;
    if (filename.includes(".vm")) {
        outputFileName = filename.replace(".vm", ".asm");
    }
    else {
        content += writeBootstrap();
        outputFileName = filename;
        if (filename[filename.length - 1] !== path_1.sep)
            outputFileName += path_1.sep;
        var folders = filename.split(path_1.sep);
        if (!folders[folders.length - 1])
            folders.pop();
        outputFileName += folders[folders.length - 1] + ".asm";
    }
    content += translatedContents.join("\n// End of file\n");
    (0, fs_1.writeFile)(outputFileName, content, function (err) {
        if (err) {
            console.error(err);
            return;
        }
        console.log("All done!");
    });
}
exports["default"] = default_1;
