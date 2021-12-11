import { writeFile } from "fs";
import {
  ParsedLine,
  ArithmeticLogicalCommand,
  MemorySegment,
  MemoryAccessCommand,
} from "./types";
import {
  handleArithmeticalLogical,
  handleConstant,
  closeProgram,
  handleBasicMemorySegment,
  handlePointerMemorySegment,
  handleStaticMemorySegment,
} from "./templates";

/**
 * writeArithmetic
 *
 * Writes to the output file the assembly code that implements the given
 * arithmetic-logical command.
 */
function writeArithmetic(command: ArithmeticLogicalCommand): string {
  const instruction = [`// Performing ${command} operation\n`];
  instruction.push(...handleArithmeticalLogical(command));
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
  index: number
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
      instruction.push(...handleStaticMemorySegment(command, index));
      break;
    default:
      instruction.push(...handleBasicMemorySegment(command, segment, index));
  }
  return instruction.join("\n");
}

/**
 * Initializer
 *
 * Writes into the output file.
 */
export default function (lines: ParsedLine[]) {
  let content = lines
    .map((line) => {
      switch (line.type) {
        case "C_ARITHMETIC":
          return writeArithmetic(line.arg1 as ArithmeticLogicalCommand);
        case "C_PUSH":
          return writePushPop("push", line.arg1 as MemorySegment, line.arg2);
        case "C_POP":
          return writePushPop("pop", line.arg1 as MemorySegment, line.arg2);
        default:
          return "";
      }
    })
    .join("\n");

  content += closeProgram();

  const filename = process.argv[2];
  const outputFileName = filename.replace(".vm", ".asm");

  writeFile(outputFileName, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("All done!");
  });
}
