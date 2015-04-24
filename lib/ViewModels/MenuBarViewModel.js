'use strict';

/*global require*/
var defaultValue = require('terriajs-cesium/Source/Core/defaultValue');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var MenuBarViewModel = function(options) {
    options = defaultValue(options, defaultValue.EMPTY_OBJECT);

    this.items = defaultValue(options.items, []).slice();

    knockout.track(this, ['items']);
};

MenuBarViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/MenuBar.html', 'utf8'), container, this);
};

MenuBarViewModel.create = function(options) {
    var result = new MenuBarViewModel(options);
    result.show(options.container);
    return result;
};

module.exports = MenuBarViewModel;
