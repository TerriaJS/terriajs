'use strict';

var removeView = function(domNodes) {
    for (var i = 0; i < domNodes.length; ++i) {
        var node = domNodes[i];
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
};

module.exports = removeView;
