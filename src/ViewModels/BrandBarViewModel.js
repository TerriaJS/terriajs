'use strict';

/*global require*/
var fs = require('fs');

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');

var html = fs.readFileSync(__dirname + '/../Views/BrandBar.html', 'utf8');

var BrandBarViewModel = function(options) {
    this.elements = defaultValue(options.elements, []);

    knockout.track(this, ['elements']);
};

BrandBarViewModel.create = function(container, options) {
    container = defaultValue(container, document.body);

    var fragment = createFragmentFromTemplate(html);
    var element = fragment.childNodes[0];
    container.appendChild(element);

    var viewModel = new BrandBarViewModel(options);
    knockout.applyBindings(viewModel, element);

    return viewModel;
};

module.exports = BrandBarViewModel;