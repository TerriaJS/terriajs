"use strict";

/*global require*/
var defined = require("terriajs-cesium/Source/Core/defined").default;

/**
 * Determines if this is a common mobile platform such as iOS, Android, or Windows Phone.
 * @param {String} [userAgentString] The user agent string to check.  If this property is not specified, `window.navigator.userAgent` is used.
 * @return {Boolean}                 [description]
 */
var isCommonMobilePlatform = function(userAgentString) {
  if (!defined(userAgentString)) {
    userAgentString = window.navigator.userAgent;
  }

  return /(Android|iPhone|iPad|Windows Phone|IEMobile)/.test(userAgentString);
};

module.exports = isCommonMobilePlatform;
