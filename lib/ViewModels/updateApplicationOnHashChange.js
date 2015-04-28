'use strict';

/*global require*/
var raiseErrorToUser = require('../Models/raiseErrorToUser');

/**
 * Updates the  {@link Terria} when the window's 'hashchange' event is raised.  This allows new init files and
 * "start=" URLs to be loaded just by changing the hash portion of the URL in the browser's address bar.
 *
 * @param  {Terria} terria The Terria instance to update.
 * @param {Window} window The browser's window DOM object.
 */
var updateApplicationOnHashChange = function(terria, window) {
    window.addEventListener('hashchange', function() {
        terria.updateApplicationUrl(window.location).otherwise(function(e) {
            raiseErrorToUser(terria, e);
        });
    }, false);
};

module.exports = updateApplicationOnHashChange;
