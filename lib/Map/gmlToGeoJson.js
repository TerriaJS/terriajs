'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');
var RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');

var gmlNamespace = 'http://www.opengis.net/gml';

/**
 * Converts a GML v3.1.1 simple features document to GeoJSON.
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

        var feature = {
            type: 'Feature',
            geometry: getGmlGeometry(featureMember),
            properties: properties
        };

        if (defined(feature.geometry)) {
            result.push(feature);
        }
    }

    return {
        type: 'FeatureCollection',
        crs: { type: 'EPSG', properties: { code: '4326' } },
        features: result
    };
}

var gmlSimpleFeatureNames = [
    'Curve',
    'LineString',
    'Point',
    'Polygon',
    'MultiCurve',
    'MultPoint',
    'MultiSurface',
    'Surface'
];

function getGmlPropertiesRecursively(gmlNode, properties) {
    var isSingleValue = true;

    for (var i = 0; i < gmlNode.childNodes.length; ++i) {
        var child = gmlNode.childNodes[i];

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

    for (var i = 0; !defined(result) && i < gmlNode.childNodes.length; ++i) {
        var child = gmlNode.childNodes[i];

        if (gmlSimpleFeatureNames.indexOf(child.localName) >= 0) {
            return createGeoJsonGeometryFeatureFromGmlGeometry(child);
        } else {
            result = getGmlGeometry(child);
        }
    }

    return result;
}

function createLineStringFromGmlGeometry(geometry) {
    var coordinates = [];

    var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'posList');
    for (var i = 0; i < posNodes.length; ++i) {
        var positions = gml2coord(posNodes[i].textContent);
        for (var j = 0; j < positions.length; ++j) {
            coordinates.push(positions[j]);
        }
    }

    return {
        type: 'LineString',
        coordinates: coordinates
    };
}

function createPointFromGmlGeometry(geometry) {
    var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'pos');
    if (posNodes < 1) {
        throw new RuntimeError('GML point element is missing a pos element.');
    }

    return {
        type: 'Point',
        coordinates: gml2coord(posNodes[0].textContent)[0]
    };
}

function createMultiLineStringFromGmlGeometry(geometry) {
    var curveMembers = geometry.getElementsByTagNameNS(gmlNamespace, 'posList');
    var curves = [];
    for (var i = 0; i < curveMembers.length; ++i) {
        curves.push(gml2coord(curveMembers[i].textContent));
    }

    return {
        type: 'MultiLineString',
        coordinates: curves
    };
}

function createMultiPolygonFromGmlGeomtry(geometry) {
    var coordinates = [];

    var polygons = geometry.getElementsByTagNameNS(gmlNamespace, 'Polygon');
    for (var i = 0; i < polygons.length; ++i) {
        var polygon = polygons[i];
        var exteriorNodes = polygon.getElementsByTagNameNS(gmlNamespace, 'exterior');
        if (exteriorNodes.length < 1) {
            throw new RuntimeError('GML polygon is missing its exterior ring.');
        }

        var polygonCoordinates = [];

        var exterior = exteriorNodes[0];
        var posListNodes = exterior.getElementsByTagNameNS(gmlNamespace, 'posList');
        if (posListNodes.length < 1) {
            throw new RuntimeError('GML polygon\'s exterior ring is missing a posList.');
        }

        polygonCoordinates.push(gml2coord(posListNodes[0].textContent));

        var interiors = polygon.getElementsByTagNameNS(gmlNamespace, 'interior');
        for (var j = 0; j < interiors.length; ++j) {
            var interior = interiors[j];
            var interiorPosListNodes = interior.getElementsByTagNameNS(gmlNamespace, 'posList');
            if (interiorPosListNodes.length < 1) {
                continue;
            }

            polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent));
        }

        coordinates.push(polygonCoordinates);
    }

    return {
        type: 'MultiPolygon',
        coordinates: coordinates
    };
}

function createPolygonFromGmlGeometry(geometry) {
    var polygonCoordinates = [];

    var exteriorNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'exterior');
    if (exteriorNodes.length < 1) {
        throw new RuntimeError('GML polygon is missing its exterior ring.');
    }

    var exterior = exteriorNodes[0];
    var posListNodes = exterior.getElementsByTagNameNS(gmlNamespace, 'posList');
    if (posListNodes.length < 1) {
        throw new RuntimeError('GML polygon\'s exterior ring is missing a posList.');
    }

    polygonCoordinates.push(gml2coord(posListNodes[0].textContent));

    var interiors = geometry.getElementsByTagNameNS(gmlNamespace, 'interior');
    for (var j = 0; j < interiors.length; ++j) {
        var interior = interiors[j];
        var interiorPosListNodes = interior.getElementsByTagNameNS(gmlNamespace, 'posList');
        if (interiorPosListNodes.length < 1) {
            continue;
        }

        polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent));
    }

    return {
        type: 'Polygon',
        coordinates: polygonCoordinates
    };
}

function createMultiPointFromGmlGeometry(geometry) {
    var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'pos');

    var coordinates = [];

    for (var i = 0; i < posNodes.length; ++i) {
        coordinates.push(gml2coord(posNodes[i].textContent)[0]);
    }

    return {
        type: 'MultiPoint',
        coordinates: coordinates
    };
}

var featureCreators = {
    Curve: createLineStringFromGmlGeometry,
    LineString: createLineStringFromGmlGeometry,
    Point: createPointFromGmlGeometry,
    Polygon: createPolygonFromGmlGeometry,
    MultiCurve: createMultiLineStringFromGmlGeometry,
    MultPoint: createMultiPointFromGmlGeometry,
    MultiSurface: createMultiPolygonFromGmlGeomtry,
    Surface: createPolygonFromGmlGeometry

};

function createGeoJsonGeometryFeatureFromGmlGeometry(geometry) {
    var type = geometry.localName;
    var creator = featureCreators[type];
    if (!defined(creator)) {
        throw new RuntimeError('GML contains unsupported feature type: ' + type);
    }

    return creator(geometry);
}

function isNotEmpty(s) {
    return s.length !== 0;
}

//Utility function to change esri gml positions to geojson positions
function gml2coord(posList) {
    var pnts = posList.split(/[ ,]+/).filter(isNotEmpty);
    var coords = [];
    for (var i = 0; i < pnts.length; i+=2) {
        coords.push([parseFloat(pnts[i+1]), parseFloat(pnts[i])]);
    }
    return coords;
}

module.exports = gmlToGeoJson;