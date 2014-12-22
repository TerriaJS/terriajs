'use strict';

/*global require*/
var fs = require('fs');

var defaultValue = require('../../third_party/cesium/Source/Core/defaultValue');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');

var html = fs.readFileSync(__dirname + '/../Views/SearchPanel.html', 'utf8');

var SearchPanelViewModel = function(options) {
    this.searchText = '';

    this.svgSearch = 'm 7.5,0.5 c -3.860071,0 -7,3.139929 -7,7 0,3.860071 3.1399291,7 7,7 1.5760552,0 3.016254,-0.524062 4.1875,-1.40625 l 0.09375,0.125 4.5625,4.53125 0.71875,0.71875 1.40625,-1.40625 -0.71875,-0.71875 -4.53125,-4.5625 -0.125,-0.09375 C 13.975938,10.516254 14.5,9.0760552 14.5,7.5 c 0,-3.8600709 -3.139929,-7 -7,-7 z m 0,1 c 3.319631,0 6,2.6803691 6,6 0,3.319631 -2.680369,6 -6,6 -3.3196309,0 -6,-2.680369 -6,-6 0,-3.3196308 2.6803692,-6 6,-6 z';
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

SearchPanelViewModel.prototype.search = function() {
};

module.exports = SearchPanelViewModel;