"use strict";

var defined = require("terriajs-cesium/Source/Core/defined").default;

var closeWhenEscapeIsPressed = function(obj) {
  var x = init.bind(obj);
  var key;
  function init(event) {
    key = event.which || event.keyCode;
    if (key === 27 && defined(obj)) {
      obj.close();
      document.removeEventListener("keydown", x);
    }
  }
  document.addEventListener("keydown", x);
};

module.exports = closeWhenEscapeIsPressed;
