/* Anything related to C instruction handling */
const { setCharAt } = require("./utils");

function handleComp(comp) {
  let a, zx, nx, zy, ny, f, no;
  a = zx = nx = zy = ny = f = no = "0";
  // 1. Check if to provide A or M to ALU
  if (comp.includes("M")) a = "1";

  // 2. Replace A or M with unique char
  const uniqueCharComp = comp.replace(/[AM]/g, "U");
  switch (uniqueCharComp) {
    case "0":
      zx = zy = f = "1";
      break;
    case "1":
      zx = nx = zy = ny = f = no = "1";
      break;
    case "-1":
      zx = nx = zy = f = "1";
      break;
    case "D":
      zy = ny = "1";
      break;
    case "U":
      zx = nx = "1";
      break;
    case "!D":
      zy = ny = no = "1";
      break;
    case "!U":
      zx = nx = no = "1";
      break;
    case "-D":
      zy = ny = f = no = "1";
      break;
    case "-U":
      zx = nx = f = no = "1";
      break;
    case "D+1":
      nx = zy = ny = f = no = "1";
      break;
    case "U+1":
      zx = nx = ny = f = no = "1";
      break;
    case "D-1":
      zy = ny = f = "1";
      break;
    case "U-1":
      zx = nx = f = "1";
      break;
    case "D+U":
      f = "1";
      break;
    case "D-U":
      nx = f = no = "1";
      break;
    case "U-D":
      ny = f = no = "1";
      break;
    case "D&U":
      break;
    case "D|U":
      nx = ny = no = "1";
      break;
  }

  return [a, zx, nx, zy, ny, f, no].join("");
}

function handleDest(dest) {
  let binaryDest = "000";
  if (dest.includes("A")) binaryDest = setCharAt(binaryDest, 0, "1");
  if (dest.includes("D")) binaryDest = setCharAt(binaryDest, 1, "1");
  if (dest.includes("M")) binaryDest = setCharAt(binaryDest, 2, "1");
  return binaryDest;
}

function handleJump(jmp) {
  switch (jmp) {
    case "JGT":
      return "001";
    case "JEQ":
      return "010";
    case "JGE":
      return "011";
    case "JLT":
      return "100";
    case "JNE":
      return "101";
    case "JLE":
      return "110";
    case "JMP":
      return "111";
    default:
      return "000";
  }
}

module.exports = {
  handleComp,
  handleDest,
  handleJump,
};
