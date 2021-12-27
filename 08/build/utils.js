"use strict";
exports.__esModule = true;
exports.isWhitespace = void 0;
function isWhitespace(line) {
    var isComment = line.length >= 2 && line.charAt(0) === "/" && line.charAt(1) === "/";
    var isWhitespace = !line.trim();
    return isComment || isWhitespace;
}
exports.isWhitespace = isWhitespace;
