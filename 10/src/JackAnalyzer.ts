/**
 * Jack Analyzer
 * A tool that parses Jack language files from the Nand2Tetris course,
 * emitting one or more XML files representing the parsing tree of the
 * given program.
 *
 * It:
 *
 * 1. Reads a folder containing a Jack program, or a single Jack source
 * file. Proceeds then to strip whitespace and comments off each file,
 * turning it into a string.
 *
 * 2. Feeds each stringified file to the JackTokenizer and collects its
 * output, an array of tokens.
 *
 * 3. Feeds each array of tokens to the CompilationEngine, collects
 * its output, and writes a XML file for each CompilationEngine output.
 */

import { CompilationEngine } from "./CompilationEngine";
import { JackTokenizer } from "./JackTokenizer";

const fs = require("fs");
const path = require("path");
const xml = require("xmlbuilder2");

class JackAnalyzer {
  arg: string; // File or folder path to analyze
  options: string; // Analyzer options (currently only -t supported)
  paths: string[]; // Paths of all of the files (or single file) specified by arg
  files: string[]; // The .jack files to analyze, as strings
  onlyTokens: boolean; // If the -t option is specified, program will only print tokens.

  constructor() {
    this.arg = process.argv[2];
    this.options = process.argv[3];
    this.paths = [];
    this.files = [];
    this.onlyTokens = this.options === "-t";
  }

  /** Reads the path specified in command line arg and reads the given
   * folder, if it's a folder.
   */
  getPathsFromArg(): void {
    if (this.arg.indexOf(".jack") !== -1) {
      this.paths.push(this.arg); // We're processing a single file
    } else {
      /* We're processing a folder, file by file */
      this.paths = fs
        .readdirSync(this.arg)
        .filter((filename: string) => filename.includes(".jack"))
        .map((filename: string) => {
          if (this.arg[this.arg.length - 1] === path.sep) {
            return this.arg + filename;
          }
          return this.arg + path.sep + filename;
        });
    }
  }

  /** Reads the contents of the specified file(s) and converts them to text
   * inside the files array
   */
  readPaths(): void {
    this.paths.forEach((path) => {
      const data = fs.readFileSync(path, { encoding: "utf8", flag: "r" });
      this.files.push(data);
    });
  }

  /** Invokes the tokenizer, the compilation engine, and prints XML
   */
  analyze(): void {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      const tokenizer = new JackTokenizer(file);
      const xmlDoc = xml.create();
      const destPath = this.paths[i].replace(".jack", ".xml");
      const engine = new CompilationEngine(tokenizer, xmlDoc);

      engine.compileClass(); // Actual compilation happens here

      /* Write file */
      let textContent = xmlDoc.end({ prettyPrint: true, allowEmptyTags: true });
      textContent = textContent.split("\n").slice(1).join("\n"); // remove xml version tag

      /* We have to fix self-closing tags to behave like the course compare files
      instead of the default, same-line XMLBuilder2 behavior. We introduce a new
      line plus four spaces. */
      textContent = fixXmlOutput(textContent);

      fs.writeFile(destPath, textContent, (err: string) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`Generated file ${destPath}\n`);
      });
    }
  }

  /** Generates the XML files containing the given program tokens and their types. */
  printTokens() {
    for (let i = 0; i < this.files.length; i++) {
      const file = this.files[i];
      const tokenizer = new JackTokenizer(file);
      const xmlDoc = xml.create();
      const destPath = this.paths[i].replace(".jack", "T.xml");

      // 1. Insert root element "tokens" in XML
      const xmlDocTokens = xmlDoc.ele("tokens");

      // 2. Insert token elements
      while (tokenizer.hasMoreTokens()) {
        tokenizer.advance();
        if (tokenizer.currentToken) {
          let content = tokenizer.currentToken;
          if (tokenizer.tokenType() === "STRING_CONST") {
            content = tokenizer.stringVal();
          }
          xmlDocTokens.ele(tokenizer.getTokenName()).txt(` ${content} `);
        }
      }

      // 3. Write file
      let textContent = xmlDoc.end({ prettyPrint: true, indent: "" });
      textContent = textContent.split("\n").slice(1).join("\n"); // remove xml version tag

      fs.writeFile(destPath, textContent, (err: string) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log(`Generated file ${destPath}\n`);
      });
    }
  }

  /** Main method that runs everything. */
  run(): void {
    this.getPathsFromArg();
    this.readPaths();

    if (this.onlyTokens) {
      this.printTokens();
    } else {
      this.analyze();
    }
  }
}

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log("Usage: node JackAnalyzer FILE/FOLDER NAME");
  process.exit(1);
}
const analyzer = new JackAnalyzer();
analyzer.run();

/** Handles the <empty></empty> elements by inserting a new
 * line and indentation like in course's comparison files
 */
function fixXmlOutput(content: string): string {
  let spaces = "";
  /* 1. Mark the soon-to-be-replaced chars */
  const markedString = content.replace(/><\//gm, ">$</");

  /* 2. Process string */
  return markedString
    .split("\n")
    .map((line) => {
      /* If the line starts with a space we update our indentation */
      if (line.charAt(0) === " ") {
        let temp = "";

        /* Count spaces */
        for (let i = 0; i < line.length; i++) {
          if (line.charAt(i) === " ") {
            temp += " ";
          } else {
            break;
          }
        }
        spaces = temp;
      }

      /* Then we just replace the mark with the right amount of space */
      return line.replace("$", `\n${spaces}`);
    })
    .join("\n");
}
