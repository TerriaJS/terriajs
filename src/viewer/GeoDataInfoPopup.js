"use strict";

/*global require,Cesium*/
var getElement = Cesium.getElement;

var knockout = require('knockout');

var GeoDataInfoPopup = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var info = document.createElement('div');
    info.className = 'ausglobe-info';
    //info.setAttribute('data-bind', 'click: function(viewModel, e) { e.stopPropagation(); }');
    info.innerHTML = '\
        <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
        <h1 data-bind="text: info.Title"></h1>\
        <h2><span data-bind="text: serviceType"></span> URL</h2>\
        <input readonly type="text" data-bind="value: info.base_url" size="80" onclick="this.select();" />\
        <h2>GetCapabilities URL</h2>\
        <a data-bind="attr: { href: getCapabilitiesUrl }, text: getCapabilitiesUrl" target="_blank"></a>\
        <hr />\
        <h2>Layer Details</h2>\
        <hr />\
        <h2>Service Details</h2>\
        <h2><span data-bind="text: serviceType"></span> URL</h2>\
        <div class="ausglobe-info-field" data-bind="text: info.base_url"></div>\
        <h2>Type</h2>\
        <div class="ausglobe-info-field" data-bind="text: info.type"></div>\
        <h2>URL</h2>\
        <div class="ausglobe-info-field" data-bind="text: info.base_url"></div>\
        <h2 data-bind="visible: info.Name && info.Name() !== \'REST\'">Layer Name</h2>\
        <div class="ausglobe-info-field" data-bind="visible: info.Name && info.Name() !== \'REST\', text: info.Name"></div>\
        </div>\
    ';
    wrapper.appendChild(info);

    var viewModel = this._viewModel = {
    };


    viewModel.info = options.viewModel;
    viewModel.close = function() {
        container.removeChild(wrapper);
    };
    viewModel.closeIfClickOnBackground = function(viewModel, e) {
        if (e.target === wrapper) {
            viewModel.close();
        }
        return true;
    };

    viewModel.serviceType = knockout.computed(function() {
        var type = viewModel.info.type();
        if (type === 'WFS') {
            return 'Web Feature Service (WFS)';
        } else if (type === 'WMS') {
            return 'Web Map Service (WMS)';
        } else if (type === 'REST') {
            return 'Esri REST';
        } else {
            return '';
        }
    });

    viewModel.getCapabilitiesUrl = knockout.computed(function() {
        return viewModel.info.base_url() + '?service=WMS&version=1.1.1&request=GetCapabilities';
    });

    knockout.applyBindings(this._viewModel, wrapper);
};

module.exports = GeoDataInfoPopup;
