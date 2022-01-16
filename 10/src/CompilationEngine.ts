/**
 * CompilationEngine
 * This module reads an array of tokens (as specified by
 * the Jack grammar) and outputs an object ready to be
 * printed as XML by the main module.
 */

import { XMLBuilder } from "xmlbuilder2/lib/interfaces";
import { JackTokenizer } from "./JackTokenizer";
import { operators } from "./tokens";

export class CompilationEngine {
  input: JackTokenizer; // a tokenizer object holding an input file
  output: XMLBuilder; // a XML Builder object representing the XML file

  /** Creates a new compilation engine with the given
   * input and output. The input is a tokenizer object
   * while the output is a XML Builder object.
   */
  constructor(input: JackTokenizer, output: XMLBuilder) {
    this.input = input;
    this.output = output;
  }

  /** Compiles a complete class */
  compileClass(): void {
    /* The first advance has to be done manually since this is
    our entry point method. */
    this.input.advance();

    /* Begin wrapping */
    this.output = this.output.ele("class");

    /* 'class' className '{' */
    this.compileUntil("{");

    /* classVarDec* */
    while (["static", "field"].includes(this.input.currentToken)) {
      this.compileClassVarDec();
    }

    /* subroutineDec* */
    while (
      ["constructor", "function", "method"].includes(this.input.currentToken)
    ) {
      this.compileSubroutine();
    }

    /* '}' */
    this.compile();

    this.output = this.output.up();
  }

  /** Compiles a static variable declaration, or a field
   * declaration.
   */
  compileClassVarDec(): void {
    this.output = this.output.ele("classVarDec");

    this.compileUntil(";");

    this.output = this.output.up();
  }

  /** Compiles a complete method, function, or constructor. */
  compileSubroutine(): void {
    this.output = this.output.ele("subroutineDec");

    /* ('constructor' | 'function' | 'method') ('void' | type) ...
    ... subroutineName '(' */
    this.compileUntil("(");

    /* parameterList */
    this.compileParameterList();

    /* ')' */
    this.compile();

    /* subroutineBody */
    this.compileSubroutineBody();

    this.output = this.output.up();
  }

  /** Compiles a (possibly empty) parameter list. Does not
   * handle the enclosing parentheses tokens ( and ).
   */
  compileParameterList(): void {
    this.output = this.output.ele("parameterList");

    if (this.input.currentToken !== ")") {
      /* We'll exclude our delimiter ')' since it is
      not to be included into the parameterList */
      this.compileUntil(")", true);
    }

    this.output = this.output.up();
  }

  /** Compiles a subroutine's body */
  compileSubroutineBody(): void {
    this.output = this.output.ele("subroutineBody");

    /* '{' */
    this.compile();

    /* varDec* */
    while (this.input.currentToken === "var") {
      this.compileVarDec();
    }

    /* statements */
    this.compileStatements();

    /* '}' */
    this.compile();

    this.output = this.output.up();
  }

  /** Compiles a var declaration. */
  compileVarDec(): void {
    this.output = this.output.ele("varDec");

    /* var...; */
    this.compileUntil(";");

    this.output = this.output.up();
  }

  /** Compiles a sequence of statements. Does not handle
   * the enclosing curly bracket tokens { and }.
   */
  compileStatements(): void {
    this.output = this.output.ele("statements");

    /* statement* */
    while (
      ["let", "if", "while", "do", "return"].includes(this.input.currentToken)
    ) {
      switch (this.input.currentToken) {
        case "let":
          this.compileLet();
          break;
        case "if":
          this.compileIf();
          break;
        case "while":
          this.compileWhile();
          break;
        case "do":
          this.compileDo();
          break;
        case "return":
          this.compileReturn();
          break;
      }
    }

    this.output = this.output.up();
  }

  /** Compiles a let statement. */
  compileLet(): void {
    this.output = this.output.ele("letStatement");

    /* let */
    this.compile();

    /* varName */
    this.compile();

    /* ('[' expression ']')? */
    if (this.input.currentToken === "[") {
      /* '[' */
      this.compile();

      /* expression */
      this.compileExpression();
    }

    this.compileUntil("=");

    /* expression */
    this.compileExpression();

    /* ; */
    this.compile();

    this.output = this.output.up();
  }

  /** Compiles an if statement, possibly with a trailing
   * else clause.
   */
  compileIf(): void {
    this.output = this.output.ele("ifStatement");

    /* 'if' '(' */
    this.compileUntil("(");

    /* expression */
    this.compileExpression();

    /* ')' '{' */
    this.compileUntil("{");

    /* statements */
    this.compileStatements();

    /* '}' */
    this.compile();

    /* 'else' */
    if (this.input.currentToken === "else") {
      /* 'else' '{' */
      this.compileUntil("{");

      /* statements */
      this.compileStatements();

      /* '} */
      this.compile();
    }

    this.output = this.output.up();
  }

  /** Compiles a while statement. */
  compileWhile(): void {
    this.output = this.output.ele("whileStatement");

    /* 'while' '(' */
    this.compileUntil("(");

    /* expression */
    this.compileExpression();

    /* ')' '{' */
    this.compileUntil("{");

    /* statements */
    this.compileStatements();

    /* '}' */
    this.compile();

    this.output = this.output.up();
  }

  /** Compiles a do statement. */
  compileDo(): void {
    this.output = this.output.ele("doStatement");

    /* 'do' subroutineName '(' */
    this.compileUntil("(");

    /* expressionList */
    this.compileExpressionList();

    /* ')' ; */
    this.compileUntil(";");

    this.output = this.output.up();
  }

  /** Compiles a return statement. */
  compileReturn(): void {
    this.output = this.output.ele("returnStatement");

    /* 'return' */
    this.compile();

    /* expression? */
    if (this.input.currentToken !== ";") {
      this.compileExpression();
    }

    /* ';' */
    this.compile();

    this.output = this.output.up();
  }

  /** Compiles an expression. */
  compileExpression(): void {
    this.output = this.output.ele("expression");

    /* term */
    this.compileTerm();

    /* (op term)* */
    if (operators.includes(this.input.currentToken)) {
      /* op */
      this.compile();

      /* term */
      this.compileTerm();
    }

    this.output = this.output.up();
  }

  /** Compiles a term. */
  compileTerm(): void {
    this.output = this.output.ele("term");

    /* (unaryOp term) */
    if (["-", "~"].includes(this.input.currentToken)) {
      /* unaryOp */
      this.compile();

      /* term */
      this.compileTerm();
    } else if (this.input.currentToken === "(") {
      // '(' expression ')'
      /* '(' */
      this.compile();

      /* expression */
      this.compileExpression();

      /* ')' */
      this.compile();
    } else if (this.input.tokenType() === "STRING_CONST") {
      /* We manually insert string constant */
      this.output = this.output
        .ele(this.input.getTokenName())
        .txt(` ${this.input.stringVal()} `)
        .up();
      this.input.advance();
    } else {
      /* At this point we're 100% sure we have either an
      identifier or a constant. Here we need to look ahead
      to the next token to understand were the current term
      actually ends */

      /* identifier */
      this.compile();

      if (this.input.currentToken === "[") {
        /* '[' expression ']' */
        /* '[' */
        this.compile();

        /* expression */
        this.compileExpression();

        /* ']' */
        this.compile();
      } else if (this.input.currentToken === "(") {
        /* subroutineName '(' expressionList ')' */

        /* '(' */
        this.compile();

        /* expressionList */
        this.compileExpressionList();

        /* ')' */
        this.compile();
      } else if (this.input.currentToken === ".") {
        /* (className | varName)'.'subroutineName'('expressionList')' */
        /* '.'subroutineName'('*/
        this.compileUntil("(");

        /* expressionList */
        this.compileExpressionList();

        /* ')' */
        this.compile();
      }
    }

    this.output = this.output.up();
  }

  /** Compiles a (possibly empty) comma-separated list of
   * expressions.
   */
  compileExpressionList(): void {
    this.output = this.output.ele("expressionList");

    if (this.input.currentToken !== ")") {
      do {
        if (this.input.currentToken === ",") {
          this.compile();
        }
        this.compileExpression();
      } while (this.input.currentToken === ",");
    }

    this.output = this.output.up();
  }

  /** Writes terminals until a end token is encountered */
  compileUntil(endToken: string, excludeEnd = false): void {
    while (this.input.currentToken !== endToken) {
      this.compile();
    }

    if (!excludeEnd) {
      /* Add end token */
      this.compile();
    }
  }

  /* Writes terminal XML node and leaves
  tokenizer ready for next operation, if possible */
  compile() {
    this.output = this.output
      .ele(this.input.getTokenName())
      .txt(` ${this.input.currentToken} `);
    this.output = this.output.up();

    if (this.input.hasMoreTokens()) {
      this.input.advance();
    }
  }
}
