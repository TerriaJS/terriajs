"use strict";

/*global require*/

var corsProxy = {
    getURL : function(resource) {
        return '/proxy/' + resource;
    }
};

module.exports = corsProxy;
