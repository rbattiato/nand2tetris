/**
 * HACK LANGUAGE ASSEMBLER
 * Converts a text file containing symbolic Hack Language instructions
 * to their binary counterpart.
 *
 * by Riccardo Battiato, November 2021
 * check my other projects
 * https://github.com/rbattiato/nand2tetris
 */
const fs = require("fs"),
  readline = require("readline");
const { defaultSymbols } = require("./constants");
const { handleDest, handleComp, handleJump } = require("./c");
const { toBinary, isWhitespace } = require("./utils");

const filename = process.argv[2];

const symbolTable = new Map(defaultSymbols);
const lines = [];
let cleanLines = null;
let variablesOffset = 16;
let result = "";

// Make sure we got a filename on the command line.
if (process.argv.length < 3) {
  console.log("Usage: node assembler FILENAME");
  process.exit(1);
}

console.log("About to translate file:", filename);
const rd = readline.createInterface({
  input: fs.createReadStream(filename),
});

// Read file
rd.on("line", function (line) {
  if (isWhitespace(line)) return;
  const cleanLine = line.split("//")[0];
  lines.push(cleanLine.trim());
});

// Handle the rest
rd.on("close", function () {
  /* We clear lines from any label */
  cleanLines = lines.filter((line) => !/\(([^)]+)\)/.test(line));
  init();
});

function init() {
  // 1. First pass: load JUMP labels
  let labelsEncountered = 0;
  for (let i = 0; i < lines.length; i++) {
    const arr = lines[i].match(/\(([^)]+)\)/);
    if (arr) {
      symbolTable.set(arr[1].trim(), i - labelsEncountered);
      labelsEncountered++;
    }
  }

  // 2. Second pass: load variables symbols
  for (const line of cleanLines) {
    const arr = line.match(/@(.*)/);
    if (
      arr &&
      !symbolTable.has(arr[1].trim()) &&
      isNaN(parseInt(arr[1].trim()))
    ) {
      symbolTable.set(arr[1].trim(), variablesOffset);
      variablesOffset++;
    }
  }

  // 3. Actual translate
  for (const line of cleanLines) {
    const binary = translate(line);
    if (binary) result += `${binary}\r\n`;
  }

  saveFile(filename, result);
}

function saveFile(filename, content) {
  const outputFileName = filename.replace(".asm", ".hack");
  fs.writeFile(outputFileName, content, (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("All done!");
  });
}

function translate(line) {
  if (isWhitespace(line)) return;
  if (isA(line)) return handleALine(line);
  else return handleCLine(line);
}

function isA(line) {
  return line.length > 0 && line.charAt(0) === "@";
}

function handleALine(line) {
  let cleanLine = line.replace("@", "");
  if (isNaN(parseInt(cleanLine))) cleanLine = symbolTable.get(cleanLine);
  const binaryLine = toBinary(cleanLine).substring(1);
  return `0${binaryLine}`;
}

function handleCLine(line) {
  let instruction = "111";

  let comp, jump;
  const [dest, compJump] = line.split("=");
  if (compJump) [comp, jump] = compJump.split(";");
  else [comp, jump] = dest.split(";");

  instruction += handleComp(comp);
  /* If compJump is not undefined, we have a destination */
  if (compJump) instruction += handleDest(dest);
  else instruction += "000";

  if (jump) instruction += handleJump(jump);
  else instruction += "000";

  return instruction;
}
