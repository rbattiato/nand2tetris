import {
  ArithmeticLogicalCommand,
  MemoryAccessCommand,
  BranchingCommand,
  FunctionCommand,
  CommandType,
} from "./types";

export const arithmeticLogicalCommands: ArithmeticLogicalCommand[] = [
  "add",
  "sub",
  "neg",
  "eq",
  "gt",
  "lt",
  "and",
  "or",
  "not",
];

export const memoryAccessCommands: MemoryAccessCommand[] = ["push", "pop"];

export const branchingCommands: BranchingCommand[] = [
  "label",
  "goto",
  "if-goto",
];

export const functionCommands: FunctionCommand[] = [
  "function",
  "call",
  "return",
];

export const twoArgumentsCommands: CommandType[] = [
  "C_PUSH",
  "C_POP",
  "C_FUNCTION",
  "C_CALL",
];
