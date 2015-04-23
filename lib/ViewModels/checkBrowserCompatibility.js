'use strict';

/*global require*/
var isBrowserCompatible = require('../Core/isBrowserCompatible');
var ModelError = require('../Models/ModelError');
var PopupMessageViewModel = require('../ViewModels/PopupMessageViewModel');

var checkBrowserCompatibility = function(container) {
    if (!isBrowserCompatible()) {
        var error = new ModelError({
            title : 'Very old browser detected',
            message : '\
National Map requires a web browser with support for ECMAScript 5, a feature that has been available in all major browsers since 2009 but that does \
not appear to be supported by your current browser.  Please update your browser \
and try again.  For the best experience, we recommend \
<a href="http://www.microsoft.com/ie" target="_blank">Internet Explorer 11</a> or the latest version of \
<a href="http://www.google.com/chrome" target="_blank">Google Chrome</a> or \
<a href="http://www.mozilla.org/firefox" target="_blank">Mozilla Firefox</a>.'
        });
        PopupMessageViewModel.open(container, error);
        throw error;
    }

    // IE9 doesn't have a console object until the debugging tools are opened.
    // Add a shim.
    if (typeof window.console === 'undefined') {
        window.console = {
            log : function() {}
        };
    }
};

module.exports = checkBrowserCompatibility;
