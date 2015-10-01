"use strict";
var parseTemplate = function (data, template) {

    var html = "",
        rg = /{{2}([^}]+)}{2}/g;

    function keyFilter(string) {
        //use {{}} syntax
        return function handler(regex) {
            return string.match(regex);
        };
    }

    //if supplied a string
    function parse(template) {
        var keys, output, currentKey, currentValue, i = 0;
        keys = (keyFilter(template))(rg);

        function replaceKey(template) {
            currentKey = keys[i];
            currentValue = data[currentKey.substring(2, (keys[i].length - 2))];
            output = template.replace(currentKey, currentValue);
            i++;
            if (i < keys.length) {
                replaceKey(output);
            } else {
                return output;
            }
        }

        replaceKey(template);
      return output;
    }
  html = parse(template);
  return html;
};


// var d = {
//     name: "name lala",
//     value: "value lala ",
//         "some more item": "some more item lala "
// };

// var tpl = "hello {{name}} for {{value}}, {{some more item}}";

// var t = parseTemplate(d, tpl);

module.exports = parseTemplate;
