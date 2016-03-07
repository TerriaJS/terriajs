'use strict';

/*global require*/
var createKarmaBaseConfig = require('./test/Utility/createKarmaBaseConfig');

module.exports = function(config) {
    var options = Object.assign({}, createKarmaBaseConfig(config), {
        detectBrowsers: {
            enabled: true,
            usePhantomJS: false
        }
    });

    options.frameworks.push('detectBrowsers');

    config.set(options);
};
