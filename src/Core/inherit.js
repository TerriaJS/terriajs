'use strict';

/*global require*/

var inherit = function(base, derived) {
    function F() {}
    F.prototype = base.prototype;
    derived.prototype = new F();
    derived.prototype.constructor = derived;
};

module.exports = inherit;