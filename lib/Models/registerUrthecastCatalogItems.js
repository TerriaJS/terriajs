'use strict';

/*global require*/

var createCatalogMemberFromType = require('./createCatalogMemberFromType');
var UrthecastCatalogGroup = require('./UrthecastCatalogGroup');
var UrthecastCatalogItem = require('./UrthecastCatalogItem');

function registerUrthecastCatalogItems() {
    createCatalogMemberFromType.register('urthecast', UrthecastCatalogItem);
    createCatalogMemberFromType.register('urthecast-group', UrthecastCatalogGroup);
}

module.exports = registerUrthecastCatalogItems;
