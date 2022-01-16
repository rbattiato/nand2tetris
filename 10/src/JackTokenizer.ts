/**
 * Jack Tokenizer
 * This module reads a string representing a single Jack
 * source file, removes any comment.
 */

import { keywords, symbols } from "./tokens";
import { Keyword, TokenType } from "./types";

export class JackTokenizer {
  file: string; // A single Jack source file represented by a string
  charIndex: number; // Tracks the progress of the file string reading
  currentToken: string; // The actual token

  /**
   * Initializes the Tokenizer to the given stream of chars
   * and prepares to tokenize it.
   */
  constructor(file: string) {
    this.file = cleanFile(file);
    this.charIndex = -1;
    this.currentToken = "";
  }

  /**
   * Are there more tokens in the input?
   */
  hasMoreTokens(): boolean {
    return this.charIndex < this.file.length;
  }

  /**
   * Gets the next token from the input, and makes it
   * the current token.
   */
  advance(): void {
    /* A program is just a flow of characters separated by whitespace
      and symbols. Our job is to isolate such groups */
    let currentChar = "";
    let nextChar = "";
    this.currentToken = "";

    // 1. Increase counter until we reach a valid char
    do {
      this.charIndex++;
    } while (isCharEmpty(this.file.charAt(this.charIndex)));

    currentChar = this.file.charAt(this.charIndex);

    // 2. If it's a symbol, set the current token
    if (symbols.includes(currentChar)) {
      this.currentToken = currentChar;
      return;
    }

    // 3. If it's a double quote, build a string token
    if (currentChar === '"') {
      this.buildString();
      return;
    }

    // 4. For all the other cases, build the token until we reach
    // symbol/whitespace
    this.currentToken += currentChar;
    nextChar = this.file.charAt(this.charIndex + 1);
    while (nextChar && !isCharSeparator(nextChar)) {
      this.charIndex++;
      currentChar = this.file.charAt(this.charIndex);
      this.currentToken += currentChar;

      nextChar = this.file.charAt(this.charIndex + 1);
    }
  }

  /**
   * Returns the type of the current token, as a constant.
   */
  tokenType(): TokenType {
    if (keywords.includes(this.currentToken)) return "KEYWORD";
    else if (symbols.includes(this.currentToken)) return "SYMBOL";
    else if (isIntegerConstant(this.currentToken)) return "INT_CONST";
    else if (isStringConstant(this.currentToken)) return "STRING_CONST";
    return "IDENTIFIER";
  }

  /**
   * Returns the actual name of the given token type.
   */
  getTokenName(): string {
    const type = this.tokenType();
    switch (type) {
      case "INT_CONST":
        return "integerConstant";
      case "STRING_CONST":
        return "stringConstant";
      default:
        return type.toLowerCase();
    }
  }

  /**
   * Returns the keyword which is the current token, as
   * a constant.
   */
  keyWord(): Keyword {
    return getKeyword(this.currentToken);
  }

  /**
   * Returns the character which is the current token.
   */
  symbol(): string {
    return this.currentToken;
  }

  /**
   * Returns the string which is the current token.
   */
  identifier(): string {
    return this.currentToken;
  }

  /**
   * Returns the integer value of the current token.
   */
  intVal(): number {
    return parseInt(this.currentToken);
  }

  /**
   * Returns the string value of the current token, without
   * the opening and closing double quotes.
   */
  stringVal(): string {
    return this.currentToken.replace(/"/g, "");
  }

  /**
   * Builds the current token until a double quote is found.
   */
  buildString(): void {
    let currentChar = this.file.charAt(this.charIndex);
    do {
      this.currentToken += currentChar;
      this.charIndex++;
      currentChar = this.file.charAt(this.charIndex);
    } while (currentChar !== '"');

    this.currentToken += currentChar; // add final double quote
  }
}

function cleanFile(file: string): string {
  // 1. Initialize output
  let output = "";
  // 2. Remove comments
  // Credits: https://stackoverflow.com/a/15123777
  output = file.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, "");

  return output;
}

function isIntegerConstant(token: string): boolean {
  const value = parseInt(token);
  return !Number.isNaN(value);
}

function isStringConstant(token: string): boolean {
  return token.charAt(0) === '"' && token.charAt(token.length - 1) === '"';
}

function isCharEmpty(char: string): boolean {
  return char === " " || char === "\t" || char === "\n" || char === "\r";
}

function isCharSeparator(char: string): boolean {
  if (isCharEmpty(char)) return true;
  if (symbols.includes(char)) return true; // is symbol
  return false;
}

function getKeyword(token: string): Keyword {
  switch (token) {
    case "class":
      return "CLASS";
    case "method":
      return "METHOD";
    case "function":
      return "FUNCTION";
    case "constructor":
      return "CONSTRUCTOR";
    case "int":
      return "INT";
    case "boolean":
      return "BOOLEAN";
    case "char":
      return "CHAR";
    case "void":
      return "VOID";
    case "var":
      return "VAR";
    case "static":
      return "STATIC";
    case "field":
      return "FIELD";
    case "let":
      return "LET";
    case "do":
      return "DO";
    case "if":
      return "IF";
    case "else":
      return "ELSE";
    case "while":
      return "WHILE";
    case "return":
      return "RETURN";
    case "true":
      return "TRUE";
    case "false":
      return "FALSE";
    case "null":
      return "NULL";
    case "this":
      return "THIS";
  }
}
