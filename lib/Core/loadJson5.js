"use strict";
/* global require  */

var json5 = require("json5");
var Resource = require("terriajs-cesium/Source/Core/Resource").default;

var defaultHeaders = {
  Accept: "application/json5,application/json;q=0.8,*/*;q=0.01"
};
/*
 * A modified version of Cesium's loadJson function, supporting the more flexible JSON5 specification.
 */

function loadJson5(urlOrResource) {
  var resource;
  if (urlOrResource instanceof Resource) {
    resource = urlOrResource;
  } else {
    resource = new Resource({
      url: urlOrResource,
      headers: defaultHeaders
    });
  }

  return resource.fetchText().then(function(value) {
    return json5.parse(value);
  });
}

// Use these headers if passing a Cesium Resource to loadJson5
loadJson5.defaultHeaders = defaultHeaders;

module.exports = loadJson5;
