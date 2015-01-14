'use strict';

/*global require*/

var BaseMapViewModel = function(options) {
    this.image = options.image;
    this.catalogItem = options.catalogItem;
};

BaseMapViewModel.prototype.activate = function() {
};

module.exports = BaseMapViewModel;
