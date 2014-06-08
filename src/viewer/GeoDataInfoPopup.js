"use strict";

/*global require,Cesium*/
var getElement = Cesium.getElement;

var knockout = require('knockout');

var GeoDataInfoPopup = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: close');
    container.appendChild(wrapper);

    var info = document.createElement('div');
    info.className = 'ausglobe-info';
    info.setAttribute('data-bind', 'click: function(viewModel, e) { e.stopPropagation(); }');
    info.innerHTML = '\
        <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
        <h1 data-bind="text: info.Title"></h1>\
        <h2>Type</h2>\
        <div class="ausglobe-info-field" data-bind="text: info.type"></div>\
        <h2>URL</h2>\
        <div class="ausglobe-info-field" data-bind="text: info.base_url"></div>\
        <h2 data-bind="visible: info.Name() !== \'REST\'">Layer Name</h2>\
        <div class="ausglobe-info-field" data-bind="visible: info.Name() !== \'REST\', text: info.Name"></div>\
        </div>\
    ';
    wrapper.appendChild(info);

    this._viewModel = {
        info : options.viewModel,
        close : function() {
            container.removeChild(wrapper);
        }
    };

    knockout.applyBindings(this._viewModel, wrapper);
};

module.exports = GeoDataInfoPopup;
