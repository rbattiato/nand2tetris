import { writeFile } from "fs";
import { sep } from "path";
import {
  ParsedFile,
  ArithmeticLogicalCommand,
  MemorySegment,
  MemoryAccessCommand,
} from "./types";
import {
  handleArithmeticalLogical,
  handleConstant,
  handleBasicMemorySegment,
  handlePointerMemorySegment,
  handleStaticMemorySegment,
  handleFunction,
  handleCallPushRetAddr,
  handleCallSavePointer,
  handleCallArg,
  handleCallFinal,
  handleFunctionReturnVars,
  handleFunctionReturnStackChange,
  handleFunctionReturnRestoreCaller,
} from "./templates";

/**
 * callStack
 *
 * Counts how many times functions are called in order to put labels correctly
 */
const callStack: string[] = ["Sys.init"];

export function writeBootstrap(): string {
  const instructions: string[] = [];
  // Set SP to 256
  instructions.push("// Set SP to 256");
  instructions.push("@256", "D=A", "@SP", "M=D", "\n");
  instructions.push("// call Sys.init");
  instructions.push(writeCall("Sys.init", 0));
  return instructions.join("\n");
}

/**
 * writeArithmetic
 *
 * Writes to the output file the assembly code that implements the given
 * arithmetic-logical command.
 */
function writeArithmetic(command: ArithmeticLogicalCommand): string {
  const instruction = [`// Performing ${command} operation\n`];
  instruction.push(...handleArithmeticalLogical(command));
  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * writePushPop
 *
 * Writes to the output file the assembly code that implements the given
 * push or pop command.
 */
function writePushPop(
  command: MemoryAccessCommand,
  segment: MemorySegment,
  index: number,
  filename: string
): string {
  const instruction = [`// Performing ${command} from/to ${segment} ${index}`];
  switch (segment) {
    case "constant":
      instruction.push(...handleConstant(index));
      break;
    case "pointer":
      instruction.push(...handlePointerMemorySegment(command, index));
      break;
    case "static":
      instruction.push(...handleStaticMemorySegment(command, index, filename));
      break;
    default:
      instruction.push(...handleBasicMemorySegment(command, segment, index));
  }
  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * writeLabel
 *
 * Writes assembly code that effects the label command.
 */
function writeLabel(label: string): string {
  const instruction = [`// Applying label: ${label}\n`];
  instruction.push(`(${label})`);
  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * writeGoto
 *
 * Writes assembly code that effects the goto command.
 */
function writeGoto(label: string): string {
  const instruction = [`// Unconditionally going to label: ${label}\n`];
  instruction.push(`@${label}`, "0;JMP");
  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * writeIf
 *
 * Writes assembly code that effects the if-goto command.
 */
function writeIf(label: string): string {
  const instruction = [`// Conditionally going to label: ${label}\n`];
  // We should expect to have true (-1) or false (0) on the stack.

  // 1. Go to top stack and consume the value
  instruction.push("@SP", "M=M-1", "A=M");

  // 2. Store value into D register
  instruction.push("D=M");

  // 3. Set A register to label address
  instruction.push(`@${label}`);

  // 4. If D register is not 0 (false) jump
  instruction.push("D;JNE");

  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * writeFunction
 *
 * Writes assembly code that effects the function command.
 */
function writeFunction(functionName: string, nVars: number): string {
  return handleFunction(functionName, nVars);
}

/**
 * writeCall
 *
 * Writes assembly code that effects the call command.
 */
function writeCall(functionName: string, nVars: number): string {
  const instruction = [
    `// Calling function ${functionName} passing ${nVars} arguments\n`,
  ];
  let callingFunction = "";
  let timesCalled = 0;
  if (callStack.length > 0) {
    callingFunction = callStack[callStack.length - 1];
    timesCalled = callStack.reduce(
      (count, curr) => (curr === callingFunction ? count + 1 : count),
      0
    );
  }
  callStack.push(functionName);
  if (callingFunction)
    instruction.push(...handleCallPushRetAddr(callingFunction, timesCalled));
  instruction.push(...handleCallSavePointer("LCL"));
  instruction.push(...handleCallSavePointer("ARG"));
  instruction.push(...handleCallSavePointer("THIS"));
  instruction.push(...handleCallSavePointer("THAT"));
  instruction.push(...handleCallArg(nVars));
  instruction.push(...handleCallFinal(functionName));
  if (callingFunction) {
    instruction.push(`// Return label for ${callingFunction}`);
    instruction.push(`(${callingFunction}$ret${timesCalled})`);
  }
  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * writeReturn
 *
 * Writes assembly code that effects the return command.
 */
function writeReturn(): string {
  const instruction = [`// Function end, return\n`];
  instruction.push(...handleFunctionReturnVars());
  instruction.push(...handleFunctionReturnStackChange());
  instruction.push(...handleFunctionReturnRestoreCaller());
  instruction.push("\n");
  return instruction.join("\n");
}

/**
 * Initializer
 *
 * Writes into the output file.
 */
export default function (files: ParsedFile[]) {
  const translatedContents = files.map((file) =>
    file.lines
      .map((line) => {
        switch (line.type) {
          case "C_ARITHMETIC":
            return writeArithmetic(line.arg1 as ArithmeticLogicalCommand);
          case "C_PUSH":
            return writePushPop(
              "push",
              line.arg1 as MemorySegment,
              line.arg2,
              file.name
            );
          case "C_POP":
            return writePushPop(
              "pop",
              line.arg1 as MemorySegment,
              line.arg2,
              file.name
            );
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
      .join("\n")
  );

  let content = "";

  const filename = process.argv[2];
  let outputFileName;
  if (filename.includes(".vm")) {
    // We're translating a single file: no bootstrap code is needed.
    outputFileName = filename.replace(".vm", ".asm");
  } else {
    // We're translating an entire folder, so bootstrap code is needed.
    content += writeBootstrap();

    // Get correct asm file name
    outputFileName = filename;
    if (filename[filename.length - 1] !== sep) outputFileName += sep;
    const folders = filename.split(sep);
    if (!folders[folders.length - 1]) folders.pop();
    outputFileName += folders[folders.length - 1] + ".asm";
  }

  content += translatedContents.join("\n// End of file\n");

  writeFile(outputFileName, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("All done!");
  });
}
