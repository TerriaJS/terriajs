"use strict";

/*global require,Cesium*/
var getElement = Cesium.getElement;
var when = Cesium.when;
var loadXML = Cesium.loadXML;

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
        <table data-bind="foreach: layerProperties">\
            <tr>\
                <td data-bind="text: name">\
                <td data-bind="text: value">\
            </tr>\
        </table>\
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
    
    viewModel.layer = {};
    viewModel.layerProperties = knockout.observableArray();

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
        return viewModel.info.base_url() + '?service=WMS&version=1.3.0&request=GetCapabilities';
    });

    when(loadXML(viewModel.getCapabilitiesUrl()), function(capabilities) {
        var layerName = viewModel.info.Name();

        // Find the layer in the capabilities document.
        function nsResolver(prefix) {
            var ns = {
                'wms' : 'http://www.opengis.net/wms'
            };
            return ns[prefix] || null;
        }
        var result = capabilities.evaluate('/wms:WMS_Capabilities/wms:Capability/wms:Layer/wms:Layer[wms:Name="' + layerName + '"]', capabilities, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        var node = result.singleNodeValue;
        if (!node) {
            result = capabilities.evaluate('/wms:WMS_Capabilities/wms:Capability/wms:Layer/wms:Layer[wms:Title="' + layerName + '"]', capabilities, nsResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            node = result.singleNodeValue;
            if (!node) {
                viewModel.layer.name('Layer not found in GetCapabilities document.');
                return;
            }
        }

        var conversions = {
            KeywordList : function(node) {
                var result = '';

                var keywordNodes = node.childNodes;
                for (var i = 0; i < keywordNodes.length; ++i) {
                    var keywordNode = keywordNodes[i];
                    if (keywordNode.nodeType === Node.ELEMENT_NODE && keywordNode.childNodes.length === 1 && keywordNode.childNodes[0].nodeType === Node.TEXT_NODE) {
                        if (result.length > 0) {
                            result += '; ';
                        }
                        result += keywordNode.textContent.trim();
                    }
                }

                return {
                    name : node.nodeName,
                    value : result
                };
            },
            BoundingBox : function(node) {
                var crs = node.getAttribute('CRS');
                var minx = node.getAttribute('minx');
                var miny = node.getAttribute('miny');
                var maxx = node.getAttribute('maxx');
                var maxy = node.getAttribute('maxy');

                if (!minx || !miny || !maxx || !maxy) {
                    return undefined;
                }

                return {
                    name : node.nodeName + ' (' + crs + ')',
                    value : 'MinX: ' + minx + ' MinY: ' + miny + ' MaxX: ' + maxx + ' MaxY: ' + maxy
                };
            },

            EX_GeographicBoundingBox : function(node, xml, resolver) {
                var west = getXmlValue(xml, node, resolver, 'wms:westBoundLongitude');
                var south = getXmlValue(xml, node, resolver, 'wms:southBoundLatitude');
                var east = getXmlValue(xml, node, resolver, 'wms:eastBoundLongitude');
                var north = getXmlValue(xml, node, resolver, 'wms:northBoundLatitude');

                if (!west || !south || !east || !north) {
                    return undefined;
                }

                return {
                    name : node.nodeName,
                    value : 'West: ' + west + '° South: ' + south + '° East: ' + east + '° North: ' + north + '°'
                };
            }
        };

        var keys = {};

        var newItem;

        var layerNodes = node.childNodes;
        for (var i = 0; i < layerNodes.length; ++i) {
            var layerNode = layerNodes[i];

            newItem = undefined;
            if (layerNode.nodeName && conversions[layerNode.nodeName]) {
                newItem = conversions[layerNode.nodeName](layerNode, capabilities, nsResolver);
                if (!newItem) {
                    continue;
                }
            } else if (layerNode.nodeType === Node.ELEMENT_NODE && layerNode.childNodes.length === 1 && layerNode.childNodes[0].nodeType === Node.TEXT_NODE) {
                newItem = {
                    name : layerNode.nodeName,
                    value : layerNode.textContent.trim()
                };
            }

            if (!newItem) {
                continue;
            }

            var oldItem = keys[newItem.name];
            if (oldItem) {
                oldItem.value(oldItem.value() + '; ' + newItem.value);
            } else {
                newItem.value = knockout.observable(newItem.value);
                keys[newItem.name] = newItem;
                viewModel.layerProperties.push(newItem);
            }
        }

        //viewModel.layer.name(result.singleNodeValue)
        console.log(result.singleNodeValue);
    });

    knockout.applyBindings(this._viewModel, wrapper);
};

function getXmlValue(xml, node, resolver, xpath) {
    var result = xml.evaluate(xpath, node, resolver, XPathResult.STRING_TYPE, null);
    if (result.stringValue) {
        return result.stringValue;
    } else {
        return '';
    }
}

module.exports = GeoDataInfoPopup;
