/**
 * JACK VIRTUAL MACHINE TRANSLATOR
 * Converts a file containing Jack VM instructions (.vm extension)
 * to a Hack symbolic machine language program (.asm).
 *
 * by Riccardo Battiato, December 2021
 * check my other projects
 * https://github.com/rbattiato/nand2tetris
 */
import Parser from "./Parser";
import CodeWriter from "./CodeWriter";

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log("Usage: node assembler FILENAME");
  process.exit(1);
}

const lines = Parser();
CodeWriter(lines);
