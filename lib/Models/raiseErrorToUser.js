'use strict';

/*global require*/

var ModelError = require('../Models/ModelError');

var raiseErrorToUser = function(terria, error) {
    if (error instanceof ModelError) {
        terria.error.raiseEvent(error);
    } else {
        terria.error.raiseEvent(new ModelError({
            sender: undefined,
            title: 'An error occurred',
            message: '\
<p>National Map experienced an error.  Please report this by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.  \
Details of the error are below.</p>\
<p><pre>' + error.toString() + '</pre></p>'
        }));
    }
};

module.exports = raiseErrorToUser;