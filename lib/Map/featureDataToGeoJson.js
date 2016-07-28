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
    return getEsriGeometry(featureData, featureData.geometryType, featureData.geometry && featureData.geometry.spatialReference);
}

// spatialReference is optional.
function getEsriGeometry(featureData, geometryType, spatialReference) {
    if (defined(featureData.features)) {
        // This is a FeatureCollection.
        return {
            type: 'FeatureCollection',
            crs: esriSpatialReferenceToCrs(featureData.spatialReference),
            features: featureData.features.map(function(subFeatureData) {
                return getEsriGeometry(subFeatureData, geometryType);
            })
        };
    }
    var geoJsonFeature = {
        type: 'Feature',
        geometry: undefined,
        properties: featureData.attributes,
    };
    if (defined(spatialReference)) {
        geoJsonFeature.crs = esriSpatialReferenceToCrs(spatialReference);
    }
    if (geometryType === 'esriGeometryPolygon') {
        geoJsonFeature.geometry = {
            type: 'Polygon',
            coordinates: featureData.geometry.rings
        };
    } else if (geometryType === 'esriGeometryPoint') {
        geoJsonFeature.geometry = {
            type: 'Point',
            coordinates: [featureData.geometry.x, featureData.geometry.y]
        };
    } else if (geometryType === 'esriGeometryPolyline') {
        geoJsonFeature.geometry = {
            type: 'MultiLineString',
            coordinates: featureData.geometry.paths
        };
    } else {
        return undefined;
    }
    return geoJsonFeature;
}

function esriSpatialReferenceToCrs(spatialReference) {
    if (!defined(spatialReference)) {
        return undefined;
    }

    if (spatialReference.wkid === 102100) {
        return {
            type: 'name',
            properties: {
                name: 'EPSG:3857'
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
