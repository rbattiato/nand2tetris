function isWhitespace(line) {
  const isComment =
    line.length >= 2 && line.charAt(0) === "/" && line.charAt(1) === "/";
  const isWhitespace = !line.trim();
  return isComment || isWhitespace;
}

function toBinary(num) {
  const binary = parseInt(num, 10).toString(2);
  if (binary.length > 16) return binary.substring(binary.length - 16);
  return binary.padStart(16, "0");
}

function setCharAt(str, index, chr) {
  if (index > str.length - 1) return str;
  return str.substring(0, index) + chr + str.substring(index + 1);
}

module.exports = {
  isWhitespace,
  toBinary,
  setCharAt,
};
