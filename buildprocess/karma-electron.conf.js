'use strict';

/*global require*/
var createKarmaBaseConfig = require('./createKarmaBaseConfig');

module.exports = function(config) {
    var options = Object.assign({}, createKarmaBaseConfig(config), {
        browsers: ['electron']
    });

    config.set(options);
};
