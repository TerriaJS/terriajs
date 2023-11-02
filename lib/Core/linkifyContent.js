"use strict";

var linkify = require("linkify-it")();

function linkifyContent(content) {
  var matches = linkify.match(content),
    result = [],
    last;

  if (matches) {
    last = 0;
    matches.forEach(function (match) {
      if (last < match.index) {
        result.push(content.slice(last, match.index).replace(/\r?\n/g, "<br>"));
      }
      result.push('<a target="_blank" rel="noreferrer noopener" href="');
      result.push(match.url);
      result.push('">');
      result.push(match.text);
      result.push("</a>");
      last = match.lastIndex;
    });
    if (last < content.length) {
      result.push(content.slice(last).replace(/\r?\n/g, "<br>"));
    }
    content = result.join("");
  }

  return content;
}

module.exports = linkifyContent;
