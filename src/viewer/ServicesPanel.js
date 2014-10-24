"use strict";

/*global require,$*/
var defined = require('../../third_party/cesium/Source/Core/defined');
var getElement = require('../../third_party/cesium/Source/Widgets/getElement');
var when = require('../../third_party/cesium/Source/ThirdParty/when');
var loadXML = require('../../third_party/cesium/Source/Core/loadXML');

var corsProxy = require('../corsProxy');
var createCatalogMemberFromType = require('../ViewModels/createCatalogMemberFromType');
var createCatalogItemFromUrl = require('../ViewModels/createCatalogItemFromUrl');
var CatalogGroupViewModel = require('../ViewModels/CatalogGroupViewModel');
var knockout = require('../../third_party/cesium/Source/ThirdParty/knockout');
var komapping = require('../../public/third_party/knockout.mapping');

var ServicesPanel = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var info = document.createElement('div');
    info.className = 'ausglobe-services';
    info.setAttribute('data-bind', 'if: !serviceInvoked(), visible: !serviceInvoked()');
    info.innerHTML = '\
        <div class="ausglobe-info-header">\
            <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
            <h1>Send to a Service (Advanced)</h1>\
        </div>\
        <div data-bind="if: services.length > 0">\
            <div class="ausglobe-info-content">\
                <div class="ausglobe-share-label">\
                    Choose one service to use:\
                    <div class="ausglobe-service-list" data-bind="foreach: services">\
                        <div><label><input type="radio" name="ausglobe-service" data-bind="value: $index, checked: $root.selectedService" /><span data-bind="text: name"></span></div>\
                    </div>\
                </div>\
                <div class="ausglobe-share-label">\
                    <hr />\
                </div>\
                <div class="ausglobe-share-label">\
                    <h2 data-bind="text: services[selectedService() | 0].name"></h2>\
                    <div class="ausglobe-share-label" data-bind="text: services[selectedService() | 0].description"></div>\
                </div>\
                <div class="ausglobe-share-label" data-bind="visible: services.length > 0">\
                    <input class="ausglobe-services-send-button" type="button" value="Send" data-bind="click: sendRequest" />\
                </div>\
            </div>\
        </div>\
        <div data-bind="if: services.length === 0">\
            <div class="ausglobe-info-content">\
                <div class="ausglobe-share-label">\
                    Sorry, no services are currently available.  Please check back later.\
                </div>\
            </div>\
        </div>\
    ';
    wrapper.appendChild(info);

    var result = document.createElement('div');
    result.className = 'ausglobe-services';
    result.setAttribute('data-bind', 'if: serviceInvoked, visible: serviceInvoked');
    result.innerHTML = '\
        <div class="ausglobe-info-header">\
            <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
            <h1>Send to a Service (Advanced)</h1>\
        </div>\
        <div class="ausglobe-info-content">\
            <div class="ausglobe-share-label">\
                <h2 data-bind="text: services[selectedService() | 0].name"></h2>\
                <div class="ausglobe-share-label" data-bind="html: result"></div>\
            </div>\
            <div class="ausglobe-share-label" data-bind="if: hasLayer">\
                <input class="ausglobe-services-send-button" type="button" value="Load" data-bind="click: load" />\
            </div>\
        </div>\
    ';
    wrapper.appendChild(result);

    var viewModel = this._viewModel = {
        catalog : options.catalog,
        serviceInvoked : knockout.observable(false),
        request : options.request,
        services : options.services,
        selectedService : knockout.observable('0'),
        result : knockout.observable('Invoking service...'),
        hasLayer : knockout.observable(false),
        sendRequest : function() {
            viewModel.serviceInvoked(true);

            var formData = new FormData();
            for (var fld in viewModel.request) {
                if (viewModel.request.hasOwnProperty(fld)) {
                    formData.append(fld, viewModel.request[fld]);
                }
            }
            // submit and display returned html text
            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    var str;
                    if (xhr.status !== 200) {
                        str = 'Error ' + xhr.status + ': ' + xhr.responseText;
                    }
                    else {
                        var res = JSON.parse(xhr.responseText);
                        str = res.displayHtml;
                        if (res.layer !== undefined) {
                            str += '<h3>---------------</h3>';
                            str += 'Click the load button below to load the page from the service.';

                            if (res.layer.type === 'DATA') {
                                viewModel.layer = createCatalogItemFromUrl(res.layer.url, viewModel.catalog.context);
                            } else {
                                viewModel.layer = createCatalogMemberFromType(res.layer.type, viewModel.catalog.context);
                                viewModel.layer.updateFromJson(res.layer);
                            }

                            viewModel.layer.name = res.layer.name;
                            viewModel.hasLayer(true);
                        }
                        viewModel.result(str);
                    }
                }
            };
            xhr.open('POST', viewModel.services[viewModel.selectedService() | 0].url);
            xhr.send(formData);
        },
        load : function() {
            if (viewModel.hasLayer()) {
                var userAddedDataGroup = viewModel.catalog.userAddedDataGroup;
                userAddedDataGroup.isOpen = true;

                var group = userAddedDataGroup.findFirstItemByName(viewModel.services[viewModel.selectedService() | 0].name);
                if (!defined(group)) {
                    group = new CatalogGroupViewModel(viewModel.catalog.context);
                    group.name = viewModel.services[viewModel.selectedService() | 0].name;
                    group.isOpen = true;
                    viewModel.catalog.userAddedDataGroup.add(group);
                }

                group.add(viewModel.layer);
                viewModel.layer.isEnabled = true;
                viewModel.layer.zoomTo();
            }
            viewModel.close();
        }
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

module.exports = ServicesPanel;
