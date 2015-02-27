'use strict';

/*global require*/
var defined = require('../../third_party/cesium/Source/Core/defined');

var gmlNamespace = 'http://www.opengis.net/gml';

/**
 * Converts a GML v3.1.1 document to GeoJSON.
 * @param  {Document|String} xml The GML document.
 * @return {Object} The GeoJSON object.
 */
function gmlToGeoJson(xml) {
    if (typeof xml === 'string') {
        var parser = new DOMParser();
        xml = parser.parseFromString(xml, 'text/xml');
    }

    var result = [];

    var featureCollection = xml.documentElement;

    var featureMembers = featureCollection.getElementsByTagNameNS(gmlNamespace, 'featureMember');
    for (var featureIndex = 0; featureIndex < featureMembers.length; ++featureIndex) {
        var featureMember = featureMembers[featureIndex];

        var properties = {};

        getGmlPropertiesRecursively(featureMember, properties);

        result.push({
            type: 'Feature',
            geometry: getGmlGeometry(featureMember),
            properties: properties
        });
    }

    return {
        type: 'FeatureCollection',
        crs: { type: 'EPSG', properties: { code: '4326' } },
        features: result
    };
}

var gmlSimpleFeatureNames = [
    'LineString',
    'Curve',
    'LineStringSegment',
    'Polygon',
    'Surface',
    'PolygonPatch',
    'Point',
    'MultiCurve',
    'MultPoint',
    'MultiSurface'
];

function getGmlPropertiesRecursively(gmlNode, properties) {
    var isSingleValue = true;

    for (var i = 0; i < gmlNode.children.length; ++i) {
        var child = gmlNode.children[i];

        if (child.nodeType === Node.ELEMENT_NODE) {
            isSingleValue = false;
        }

        if (gmlSimpleFeatureNames.indexOf(child.localName) >= 0) {
            continue;
        }

        if (child.hasChildNodes() && getGmlPropertiesRecursively(child, properties)) {
            properties[child.localName] = child.textContent;
        }
    }

    return isSingleValue;
}

function getGmlGeometry(gmlNode) {
    var result;

    for (var i = 0; !defined(result) && i < gmlNode.children.length; ++i) {
        var child = gmlNode.children[i];

        if (gmlSimpleFeatureNames.indexOf(child.localName) >= 0) {
            return createGeoJsonGeometryFeatureFromGmlGeometry(child);
        } else {
            result = getGmlGeometry(child);
        }
    }

    return result;
}

function createGeoJsonGeometryFeatureFromGmlGeometry(geometry) {
    var type = geometry.localName;
    if (type === 'Point') {
        var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'pos');
        if (posNodes.length >= 1) {
            return {
                type: 'Point',
                coordinates: gml2coord(posNodes[0].textContent)[0]
            };
        }
    }
}

//Utility function to change esri gml positions to geojson positions
function gml2coord(posList) {
    var pnts = posList.split(/[ ,]+/);
    var coords = [];
    for (var i = 0; i < pnts.length; i+=2) {
        coords.push([parseFloat(pnts[i+1]), parseFloat(pnts[i])]);
    }
    return coords;
}

module.exports = gmlToGeoJson;