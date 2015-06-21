'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var deprecationWarning = require('terriajs-cesium/Source/Core/deprecationWarning');
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
    var createOptions = options;
    if (arguments.length > 1) {
        deprecationWarning('BrandBarViewModel.create', 'BrandBarViewModel.create now takes only one parameter.  Pass the container in the "container" property instead of as the first argument.');
        createOptions = arguments[1];
        createOptions.container = arguments[0];
    }
    return new BrandBarViewModel(createOptions);
};

module.exports = BrandBarViewModel;
