'use strict';

/*global require,alert*/
var isBrowserCompatible = require('../Core/isBrowserCompatible');

/**
 * Checks if the current web browser has at least a chance of running TerriaJS by calling {@link isBrowserCompatible}, and displays
 * a message if it does not.
 * @param  {DOMElement} container The DOM element to own the popup message.
 * @exception {ModelError} The browser has no chance of running TerriaJS.
 */
var checkBrowserCompatibility = function(container) {
    if (!isBrowserCompatible()) {
        alert('This app requires a web browser with support for ECMAScript 5, a feature that has been available in all major browsers since 2009 but that does \
not appear to be supported by your current browser.  Please update your browser \
and try again.  For the best experience, we recommend Google Chrome, Mozilla Firefox, or Internet Explorer 11.'
        );
        window.location = 'http://browsehappy.com';
        throw 'Browser is not compatible';
    }
};

module.exports = checkBrowserCompatibility;
