'use strict';

var FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');
var TerriaError = require('../Core/TerriaError');

// Unfortunately there's no way to feature-detect for this, it's something that only MS browsers disallow for security reasons.
var canUseDataUriInHref = !(FeatureDetection.isInternetExplorer() || /Edge/.exec(navigator.userAgent));

var DataUri = {
    /**
     * Turn a file with the supplied type and stringified data into a data uri that can be set as the href of an anchor tag.
     * @param {String} type Data type, eg. 'json' or 'csv'.
     * @param {String} dataString The data.
     * @return {String} A string that can be used to in an anchor tag's 'href' attribute to represent downloadable data.
     */
    make: function(type, dataString) {
        if (dataString) {
            // Using attachment/* mime type makes safari download as attachment.
            return 'data:attachment/' + type + ',' + encodeURIComponent(dataString);
        }
    },

    /**
     * Check that data uri links are supported by the user's browser. If so, lets them through,
     * otherwise swallows the event and presents an error message explaining why it won't work.
     * @param {Error} errorEvent A Cesium Event, eg. terria.error, used to raise an error if the browser does not support data download.
     * @param {String} href The link to provide in the error message.
     * @param {Boolean} [forceError] If true, always show the error message. Defaults to false, which only shows it if the browser cannot download uri links.
     */
    checkCompatibility: function(errorEvent, href, forceError) {
        if (!canUseDataUriInHref || forceError) {
            errorEvent.raiseEvent(new TerriaError({
                title: 'Browser Does Not Support Data Download',
                message: 'Unfortunately Microsoft browsers (including all versions of Internet Explorer and Edge) do not ' +
                    'support the data uri functionality needed to download data as a file. To download, copy the following uri ' +
                    'into another browser such as Chrome, Firefox or Safari: ' + href
            }));
        } else {
            return true; // allow the event.
        }
    }
};

module.exports = DataUri;
