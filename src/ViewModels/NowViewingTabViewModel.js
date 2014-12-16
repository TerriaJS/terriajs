'use strict';

/*global require*/
var fs = require('fs');

var createFragmentFromTemplate = require('../Core/createFragmentFromTemplate');
var ExplorerTabViewModel = require('./ExplorerTabViewModel');
var inherit = require('../Core/inherit');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var html = fs.readFileSync(__dirname + '/../Views/NowViewingTab.html', 'utf8');

var NowViewingTabViewModel = function(nowViewing) {
    ExplorerTabViewModel.call(this);

    this.name = 'Now Viewing';
    this.nowViewing = nowViewing;
};

inherit(ExplorerTabViewModel, NowViewingTabViewModel);

NowViewingTabViewModel.prototype.show = function(container) {
    var fragment = createFragmentFromTemplate(html);
    container.appendChild(fragment);

    //knockout.applyBindings(this, element);
};

module.exports = NowViewingTabViewModel;
