'use strict';

/*global require*/

var defined = require('../../third_party/cesium/Source/Core/defined');
var DeveloperError = require('../../third_party/cesium/Source/Core/DeveloperError');

var ViewModelError = require('./ViewModelError');

var raiseErrorOnRejectedPromise = function(application, promise) {
    if (!defined(application)) {
        throw new DeveloperError('application is required.');
    }

    if (defined(promise)) {
        return promise.otherwise(function(e) {
            if (e instanceof ViewModelError) {
                application.error.raiseEvent(e);
            } else {
                application.error.raiseEvent(new ViewModelError({
                    sender: undefined,
                    title: 'An unknown error occurred',
                    message: '\
<p>National Map experienced an unknown error.  Please report this by emailing <a href="mailto:nationalmap@lists.nicta.com.au">nationalmap@lists.nicta.com.au</a>.  \
Details of the error are below.</p>\
<p><pre>' + e.toString() + '</pre></p>'
                }));
            }
        });
    }
};

module.exports = raiseErrorOnRejectedPromise;