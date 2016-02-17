'use strict';

/*global require*/
var loadView = require('../Core/loadView');

var AsyncResultSectionViewModel = function(nowViewingTab, catalogMember) {
    this.catalogMember = catalogMember;
};

AsyncResultSectionViewModel.createForCatalogMember = function(nowViewingTab, catalogMember) {
    if (catalogMember.type !== 'async-result') {
        return undefined;
    }

    return new AsyncResultSectionViewModel(nowViewingTab, catalogMember);
};

AsyncResultSectionViewModel.prototype.show = function(container) {
    loadView(require('fs').readFileSync(__dirname + '/../Views/AsyncResultSection.html', 'utf8'), container, this);
};

module.exports = AsyncResultSectionViewModel;
