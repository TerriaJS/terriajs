"use strict";

/*global require*/

var corsProxy = {
    getURL : function(resource) {
        return '/proxy/' + resource;
    }
};

corsProxy.withCredentials = function(username, password) {
    return {
        getURL : function(resource) {
            return '//' + username + ':' + password + '@' + window.location.host + corsProxy.getURL(resource);
        }
    };
}

module.exports = corsProxy;
