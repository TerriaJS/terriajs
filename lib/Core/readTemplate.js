"use strict";
  var parseTemplate = function(data, template){

    var html = "",
        l;


    function filter(string){
      var rg = /{{2}([^}]+)}{2}/g;
      return string.match(rg);
    }


    //if supplied a string
    function parse(template){
      var keys;
      keys = template.split(" ").filter(filter).map(function(item){
          return item.substring(2, item.length-2);
      });
      console.log(keys);

    }

    html = parse(template);
    return html;
  }


  var d = {
    name: "name",
    value: "value"
  };

  var tpl = "hello {{name}} for {{value}}";

  var t = parseTemplate(d, tpl);



module.exports = readTemplate;
