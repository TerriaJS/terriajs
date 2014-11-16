"use strict";

/*global require,URI*/
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');

var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');

var SharePanel = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var info = document.createElement('div');
    info.className = 'ausglobe-share';
    info.innerHTML = '\
        <div class="ausglobe-info-header">\
            <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
            <h1>Share</h1>\
        </div>\
        <div class="ausglobe-info-content">\
            <div class="ausglobe-share-image">\
                <img data-bind="attr: { src: request.image }" height="300" />\
            </div>\
            <div class="ausglobe-share-right">\
                <div class="ausglobe-share-label" data-bind="visible: itemsSkippedBecauseTheyHaveLocalData.length > 0">\
                    The following data sources will NOT be shared because they include data from this local system.\
                    To share these data sources, publish their data on a web server and add them to National Map using\
                    the URL instead of by dragging/dropping or selecting a local file.\
                    <ul data-bind="foreach: itemsSkippedBecauseTheyHaveLocalData">\
                        <li data-bind="text: name"></li>\
                    </ul>\
                </div>\
                <div class="ausglobe-share-label">\
                    To <strong>copy</strong> to clipboard, click the link below and press CTRL+C or &#8984;+C:\
                    <input readonly type="text" data-bind="value: url" size="100" onclick="this.select();" />\
                </div>\
                <div class="ausglobe-share-label">\
                    To <strong>embed</strong>, copy this code to embed this map into an HTML page:\
                    <input readonly type="text" data-bind="value: embedCode" size="100" onclick="this.select();" />\
                </div>\
            </div>\
        </div>\
    ';
    wrapper.appendChild(info);

    var uri = new URI(window.location);
    var visServer = uri.protocol() + '://' + uri.host();

    var request = options.request;
    
    var img = request.image;
    request.image = undefined;
    var requestStr = JSON.stringify(request);
    var url = visServer + '#start=' + encodeURIComponent(requestStr);
    request.image = img;

    var viewModel = this._viewModel = {
        request : options.request,
        url : url,
        itemsSkippedBecauseTheyHaveLocalData : options.itemsSkippedBecauseTheyHaveLocalData,
        embedCode : '<iframe style="width: 720px; height: 405px; border: none;" src="' + url + '" allowFullScreen mozAllowFullScreen webkitAllowFullScreen></iframe>'
    };

    viewModel.close = function() {
        container.removeChild(wrapper);
    };
    viewModel.closeIfClickOnBackground = function(viewModel, e) {
        if (e.target === wrapper) {
            viewModel.close();
        }
        return true;
    };

    knockout.applyBindings(this._viewModel, wrapper);
};

SharePanel.open = function(options) {
    return new SharePanel(options);
};

module.exports = SharePanel;
