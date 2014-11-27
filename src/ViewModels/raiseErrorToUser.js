'use strict';

/*global require*/

var ViewModelError = require('./ViewModelError');

var raiseErrorToUser = function(application, error) {
    if (error instanceof ViewModelError) {
        application.error.raiseEvent(error);
    } else {
        application.error.raiseEvent(new ViewModelError({
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