export type CommandType =
  | "C_ARITHMETIC"
  | "C_PUSH"
  | "C_POP"
  | "C_LABEL"
  | "C_GOTO"
  | "C_IF"
  | "C_FUNCTION"
  | "C_RETURN"
  | "C_CALL";

export type ArithmeticLogicalCommand =
  | "add"
  | "sub"
  | "neg"
  | "eq"
  | "gt"
  | "lt"
  | "and"
  | "or"
  | "not";

export type PushPopCommand = "C_PUSH" | "C_POP";

export type MemoryAccessCommand = "push" | "pop";

export type BranchingCommand = "label" | "goto" | "if-goto";

export type FunctionCommand = "function" | "call" | "return";

export type MemorySegment =
  | "argument"
  | "local"
  | "static"
  | "constant"
  | "this"
  | "that"
  | "pointer"
  | "temp";

export interface ParsedLine {
  value: string;
  arg1: string;
  arg2?: number;
  type: CommandType;
}

export interface File {
  name: string;
  lines: string[];
}

export interface ParsedFile {
  name: string;
  lines: ParsedLine[];
}
