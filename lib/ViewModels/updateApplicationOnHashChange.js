'use strict';

/*global require*/
var raiseErrorToUser = require('../Models/raiseErrorToUser');

/**
 * Updates the  {@link Terria} when the window's 'hashchange' event is raised.  This allows new init files and
 * "start=" URLs to be loaded just by changing the hash portion of the URL in the browser's address bar.
 *
 * @param  {Terria} terria The Terria instance to update.
 * @param {Window} window The browser's window DOM object.
 * @param {UrlShortener} [urlShortener] The URL shortener to use to expand short URLs.  If this property is undefined, short URLs will not be expanded.
 */
var updateApplicationOnHashChange = function(terria, window, urlShortener) {
    window.addEventListener('hashchange', function() {
        terria.updateApplicationUrl(window.location, urlShortener).otherwise(function(e) {
            raiseErrorToUser(terria, e);
        });
    }, false);
};

module.exports = updateApplicationOnHashChange;
