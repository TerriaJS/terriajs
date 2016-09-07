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
function gmlToGeoJson(xml, flipCoords) {
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
            geometry: getGmlGeometry(featureMember, flipCoords),
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

function getGmlGeometry(gmlNode, flipCoords) {
    var result;

    for (var i = 0; !defined(result) && i < gmlNode.childNodes.length; ++i) {
        var child = gmlNode.childNodes[i];

        if (gmlSimpleFeatureNames.indexOf(child.localName) >= 0) {
            return createGeoJsonGeometryFeatureFromGmlGeometry(child, flipCoords);
        } else {
            result = getGmlGeometry(child, flipCoords);
        }
    }

    return result;
}

function createLineStringFromGmlGeometry(geometry, flipCoords) {
    var coordinates = [];

    var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'posList');
    for (var i = 0; i < posNodes.length; ++i) {
        var positions = gml2coord(posNodes[i].textContent, flipCoords);
        for (var j = 0; j < positions.length; ++j) {
            coordinates.push(positions[j]);
        }
    }

    return {
        type: 'LineString',
        coordinates: coordinates
    };
}

function createPointFromGmlGeometry(geometry, flipCoords) {
    var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'pos');
    if (posNodes < 1) {
        throw new RuntimeError('GML point element is missing a pos element.');
    }

    return {
        type: 'Point',
        coordinates: gml2coord(posNodes[0].textContent, flipCoords)[0]
    };
}

function createMultiLineStringFromGmlGeometry(geometry, flipCoords) {
    var curveMembers = geometry.getElementsByTagNameNS(gmlNamespace, 'posList');
    var curves = [];
    for (var i = 0; i < curveMembers.length; ++i) {
        curves.push(gml2coord(curveMembers[i].textContent, flipCoords));
    }

    return {
        type: 'MultiLineString',
        coordinates: curves
    };
}

function createMultiPolygonFromGmlGeomtry(geometry, flipCoords) {
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

            polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent, flipCoords));
        }

        coordinates.push(polygonCoordinates);
    }

    return {
        type: 'MultiPolygon',
        coordinates: coordinates
    };
}

function createPolygonFromGmlGeometry(geometry, flipCoords) {
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

    polygonCoordinates.push(gml2coord(posListNodes[0].textContent, flipCoords));

    var interiors = geometry.getElementsByTagNameNS(gmlNamespace, 'interior');
    for (var j = 0; j < interiors.length; ++j) {
        var interior = interiors[j];
        var interiorPosListNodes = interior.getElementsByTagNameNS(gmlNamespace, 'posList');
        if (interiorPosListNodes.length < 1) {
            continue;
        }

        polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent, flipCoords));
    }

    return {
        type: 'Polygon',
        coordinates: polygonCoordinates
    };
}

function createMultiPointFromGmlGeometry(geometry, flipCoords) {
    var posNodes = geometry.getElementsByTagNameNS(gmlNamespace, 'pos');

    var coordinates = [];

    for (var i = 0; i < posNodes.length; ++i) {
        coordinates.push(gml2coord(posNodes[i].textContent, flipCoords)[0]);
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

function createGeoJsonGeometryFeatureFromGmlGeometry(geometry, flipCoords) {
    var type = geometry.localName;
    var creator = featureCreators[type];
    if (!defined(creator)) {
        throw new RuntimeError('GML contains unsupported feature type: ' + type);
    }

    return creator(geometry, flipCoords);
}

function isNotEmpty(s) {
    return s.length !== 0;
}
    
//Utility function to change esri gml positions to geojson positions
function gml2coord(posList, flipCoords) {
    var pnts = posList.split(/[ ,]+/).filter(isNotEmpty);
    var coords = [];
    for (var i = 0; i < pnts.length; i+=2) {
        if (!flipCoords) {
            coords.push([parseFloat(pnts[i+1]), parseFloat(pnts[i])]);
        } else {
            // This mode exists for servers which declare EPSG:4326 but serve coordinates in lon-lat order. It must be manually set.
            coords.push([parseFloat(pnts[i]), parseFloat(pnts[i+1])]);
        }
    }
    return coords;
}

module.exports = gmlToGeoJson;