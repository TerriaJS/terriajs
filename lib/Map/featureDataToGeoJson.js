'use strict';

/*global require*/
var defined = require('terriajs-cesium/Source/Core/defined');

/**
 * Converts feature data, such as from a WMS GetFeatureInfo or an Esri Identify, to
 * GeoJSON.  The set of feature data formats supported by this function can be extended
 * by adding to {@link featureDataToGeoJson#supportedFormats}.
 *
 * @param {Object} featureData The feature data to convert to GeoJSON.
 * @return {Object} The GeoJSON representation of this feature data, or undefined if it cannot be converted to GeoJSON.
 */
function featureDataToGeoJson(featureData) {
    if (!defined(featureData)) {
        return undefined;
    }

    for (var i = 0; i < featureDataToGeoJson.supportedFormats.length; ++i) {
        var converted = featureDataToGeoJson.supportedFormats[i].converter(featureData);
        if (defined(converted)) {
            return converted;
        }
    }
    return undefined;
}

featureDataToGeoJson.supportedFormats = [
    {
        name: 'GeoJSON',
        converter: convertGeoJson
    },
    {
        name: 'Esri',
        converter: convertEsri
    }
];

function convertGeoJson(featureData) {
    if ((featureData.type === 'Feature' && defined(featureData.geometry)) ||
        (featureData.type === 'FeatureCollection' && defined(featureData.features))) {

        return featureData;
    }
}

function convertEsri(featureData) {
    var geometry = getEsriGeometry(featureData);
    if (defined(geometry)) {
        return {
            type: 'Feature',
            geometry: geometry,
            properties: featureData.attributes,
            crs: esriSpatialReferenceToCrs(featureData.geometry.spatialReference)
        };
    }

    return undefined;
}

function getEsriGeometry(featureData) {
    if (featureData.geometryType === 'esriGeometryPolygon') {
        return {
            type: 'Polygon',
            coordinates: featureData.geometry.rings
        };
    } else if (featureData.geometryType === 'esriGeometryPoint') {
        return {
            type: 'Point',
            coordinates: [featureData.geometry.x, featureData.geometry.y]
        };
    }
}

function esriSpatialReferenceToCrs(spatialReference) {
    if (!defined(spatialReference)) {
        return undefined;
    }

    if (spatialReference.wkid === 102100 || spatialReference.wkid === 3857) {
        return {
            type: 'name',
            properties: {
                name: 'EPSG:3857'
            }
        };
    } else if (spatialReference.wkid === 4326) {
        return {
            type: 'name',
            properties: {
                name: 'EPSG:4326'
            }
        };
    } else if (defined(spatialReference.wkid)) {
        return {
            type: 'name',
            properties: {
                name: 'EPSG:' + spatialReference.wkid
            }
        };
    }
    return undefined;
}

module.exports = featureDataToGeoJson;
