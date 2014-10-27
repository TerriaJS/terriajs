'use strict';

/*global require*/

var inherit = function(proto) {
    function F() {}
    F.prototype = proto;
    return new F();
};

module.exports = inherit;