"use strict";

/*global require,Cesium*/
var getElement = Cesium.getElement;
var when = Cesium.when;
var loadXML = Cesium.loadXML;

var corsProxy = require('../corsProxy');
var knockout = require('knockout');

var metadataConversions = {
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

    EX_GeographicBoundingBox : function(node, xml) {
        var west = getXmlValue(xml, node, wmsNamespaceResolver, 'wms:westBoundLongitude');
        var south = getXmlValue(xml, node, wmsNamespaceResolver, 'wms:southBoundLatitude');
        var east = getXmlValue(xml, node, wmsNamespaceResolver, 'wms:eastBoundLongitude');
        var north = getXmlValue(xml, node, wmsNamespaceResolver, 'wms:northBoundLatitude');

        if (!west || !south || !east || !north) {
            return undefined;
        }

        return {
            name : node.nodeName,
            value : 'West: ' + west + '° South: ' + south + '° East: ' + east + '° North: ' + north + '°'
        };
    }
};

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
        <table data-bind="foreach: serviceProperties">\
            <tr>\
                <td data-bind="text: name">\
                <td data-bind="text: value">\
            </tr>\
        </table>\
        </div>\
    ';
    wrapper.appendChild(info);

    var viewModel = this._viewModel = {
    };


    viewModel.info = options.viewModel;
    
    viewModel.layer = {};
    viewModel.layerProperties = knockout.observableArray();
    viewModel.serviceProperties = knockout.observableArray();

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

    var getCapabilitiesUrl = viewModel.getCapabilitiesUrl();
    if (viewModel.info.proxy()) {
        getCapabilitiesUrl = corsProxy.getURL(getCapabilitiesUrl);
    }

    viewModel.layerProperties.push({
        name : 'Loading...',
        value : ''
    });

    viewModel.serviceProperties.push({
        name : 'Loading...',
        value : ''
    });

    var layerName = viewModel.info.Name();

    if (viewModel.info.type() === 'WMS') {
        when(loadXML(getCapabilitiesUrl), function(capabilities) {
            viewModel.layerProperties.removeAll();
            viewModel.serviceProperties.removeAll();

            // Find service information in the capabilities document.
            var serviceNode = capabilities.evaluate('//wms:Service', capabilities, wmsNamespaceResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

            // Find the layer in the capabilities document.
            var layerNode = capabilities.evaluate('//wms:Layer[wms:Name="' + layerName + '"]', capabilities, wmsNamespaceResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (!layerNode) {
                layerNode = capabilities.evaluate('//wms:Layer[wms:Title="' + layerName + '"]', capabilities, wmsNamespaceResolver, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            }

            if (layerNode) {
                addOgcMetadata(viewModel.layerProperties, layerNode, capabilities, metadataConversions);
            } else {
                viewModel.layerProperties.push({
                    name : 'Error',
                    value : 'Layer not found in GetCapabilities document.'
                });
            }

            if (serviceNode) {
                addOgcMetadata(viewModel.serviceProperties, serviceNode, capabilities, metadataConversions);
            } else {
                viewModel.serviceProperties.push({
                    name : 'Error',
                    value : 'Service information not found in GetCapabilities document.'
                });
            }
        });
    }

    knockout.applyBindings(this._viewModel, wrapper);
};

function wmsNamespaceResolver(prefix) {
    var ns = {
        'wms' : 'http://www.opengis.net/wms'
    };
    return ns[prefix] || null;
}


function getXmlValue(xml, node, resolver, xpath) {
    var result = xml.evaluate(xpath, node, resolver, XPathResult.STRING_TYPE, null);
    if (result.stringValue) {
        return result.stringValue;
    } else {
        return '';
    }
}

function addOgcMetadata(properties, node, xml, metadataConversions) {
    var keys = {};

    var newItem;

    var layerNodes = node.childNodes;
    for (var i = 0; i < layerNodes.length; ++i) {
        var layerNode = layerNodes[i];

        newItem = undefined;
        if (layerNode.nodeName && metadataConversions[layerNode.nodeName]) {
            newItem = metadataConversions[layerNode.nodeName](layerNode, xml);
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
            properties.push(newItem);
        }
    }
}

module.exports = GeoDataInfoPopup;
