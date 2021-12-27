"use strict";
exports.__esModule = true;
exports.handleFunctionReturnRestoreCaller = exports.handleFunctionReturnStackChange = exports.handleFunctionReturnVars = exports.handleCallFinal = exports.handleCallArg = exports.handleCallSavePointer = exports.handleCallPushRetAddr = exports.handleFunction = exports.closeProgram = exports.handleStaticMemorySegment = exports.handlePointerMemorySegment = exports.handleBasicMemorySegment = exports.handleConstant = exports.handleArithmeticalLogical = void 0;
var comparisonAmount = 0;
function handleArithmeticalLogical(type) {
    var instructions = [];
    instructions.push("// 1. Decrease the stack pointer and bring the referred value in D");
    instructions.push("@SP", "M=M-1", "A=M", "D=M");
    if (type !== "neg" && type !== "not") {
        instructions.push("// 2. Decrease sp again and prepare to perform operation");
        instructions.push("@SP", "M=M-1", "A=M");
    }
    instructions.push("// 3. Memorize the value in current location");
    switch (type) {
        case "add":
            instructions.push("M=M+D");
            break;
        case "sub":
            instructions.push("M=M-D");
            break;
        case "neg":
            instructions.push("M=-D");
            break;
        case "and":
            instructions.push("M=D&M");
            break;
        case "or":
            instructions.push("M=D|M");
            break;
        case "not":
            instructions.push("M=!D");
            break;
        case "eq":
        case "gt":
        case "lt":
            instructions.push.apply(instructions, handleComparison(type));
            break;
    }
    instructions.push("// 4. Increase the stack pointer");
    instructions.push("@SP", "M=M+1");
    return instructions;
}
exports.handleArithmeticalLogical = handleArithmeticalLogical;
function handleComparison(type) {
    var instructions = [];
    instructions.push("// To handle the ".concat(type, " comparison we'll do some branching."));
    instructions.push("D=M-D", "@".concat(type.toUpperCase()).concat(comparisonAmount, "_TRUE"));
    switch (type) {
        case "eq":
            instructions.push("D;JEQ");
            break;
        case "gt":
            instructions.push("D;JGT");
            break;
        case "lt":
            instructions.push("D;JLT");
            break;
    }
    instructions.push("// If we're here, then it's false", "D=0");
    instructions.push("@".concat(type.toUpperCase()).concat(comparisonAmount, "_END"), "0;JMP");
    instructions.push("(".concat(type.toUpperCase()).concat(comparisonAmount, "_TRUE)"), "D=-1");
    instructions.push("(".concat(type.toUpperCase()).concat(comparisonAmount, "_END)"), "@SP", "A=M", "M=D");
    comparisonAmount++;
    return instructions;
}
function handleConstant(value) {
    var instructions = ["// Pushing constant ".concat(value)];
    instructions.push("@".concat(value), "D=A");
    instructions.push("@SP", "A=M", "M=D");
    instructions.push("@SP", "M=M+1");
    return instructions;
}
exports.handleConstant = handleConstant;
function handleBasicMemorySegment(command, segment, index) {
    if (command === "push")
        return pushFromBasicMemorySegment(segment, index);
    return popToBasicMemorySegment(segment, index);
}
exports.handleBasicMemorySegment = handleBasicMemorySegment;
function pushFromBasicMemorySegment(segment, index) {
    var keyword = getMemorySegmentKeyword(segment);
    var instructions = ["// Pushing from ".concat(segment, " ").concat(index)];
    instructions.push("// Go to ".concat(segment, " ").concat(index));
    if (segment === "temp")
        instructions.push("@".concat(index), "D=A", "@5", "A=D+A");
    else
        instructions.push("@".concat(index), "D=A", "@".concat(keyword), "A=D+M");
    instructions.push("// Store value into D register");
    instructions.push("D=M");
    instructions.push("// Push to stack");
    instructions.push("@SP", "A=M", "M=D");
    instructions.push("@SP", "M=M+1");
    return instructions;
}
function popToBasicMemorySegment(segment, index) {
    var keyword = getMemorySegmentKeyword(segment);
    var instructions = ["// Popping to ".concat(segment, " ").concat(index)];
    instructions.push("// Store ".concat(segment, " ").concat(index, " address in R13"));
    if (segment === "temp")
        instructions.push("@".concat(index), "D=A", "@5", "A=D+A", "D=A", "@R13", "M=D");
    else
        instructions.push("@".concat(index), "D=A", "@".concat(keyword), "A=D+M", "D=A", "@R13", "M=D");
    instructions.push("// Decrease SP and store top stack value in D");
    instructions.push("@SP", "M=M-1", "A=M", "D=M");
    instructions.push("// Store D in address that R13 is referring to");
    instructions.push("@R13", "A=M", "M=D");
    return instructions;
}
function getMemorySegmentKeyword(segment) {
    switch (segment) {
        case "local":
            return "LCL";
        case "argument":
            return "ARG";
        case "this":
            return "THIS";
        case "that":
            return "THAT";
    }
}
function handlePointerMemorySegment(command, index) {
    var instructions = [
        "// Pushing/popping from/to pointer ".concat(index),
    ];
    var pointed = index ? "THAT" : "THIS";
    if (command === "push") {
        instructions.push("@".concat(pointed), "D=M", "@SP", "A=M", "M=D", "@SP", "M=M+1");
    }
    else {
        instructions.push("@SP", "M=M-1", "A=M", "D=M", "@".concat(pointed), "M=D");
    }
    return instructions;
}
exports.handlePointerMemorySegment = handlePointerMemorySegment;
function handleStaticMemorySegment(command, index, prefix) {
    var instructions = ["// Pushing/popping from/to static ".concat(index)];
    var variable = "".concat(prefix, ".").concat(index);
    if (command === "push") {
        instructions.push("@".concat(variable), "D=M", "@SP", "A=M", "M=D", "@SP", "M=M+1");
    }
    else {
        instructions.push("@SP", "M=M-1", "A=M", "D=M", "@".concat(variable), "M=D");
    }
    return instructions;
}
exports.handleStaticMemorySegment = handleStaticMemorySegment;
function closeProgram() {
    return "\n(INFINITE_LOOP)\n@INFINITE_LOOP\n0;JMP";
}
exports.closeProgram = closeProgram;
function handleFunction(functionName, nVars) {
    var instruction = [
        "// Declaring function ".concat(functionName, " with ").concat(nVars, " local variables\n"),
    ];
    instruction.push("(".concat(functionName, ")\n"));
    instruction.push("// If local variables are 0, jump to init end");
    instruction.push("@".concat(nVars), "D=A", "@".concat(functionName, "_INIT_END"), "D;JEQ\n");
    instruction.push("// If we're here we have at least one local var. We have to push 0 n times.");
    instruction.push("(".concat(functionName, "_INIT_START)"));
    instruction.push("@SP", "M=M+1", "A=M-1", "M=0", "D=D-1");
    instruction.push("@".concat(functionName, "_INIT_START"), "D;JNE");
    instruction.push("(".concat(functionName, "_INIT_END)"));
    instruction.push("\n");
    return instruction.join("\n");
}
exports.handleFunction = handleFunction;
function handleCallPushRetAddr(callerFunc, timesCalled) {
    var instructions = [];
    instructions.push("// Push ".concat(callerFunc, " returnAddress"));
    instructions.push("@".concat(callerFunc, "$ret").concat(timesCalled));
    instructions.push("D=A", "@SP", "A=M", "M=D", "@SP", "M=M+1");
    return instructions;
}
exports.handleCallPushRetAddr = handleCallPushRetAddr;
function handleCallSavePointer(pointer) {
    var instructions = ["// Saving ".concat(pointer, "\n")];
    instructions.push("@".concat(pointer));
    instructions.push("D=M", "@SP", "A=M", "M=D", "@SP", "M=M+1");
    return instructions;
}
exports.handleCallSavePointer = handleCallSavePointer;
function handleCallArg(nArgs) {
    var instructions = ["// Moving ARG of SP - 5 - ".concat(nArgs)];
    instructions.push("@".concat(nArgs));
    instructions.push("D=A", "@5", "D=D+A", "@SP", "D=M-D", "@ARG", "M=D");
    return instructions;
}
exports.handleCallArg = handleCallArg;
function handleCallFinal(functionName) {
    var instructions = [];
    instructions.push("// LCL = SP");
    instructions.push("@SP", "D=M", "@LCL", "M=D");
    instructions.push("// goto ".concat(functionName));
    instructions.push("@".concat(functionName), "0;JMP");
    return instructions;
}
exports.handleCallFinal = handleCallFinal;
function handleFunctionReturnVars() {
    var instructions = [];
    instructions.push("// frame = LCL");
    instructions.push("@LCL", "D=M", "@R13", "M=D");
    instructions.push("// retAddr = *(frame - 5)");
    instructions.push("@5", "D=A", "@R13", "A=M-D", "D=M", "@R14", "M=D");
    return instructions;
}
exports.handleFunctionReturnVars = handleFunctionReturnVars;
function handleFunctionReturnStackChange() {
    var instructions = [];
    instructions.push("// *ARG = pop()");
    instructions.push("@SP", "M=M-1", "A=M", "D=M", "@ARG", "A=M", "M=D");
    instructions.push("// SP = ARG + 1");
    instructions.push("@ARG", "D=M+1", "@SP", "M=D");
    return instructions;
}
exports.handleFunctionReturnStackChange = handleFunctionReturnStackChange;
function handleFunctionReturnRestoreCaller() {
    var instructions = [];
    instructions.push.apply(instructions, handleFunctionReturnPointerRestore("THAT", 1));
    instructions.push.apply(instructions, handleFunctionReturnPointerRestore("THIS", 2));
    instructions.push.apply(instructions, handleFunctionReturnPointerRestore("ARG", 3));
    instructions.push.apply(instructions, handleFunctionReturnPointerRestore("LCL", 4));
    instructions.push("// goto retAddr");
    instructions.push("@R14", "A=M", "0;JMP");
    return instructions;
}
exports.handleFunctionReturnRestoreCaller = handleFunctionReturnRestoreCaller;
function handleFunctionReturnPointerRestore(pointer, value) {
    var instructions = ["// ".concat(pointer, " = *(frame - ").concat(value, ")")];
    instructions.push("@".concat(value));
    instructions.push("D=A", "@R13", "A=M-D", "D=M", "@".concat(pointer), "M=D");
    return instructions;
}
