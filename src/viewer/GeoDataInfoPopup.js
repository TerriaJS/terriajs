"use strict";

/*global require,Cesium,$*/
var defined = Cesium.defined;
var getElement = Cesium.getElement;
var when = Cesium.when;
var loadXML = Cesium.loadXML;

var corsProxy = require('../corsProxy');
var knockout = require('knockout');
var komapping = require('knockout.mapping');

var GeoDataInfoPopup = function(options) {
    var container = getElement(options.container);

    var wrapper = document.createElement('div');
    wrapper.className = 'ausglobe-info-container';
    wrapper.setAttribute('data-bind', 'click: closeIfClickOnBackground');
    container.appendChild(wrapper);

    var template = document.createElement('script');
    template.setAttribute('type', 'text/html');
    template.setAttribute('id', 'ausglobe-info-item-template');
    template.innerHTML = '\
            <tr>\
                <td data-bind="click: $root.toggleOpen, css: cssClass">\
                    <!-- ko if: isParent && value.isOpen() -->\
                    <div class="ausglobe-info-properties-arrow" data-bind="cesiumSvgPath: { path: $root._arrowDownPath, width: 32, height: 32 }"></div>\
                    <!-- /ko -->\
                    <!-- ko if: isParent && !value.isOpen() -->\
                    <div class="ausglobe-info-properties-arrow" data-bind="cesiumSvgPath: { path: $root._arrowRightPath, width: 32, height: 32 }"></div>\
                    <!-- /ko -->\
                    <!-- ko if: !isParent -->\
                    <div class="ausglobe-info-properties-arrow"></div>\
                    <!-- /ko -->\
                    <div class="ausglobe-info-properties-name" data-bind="text: name"></div>\
                </td>\
                <!-- ko if: isParent -->\
                    <td></td>\
                <!-- /ko -->\
                <!-- ko if: isArray -->\
                    <td data-bind="foreach: value">\
                        <span data-bind="if: $index() !== 0">; </span>\
                        <span data-bind="text: $data"></span>\
                    </td>\
                <!-- /ko -->\
                <!-- ko ifnot: isParent || isArray -->\
                    <td data-bind="text: value"></td>\
                <!-- /ko -->\
            </tr>\
            <!-- ko if: isParent && value.isOpen() -->\
                <!-- ko template: { name: \'ausglobe-info-item-template\', foreach: value.data } -->\
                <!-- /ko -->\
            <!-- /ko -->';
    container.appendChild(template);

    var info = document.createElement('div');
    info.className = 'ausglobe-info';
    info.innerHTML = '\
        <div class="ausglobe-info-close-button" data-bind="click: close">&times;</div>\
        <h1 data-bind="text: info.Title"></h1>\
        <h2><span data-bind="text: serviceType"></span> URL</h2>\
        <input readonly type="text" data-bind="value: info.base_url" size="80" onclick="this.select();" />\
        <h2>GetCapabilities URL</h2>\
        <a data-bind="attr: { href: getCapabilitiesUrl }, text: getCapabilitiesUrl" target="_blank"></a>\
        <hr />\
        <h2>Layer Details</h2>\
        <table data-bind="template: { name: \'ausglobe-info-item-template\', foreach: layerProperties.data }">\
        </table>\
        <h2>Service Details</h2>\
        <table data-bind="template: { name: \'ausglobe-info-item-template\', foreach: serviceProperties.data }">\
        </table>\
    ';
    wrapper.appendChild(info);

    var viewModel = this._viewModel = {
        _arrowDownPath : 'M8.037,11.166L14.5,22.359c0.825,1.43,2.175,1.43,3,0l6.463-11.194c0.826-1.429,0.15-2.598-1.5-2.598H9.537C7.886,8.568,7.211,9.737,8.037,11.166z',
        _arrowRightPath : 'M11.166,23.963L22.359,17.5c1.43-0.824,1.43-2.175,0-3L11.166,8.037c-1.429-0.826-2.598-0.15-2.598,1.5v12.926C8.568,24.113,9.737,24.789,11.166,23.963z'
    };

    viewModel.info = options.viewModel;
    
    viewModel.layer = {};

    function addBindingProperties(o, level) {
        o = knockout.utils.unwrapObservable(o);

        if (typeof o !== 'object' || o instanceof Array) {
            return;
        }

        var array = o.data;
        if (!defined(array)) {
            array = o.data = knockout.observableArray();
            o.isOpen = knockout.observable(true);
        }

        array.removeAll();

        for (var property in o) {
            if (o.hasOwnProperty(property) && property !== '__ko_mapping__' && property !== 'data' && property !== 'isOpen') {
                var value = knockout.utils.unwrapObservable(o[property]);

                var cssClass = 'ausglobe-info-properties-level' + level;
                var isParent;

                if (property === 'BoundingBox' && value instanceof Array) {
                    for (var i = 0; i < value.length; ++i) {
                        var subValue = knockout.utils.unwrapObservable(value[i]);
                        addBindingProperties(subValue, level + 1);

                        isParent = typeof subValue === 'object' && !(subValue instanceof Array);

                        array.push({
                            name : property + ' (' + knockout.utils.unwrapObservable(subValue.CRS) + ')',
                            value : subValue,
                            isParent : isParent,
                            isArray : subValue instanceof Array,
                            cssClass : isParent ? cssClass + ' ausglobe-info-properties-parent' : cssClass
                        });
                    }
                } else {
                    addBindingProperties(value, level + 1);

                    isParent = typeof value === 'object' && !(value instanceof Array);

                    array.push({
                        name : property,
                        value : value,
                        isParent : typeof value === 'object' && !(value instanceof Array),
                        isArray : value instanceof Array,
                        cssClass : isParent ? cssClass + ' ausglobe-info-properties-parent' : cssClass
                    });
                }
            }
        }
    }

    viewModel.layerProperties = komapping.fromJS({});
    viewModel.serviceProperties = komapping.fromJS({});

    addBindingProperties(viewModel.layerProperties, 1);
    addBindingProperties(viewModel.serviceProperties, 1);

    viewModel.close = function() {
        container.removeChild(wrapper);
    };
    viewModel.closeIfClickOnBackground = function(viewModel, e) {
        if (e.target === wrapper) {
            viewModel.close();
        }
        return true;
    };

    viewModel.toggleOpen = function(item) {
        if (defined(item.value)) {
            item.value.isOpen(!item.value.isOpen());
        }
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
        return viewModel.info.base_url() + '?service=WMS&version=1.3.0&request=GetCapabilities';
    });

    var getCapabilitiesUrl = viewModel.getCapabilitiesUrl();
    if (viewModel.info.proxy()) {
        getCapabilitiesUrl = corsProxy.getURL(getCapabilitiesUrl);
    }

    var layerName = viewModel.info.Name();

    if (viewModel.info.type() === 'WMS') {
        when(loadXML(getCapabilitiesUrl), function(capabilities) {
            function findLayer(startLayer, name) {
                if (startLayer.Name === name || startLayer.Title === name) {
                    return startLayer;
                }

                var layers = startLayer.Layer;
                if (!defined(layers)) {
                    return undefined;
                }

                var found;
                for (var i = 0; !found && i < layers.length; ++i) {
                    var layer = layers[i];
                    found = findLayer(layer, name);
                }

                return found;
            }

            var json = $.xml2json(capabilities);
            var layer = findLayer(json.Capability.Layer, layerName);

            komapping.fromJS(json.Service, viewModel.serviceProperties);
            komapping.fromJS(layer, viewModel.layerProperties);

            addBindingProperties(viewModel.layerProperties, 1);
            addBindingProperties(viewModel.serviceProperties, 1);
        });
    }

    knockout.applyBindings(this._viewModel, wrapper);
};

module.exports = GeoDataInfoPopup;
