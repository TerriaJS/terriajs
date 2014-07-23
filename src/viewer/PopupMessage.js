"use strict";

/*global require,$*/
var defaultValue = require('../../public/cesium/Source/Core/defaultValue');
var getElement = require('../../public/cesium/Source/Widgets/getElement');

var knockout = require('knockout');

var PopupMessage = function(options) {
    var container = getElement(options.container);
    var message = options.message;
    var title = defaultValue(options.title, 'Information');

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var popup = document.createElement('div');
    popup.className = 'ausglobe-message';
    popup.innerHTML = '\
        <div class="ausglobe-info-header">\
            <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
            <h1 data-bind="text: title"></h1>\
        </div>\
        <div class="ausglobe-info-content">\
            <div class="ausglobe-share-label" data-bind="html: message"></div>\
        </div>\
    ';
    wrapper.appendChild(popup);

    var viewModel = {};

    viewModel.close = function() {
        container.removeChild(wrapper);
    };
    viewModel.closeIfClickOnBackground = function(viewModel, e) {
        if (e.target === wrapper) {
            viewModel.close();
        }
        return true;
    };

    viewModel.title = knockout.observable(defaultValue(options.title, 'Information'));
    viewModel.message = knockout.observable(options.message);

    knockout.applyBindings(viewModel, wrapper);
};

module.exports = PopupMessage;
