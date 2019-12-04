"use strict";

import defined from "terriajs-cesium/Source/Core/defined";

const LanguageItem = function(options) {
  this.key = options.key;
  this.name = options.name;
  this.flag = defined(options.flag) ? options.flag : null;
};

module.exports = LanguageItem;
