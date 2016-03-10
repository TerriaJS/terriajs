'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var destroyObject = require('terriajs-cesium/Source/Core/destroyObject');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');
var getElement = require('terriajs-cesium/Source/Widgets/getElement');

var loadView = require('../Core/loadView');
var removeView = require('../Core/removeView');

var BrandBarViewModel = function(options) {
    this.elements = defaultValue(options.elements, []);

    var container = getElement(defaultValue(options.container, document.body));

    knockout.track(this, ['elements']);

    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/BrandBar.html', 'utf8'), container, this);
};

BrandBarViewModel.prototype.destroy = function() {
    removeView(this._domNodes);
    destroyObject(this);
};

BrandBarViewModel.create = function(options) {
    return new BrandBarViewModel(options);
};

module.exports = BrandBarViewModel;
