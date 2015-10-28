'use strict';

var readTemplate = require('../../lib/Core/readTemplate');
var mockData, mockTemplate, output;

describe("readTemplate", function() {
  it("correctly parse text templates", function() {
    mockData = {
      name: "name lala",
      "some more item": "some more item lala",
      value: "value lala"
    };
    mockTemplate = "hello {{name}} for {{value}}, {{some more item}} and {{some more item}}";
    output = readTemplate(mockData, mockTemplate);
    expect(output).toBe("hello name lala for value lala, some more item lala and some more item lala");
  });

  it("correctly parse html templates", function() {
    mockData = {
      name123: "&copy;name",
      VALUE: "",
      "&copy;cat's ear": "<em>Hello</em> world! < a href='www'>www </a>"
    };
    mockTemplate = "hello {{name123}} for {{VALUE}}, {{&copy;cat's ear}}";
    output = readTemplate(mockData, mockTemplate);
    expect(output).toBe("hello &copy;name for , <em>Hello</em> world! < a href='www'>www </a>");
  });
});
