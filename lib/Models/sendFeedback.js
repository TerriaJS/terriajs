'use strict';

/*global require*/
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var TerriaError = require('../Core/TerriaError');

function sendFeedback(terria, title, email, body) {
    var url = terria.configParameters.feedbackUrl ? terria.configParameters.feedbackUrl : 'feedback';
    return loadWithXhr({
        url: url,
        responseType: 'json',
        method: 'POST',
        data: JSON.stringify({
            title: title,
            email: email,
            body: body
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function(json) {
        if (!json || !json.result || json.result !== 'SUCCESS') {
            raiseError(terria);
        } else {
            terria.error.raiseEvent(new TerriaError({
                title: 'Thank you for your feedback!',
                message: 'Your feedback helps make ' + terria.appName + ' better.'
            }));
        }
    }).otherwise(function() {
        raiseError(terria);
    });
}

function raiseError(terria) {
    terria.error.raiseEvent(new TerriaError({
        title: 'Unable to send feedback',
        message: 'We\'re really sorry, but an error occurred while attempting to send your feedback.  Please email it to ' + terria.supportEmail + ' instead.'
    }));
}

module.exports = sendFeedback;
