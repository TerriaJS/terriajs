const transformIf = require("babel-plugin-jsx-control-statements/src/ifStatement.js");
const transformFor = require("babel-plugin-jsx-control-statements/src/forStatement.js");
const transformChoose = require("babel-plugin-jsx-control-statements/src/chooseStatement.js");

function transformPlugin(babel) {
  var nodeHandlers = {
    For: transformFor(babel),
    If: transformIf(babel),
    Choose: transformChoose(babel)
  };

  var visitor = {
    JSXElement: function (path) {
      var nodeName = path.node.openingElement.name.name;
      var handler = nodeHandlers[nodeName];

      if (handler) {
        const types = babel.types;
        const jsExpr = handler(path.node, path.hub.file);
        const jsxExpr = types.JSXFragment(
          types.JSXOpeningFragment(),
          types.JSXClosingFragment(),
          [types.JSXExpressionContainer(jsExpr)]
        );
        path.replaceWith(jsxExpr);
      }
    }
  };

  return {
    visitor: visitor
  };
}

module.exports = transformPlugin;
