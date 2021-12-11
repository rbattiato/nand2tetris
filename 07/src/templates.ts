/* ASM Templates */

import { basename } from "path";
import {
  ArithmeticLogicalCommand,
  MemoryAccessCommand,
  MemorySegment,
} from "./types";

let comparisonAmount = 0;

/**
 * Handles all the arithmetical/logical evaluations
 */
export function handleArithmeticalLogical(
  type: ArithmeticLogicalCommand
): string[] {
  const instructions: string[] = [];

  // 1. Decrease the stack pointer and bring the referred value in D
  instructions.push(
    "// 1. Decrease the stack pointer and bring the referred value in D"
  );
  instructions.push("@SP", "M=M-1", "A=M", "D=M");

  // 2. If operation requires two operands, decrease sp again
  // and prepare to perform operation
  if (type !== "neg" && type !== "not") {
    instructions.push(
      "// 2. Decrease sp again and prepare to perform operation"
    );
    instructions.push("@SP", "M=M-1", "A=M");
  }

  // 3. Memorize the value in current location
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
      instructions.push(...handleComparison(type));
      break;
  }

  // 4. Increase the stack pointer
  instructions.push("// 4. Increase the stack pointer");
  instructions.push("@SP", "M=M+1");

  return instructions;
}

/**
 * Handles comparison between two values using branching
 */
function handleComparison(type: ArithmeticLogicalCommand): string[] {
  const instructions: string[] = [];
  // To handle a comparison we'll do some branching.
  // First of all, store the difference between the two values
  instructions.push(
    `// To handle the ${type} comparison we'll do some branching.`
  );

  instructions.push("D=M-D", `@${type.toUpperCase()}${comparisonAmount}_TRUE`);
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
  instructions.push(`@${type.toUpperCase()}${comparisonAmount}_END`, "0;JMP");
  instructions.push(`(${type.toUpperCase()}${comparisonAmount}_TRUE)`, "D=-1");
  instructions.push(
    `(${type.toUpperCase()}${comparisonAmount}_END)`,
    "@SP",
    "A=M",
    "M=D"
  );

  comparisonAmount++;

  return instructions;
}

/**
 * Handles pushing from constant virtual memory segment
 */
export function handleConstant(value: number): string[] {
  const instructions: string[] = [`// Pushing constant ${value}`];
  // 1. Memorize value in D register
  instructions.push(`@${value}`, "D=A");
  // 2. Memorize value from D register to stack
  instructions.push("@SP", "A=M", "M=D");
  // 3. Increase stack pointer
  instructions.push("@SP", "M=M+1");

  return instructions;
}

/**
 * Handles pushing/popping with segments: local, argument, this, that, temp
 */
export function handleBasicMemorySegment(
  command: MemoryAccessCommand,
  segment: MemorySegment,
  index: number
): string[] {
  if (command === "push") return pushFromBasicMemorySegment(segment, index);
  return popToBasicMemorySegment(segment, index);
}

/**
 * Handles pushing from segments: local, argument, this, that, temp
 */
function pushFromBasicMemorySegment(
  segment: MemorySegment,
  index: number
): string[] {
  const keyword = getMemorySegmentKeyword(segment);
  const instructions: string[] = [`// Pushing from ${segment} ${index}`];
  // 1. Go to segment-index
  instructions.push(`// Go to ${segment} ${index}`);
  if (segment === "temp") instructions.push(`@${index}`, "D=A", "@5", "A=D+A");
  else instructions.push(`@${index}`, "D=A", `@${keyword}`, "A=D+M");

  // 2. Store value into D register
  instructions.push("// Store value into D register");
  instructions.push("D=M");

  // 3. Push to stack
  instructions.push("// Push to stack");
  instructions.push("@SP", "A=M", "M=D");

  // 4. Increase SP
  instructions.push("@SP", "M=M+1");

  return instructions;
}

/**
 * Handles pushing to segments: local, argument, this, that, temp
 */
function popToBasicMemorySegment(
  segment: MemorySegment,
  index: number
): string[] {
  const keyword = getMemorySegmentKeyword(segment);
  const instructions: string[] = [`// Popping to ${segment} ${index}`];

  // 1. Store segment-index in R13
  instructions.push(`// Store ${segment} ${index} address in R13`);
  if (segment === "temp")
    instructions.push(`@${index}`, "D=A", "@5", "A=D+A", "D=A", "@R13", "M=D");
  else
    instructions.push(
      `@${index}`,
      "D=A",
      `@${keyword}`,
      "A=D+M",
      "D=A",
      "@R13",
      "M=D"
    );

  // 2. Decrease SP and store top stack value in D
  instructions.push("// Decrease SP and store top stack value in D");
  instructions.push("@SP", "M=M-1", "A=M", "D=M");

  // 3. Store D in address that R13 is referring to
  instructions.push("// Store D in address that R13 is referring to");
  instructions.push("@R13", "A=M", "M=D");

  return instructions;
}

function getMemorySegmentKeyword(segment: MemorySegment): string {
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

/**
 * Handles pointer memory segment
 */
export function handlePointerMemorySegment(
  command: MemoryAccessCommand,
  index: number
): string[] {
  const instructions: string[] = [
    `// Pushing/popping from/to pointer ${index}`,
  ];
  const pointed = index ? "THAT" : "THIS";
  if (command === "push") {
    instructions.push(
      `@${pointed}`,
      "D=M",
      "@SP",
      "A=M",
      "M=D",
      "@SP",
      "M=M+1"
    );
  } else {
    instructions.push("@SP", "M=M-1", "A=M", "D=M", `@${pointed}`, "M=D");
  }
  return instructions;
}

/**
 * Handles static memory segment
 */
export function handleStaticMemorySegment(
  command: MemoryAccessCommand,
  index: number
): string[] {
  const prefix = basename(process.argv[2]).split(".")[0];
  const instructions: string[] = [`// Pushing/popping from/to static ${index}`];
  const variable = `${prefix}.${index}`;
  if (command === "push") {
    instructions.push(
      `@${variable}`,
      "D=M",
      "@SP",
      "A=M",
      "M=D",
      "@SP",
      "M=M+1"
    );
  } else {
    instructions.push("@SP", "M=M-1", "A=M", "D=M", `@${variable}`, "M=D");
  }
  return instructions;
}

export function closeProgram(): string {
  return "\n(INFINITE_LOOP)\n@INFINITE_LOOP\n0;JMP";
}
