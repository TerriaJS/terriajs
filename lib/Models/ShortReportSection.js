"use strict";

/*global require*/
var defaultValue = require("terriajs-cesium/Source/Core/defaultValue");
var knockout = require("terriajs-cesium/Source/ThirdParty/knockout");

function ShortReportSection(options) {
  this.name = options.name;
  this.content = options.content;
  this.isOpen = defaultValue(options.isOpen, true);

  knockout.track(this, ["name", "content", "isOpen"]);
}

ShortReportSection.prototype.toggleOpen = function() {
  this.isOpen = !this.isOpen;
};

module.exports = ShortReportSection;
