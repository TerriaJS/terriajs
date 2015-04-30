'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var when = require('terriajs-cesium/Source/ThirdParty/when');

var CatalogItem = require('./CatalogItem');

/**
 * A {@link CatalogItem} composed of multiple other catalog items.  When this item is enabled or shown, the composed items are
 * enabled or shown as well.  Other properties, including {@link CatalogItem#rectangle},
 * {@link CatalogItem#clock}, and {@link CatalogItem#legendUrl}, are not composed in any way, so you should manually set those
 * properties on this object as appropriate.
 *
 * @alias CompositeCatalogItem
 * @constructor
 * @extends CatalogItem
 * 
 * @param {Terria} terria The Terria instance.
 * @param {CatalogItem[]} [items] The items to compose.
 */
var CompositeCatalogItem = function(terria, items) {
	CatalogItem.call(this, terria);

	this.items = defined(items) ? items.slice() : [];

	knockout.track(this, ['items']);

	knockout.getObservable(this, 'items').subscribe(function() {
		for (var i = 0; i < this.items.length; ++i) {
			this.items[i].showInNowViewingWhenEnabled = false;
		}
	}, this);
};

CompositeCatalogItem.prototype._load = function() {
	return when.all(this.items.map(function(item) { return item.load(); }));
};

CompositeCatalogItem.prototype._getValuesThatInfluenceLoad = function() {
	var result = [];

	for (var i = 0; i < this.items.length; ++i) {
		result.push.apply(result, this.items[i]._getValuesThatInfluenceLoad());
	}

	return result;
};

CompositeCatalogItem.prototype._enable = function() {
	for (var i = 0; i < this.items.length; ++i) {
		this.items[i]._enable();
	}
};

CompositeCatalogItem.prototype._disable = function() {
	for (var i = 0; i < this.items.length; ++i) {
		this.items[i]._disable();
	}
};

CompositeCatalogItem.prototype._show = function() {
	for (var i = 0; i < this.items.length; ++i) {
		this.items[i]._show();
	}
};

CompositeCatalogItem.prototype._hide = function() {
	for (var i = 0; i < this.items.length; ++i) {
		this.items[i]._hide();
	}
};

CompositeCatalogItem.prototype.lowerToBottom = function() {
	for (var i = this.items.length - 1; i >= 0; --i) {
		var item = this.items[i];
		if (defined(item.lowerToBottom)) {
			item.lowerToBottom();
		}
	}
};

module.exports = CompositeCatalogItem;
