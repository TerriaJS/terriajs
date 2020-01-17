"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue").default;

var BaseMapViewModel = function(options) {
  this.image = options.image;
  this.catalogItem = options.catalogItem;
  this.contrastColor = defaultValue(options.contrastColor, "#ffffff");
};

module.exports = BaseMapViewModel;
