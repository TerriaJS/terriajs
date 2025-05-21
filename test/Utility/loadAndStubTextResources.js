"use strict";

import loadText from "../../lib/Core/loadText";

function loadTextResources(resources) {
  var result = {};
  return Promise.all(
    resources.map(function (resource) {
      return loadText(resource).then(function (text) {
        result[resource] = text;
      });
    })
  ).then(() => result);
}

function loadAndStubTextResources(done, resources) {
  return loadTextResources(resources).then(function (loadedResources) {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(/.*/).andCallFunction(function (_stub, xhr) {
      done.fail("Unhandled request to URL: " + xhr.url);
    });

    for (var i = 0; i < resources.length; ++i) {
      jasmine.Ajax.stubRequest(resources[i]).andReturn({
        responseText: loadedResources[resources[i]]
      });
    }

    return loadedResources;
  });
}

module.exports = loadAndStubTextResources;
