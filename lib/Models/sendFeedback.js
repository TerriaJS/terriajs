'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var DeveloperError = require('terriajs-cesium/Source/Core/DeveloperError');
var loadWithXhr = require('terriajs-cesium/Source/Core/loadWithXhr');
var TerriaError = require('../Core/TerriaError');
var shareLink = require('../ReactViews/Map/Panels/SharePanel/BuildShareLink');


function sendFeedback(options) {
    if (!defined(options) || !defined(options.terria)) {
        throw new DeveloperError('options.terria is required.');
    }

    var terria = options.terria;

    if (!defined(terria.configParameters.feedbackUrl)) {
        raiseError(terria);
        return;
    }

    const link = options.sendShareURL
               ? (shareLink.canShorten(terria)
                 ? shareLink.buildShortShareLink(terria)
                 : shareLink.buildShareLink(terria))
               : "Not shared";


    var url = terria.configParameters.feedbackUrl;
    return loadWithXhr({
        url: url,
        responseType: 'json',
        method: 'POST',
        data: JSON.stringify({
            title: options.title,
            name: options.name,
            email: options.email,
            shareURL: link,
            comment: options.comment
        }),
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function(json) {
        if (json instanceof String || typeof json === 'string') {
            json = JSON.parse(json);
        }

        if (!json || !json.result || json.result !== 'SUCCESS') {
            raiseError(terria);
            return false;
        } else {
            terria.error.raiseEvent(new TerriaError({
                title: 'Thank you for your feedback!',
                message: 'Your feedback helps make ' + terria.appName + ' better.'
            }));
            return true;
        }
    }).otherwise(function() {
        raiseError(terria);
        return false;
    });
}

function raiseError(terria) {
    terria.error.raiseEvent(new TerriaError({
        title: 'Unable to send feedback',
        message: 'This is really embarrassing, but an error occurred while attempting to send your feedback.  Please email it to ' + terria.supportEmail + ' instead.'
    }));
}

module.exports = sendFeedback;
