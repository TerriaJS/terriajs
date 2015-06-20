'use strict';

/**
 * Determines if this browser has any hope of running TerriaJS.  Specifically, this function checks for the presence
 * of the basic ECMAScript 5 function "Object.create".
 *
 * @return {Boolean} true if this web browser has a chance of running TerriaJS, or false if the browser is so old (pre-IE9)
 *                        that there is no chance of a good result.
 */
var isBrowserCompatible = function() {
    // IE9 doesn't have a console object until the debugging tools are opened.
    // Add a shim.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {}
        };
    }

    return typeof Object.create !== 'undefined';
};

module.exports = isBrowserCompatible;
