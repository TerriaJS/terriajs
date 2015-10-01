'use strict';

var readTemplate = require('../../lib/Core/readTemplate');
var mockData, mockTemplate, output;

describe("readTemplate", function() {
  it("contains spec with an expectation", function() {
    mockData = {
      name: "name lala",
      value: "value lala",
      "some more item": "some more item lala"
    };
    mockTemplate = "hello {{name}} for {{value}}, {{some more item}}";
    output = readTemplate(mockData, mockTemplate);
    expect(output).toBe("hello name lala for value lala, some more item lala");
  });

  it("contains spec with an expectation", function() {
    mockData = {
      name123: "name",
      VALUE: "",
      "cat's ear": "<em>Hello</em> world! < a href='www'>www </a>"
    };
    mockTemplate = "hello {{name123}} for {{VALUE}}, {{cat's ear}}";
    output = readTemplate(mockData, mockTemplate);
    expect(output).toBe("hello name for , <em>Hello</em> world! < a href='www'>www </a>");
  });
});
