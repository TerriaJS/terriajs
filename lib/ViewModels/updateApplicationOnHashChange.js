'use strict';

/*global require*/
var raiseErrorToUser = require('../Models/raiseErrorToUser');

/**
 * Updates the {@link Application} when the window's 'hashchange' event is raised.  This allows new init files and
 * "start=" URLs to be loaded just by changing the hash portion of the URL in the browser's address bar.
 *
 * @param {Application} application The application to update.
 * @param {Window} window The browser's window DOM object.
 */
var updateApplicationOnHashChange = function(application, window) {
    window.addEventListener('hashchange', function() {
        application.updateApplicationUrl(window.location).otherwise(function(e) {
            raiseErrorToUser(application, e);
        });
    }, false);
};

module.exports = updateApplicationOnHashChange;
