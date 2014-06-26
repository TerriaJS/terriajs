"use strict";

/*global require,Cesium,$*/
var defined = Cesium.defined;
var getElement = Cesium.getElement;
var when = Cesium.when;
var loadXML = Cesium.loadXML;

var corsProxy = require('../corsProxy');
var knockout = require('knockout');
var komapping = require('knockout.mapping');

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
                result += escapeHTML(keywordNode.textContent.trim());
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
            value : 'MinX: ' + escapeHTML(minx) + ' MinY: ' + escapeHTML(miny) + '<br />MaxX: ' + escapeHTML(maxx) + ' MaxY: ' + escapeHTML(maxy)
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
            value : 'West: ' + escapeHTML(west) + '° South: ' + escapeHTML(south) + '°<br />East: ' + escapeHTML(east) + '° North: ' + escapeHTML(north) + '°'
        };
    },

    ContactInformation : function(node, xml) {
        var contactPerson = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactPersonPrimary/wms:ContactPerson'));
        var contactOrganization = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactPersonPrimary/wms:ContactOrganization'));
        var contactPosition = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactPosition'));
        var contactAddress = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactAddress/wms:Address'));
        var contactCity = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactAddress/wms:City'));
        var contactState = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactAddress/wms:StateOrProvince'));
        var contactPostCode = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactAddress/wms:PostCode'));
        var contactCountry = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactAddress/wms:Country'));
        var contactVoiceTelephone = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactVoiceTelephone'));
        var contactFacsimileTelephone = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactFacsimileTelephone'));
        var contactElectronicMailAddress = escapeHTML(getXmlValue(xml, node, wmsNamespaceResolver, 'wms:ContactElectronicMailAddress'));

        return {
            name : 'ContactInformation',
            value : ''
        };
    }
};

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
                <td data-bind="text: name, click: $root.toggleOpen, css: levelCssClass"></td>\
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

                addBindingProperties(value, level + 1);

                array.push({
                    name : property,
                    value : value,
                    isParent : typeof value === 'object' && !(value instanceof Array),
                    isArray : value instanceof Array,
                    levelCssClass : 'ausglobe-info-properties-level' + level
                });
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
        } else if (layerNode.nodeType === Node.ELEMENT_NODE && layerNode.childNodes.length === 1 &&
                   (layerNode.childNodes[0].nodeType === Node.TEXT_NODE || layerNode.childNodes[0].nodeType === Node.CDATA_SECTION_NODE)) {
            newItem = {
                name : layerNode.nodeName,
                value : escapeHTML(layerNode.textContent.trim())
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

function escapeHTML(s)
{
    if (!defined(s)) {
        return s;
    }

    var div = document.createElement('div');
    var text = document.createTextNode(s);
    div.appendChild(text);
    return div.innerHTML;
}

module.exports = GeoDataInfoPopup;
