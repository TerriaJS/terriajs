'use strict';

/*global require*/
var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var WhyAmISpecialFunction = require('./WhyAmISpecialFunction');

var registerAnalytics = function() {
    createCatalogMemberFromType.register('why-am-i-special-function', WhyAmISpecialFunction);
};

module.exports = registerAnalytics;
