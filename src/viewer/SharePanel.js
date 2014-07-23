"use strict";

/*global require,$*/
var defined = require('../../public/cesium/Source/Core/defined');
var getElement = require('../../public/cesium/Source/Widgets/getElement');
var when = require('../../public/cesium/Source/ThirdParty/when');
var loadXML = require('../../public/cesium/Source/Core/loadXML');

var corsProxy = require('../corsProxy');
var knockout = require('../../public/cesium/Source/ThirdParty/knockout');
var komapping = require('../../public/third_party/knockout.mapping');

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

    var url = options.geoDataManager.getShareRequestURL(options.request);
    var viewModel = this._viewModel = {
        request : options.request,
        url : url,
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

module.exports = SharePanel;
