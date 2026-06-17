"use strict";

var regexp =
  /\/\/>>includeStart\('debug', pragmas\.debug\);?[^]*?\/\/>>includeEnd\('debug'\);?/g;

module.exports = function (source) {
  if (this && this.cacheable) {
    this.cacheable();
  }
  return source.replace(regexp, "");
};
