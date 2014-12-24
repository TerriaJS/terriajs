'use strict';

/*global require,URI*/
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var loadView = require('../Core/loadView');

var SharePopupViewModel = function(options) {
    this.request = options.request;
    
    var uri = new URI(window.location);
    var visServer = uri.protocol() + '://' + uri.host();

    var request = options.request;
    var img = request.image;
    request.image = undefined;
    var requestStr = JSON.stringify(request);
    var url = visServer + '#start=' + encodeURIComponent(requestStr);
    request.image = img;

    this.url = url;
    this.embedCode = '<iframe style="width: 720px; height: 405px; border: none;" src="' + url + '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>';
    this.itemsSkippedBecauseTheyHaveLocalData = options.itemsSkippedBecauseTheyHaveLocalData;

    knockout.track(this, ['url', 'embedCode', 'itemsSkippedBecauseTheyHaveLocalData']);
};

SharePopupViewModel.prototype.show = function(container) {
    this._domNodes = loadView(require('fs').readFileSync(__dirname + '/../Views/SharePopup.html', 'utf8'), container, this);
};

SharePopupViewModel.prototype.close = function() {
    for (var i = 0; i < this._domNodes.length; ++i) {
        var node = this._domNodes[i];
        node.parentElement.removeChild(node);
    }
};

SharePopupViewModel.prototype.closeIfClickOnBackground = function(viewModel, e) {
    if (e.target.className === 'modal-background') {
        this.close();
    }
    return true;
};

SharePopupViewModel.open = function(container, options) {
    var viewModel = new SharePopupViewModel(options);
    viewModel.show(container);
    return viewModel;
};

module.exports = SharePopupViewModel;
