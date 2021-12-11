export function isWhitespace(line: string) {
  const isComment =
    line.length >= 2 && line.charAt(0) === "/" && line.charAt(1) === "/";
  const isWhitespace = !line.trim();
  return isComment || isWhitespace;
}
