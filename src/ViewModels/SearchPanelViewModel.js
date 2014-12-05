'use strict';

/*global require*/
var fs = require('fs');

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');

var html = fs.readFileSync(__dirname + '/../Views/SearchPanel.html', 'utf8');

var SearchPanelViewModel = function(options) {
};

SearchPanelViewModel.create = function(container, options) {
    container = defaultValue(container, document.body);

    var fragment = createFragmentFromTemplate(html);
    var element = fragment.childNodes[0];
    container.appendChild(element);

    var viewModel = new SearchPanelViewModel(options);
    knockout.applyBindings(viewModel, element);

    return viewModel;
};

module.exports = SearchPanelViewModel;