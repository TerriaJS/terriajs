'use strict';

/*global $*/

function gmlToGeoJson(xml) {
    var json = $.xml2json(xml);

    var newObj = {type: "FeatureCollection", crs: {"type":"EPSG","properties":{"code":"4326"}}, features: []};

    function pointFilterFunction(obj, prop) {
        newObj.features.push(convertFeature(obj[prop], 'Point'));
    }

    function lineStringFilterFunction(obj, prop) {
        newObj.features.push(convertFeature(obj[prop], 'LineString'));
    }

    function polygonFilterFunction(obj, prop) {
        newObj.features.push(convertFeature(obj[prop], 'Polygon'));
    }

    for (var i = 0; i < json.featureMember.length; i++) {
           //TODO: get feature properties from non-SHAPE properties if present
        //feature.properties = feature.attributes;

        //Recursively find features and add to FeatureCollection
        filterValue(json.featureMember[i], 'Point', pointFilterFunction);
        filterValue(json.featureMember[i], 'LineString', lineStringFilterFunction);
        filterValue(json.featureMember[i], 'Polygon', polygonFilterFunction);
    }

    return newObj;
}

//Utility function to convert esri gml based feature to geojson
function convertFeature(feature, geom_type) {
    var newFeature = {type: "Feature"};
    var pts = (geom_type === 'Point') ? gml2coord(feature.pos)[0] : gml2coord(feature.posList);
    newFeature.geometry = { "type": geom_type, "coordinates": pts };
    return newFeature;
}  

// find a member by name in the gml
function filterValue(obj, prop, func) {
    for (var p in obj) {
        if (obj.hasOwnProperty(p) === false) {
            continue;
        }
        else if (p === prop) {
            if (func && (typeof func === 'function')) {
                (func)(obj, prop);
            }
        }
        else if (typeof obj[p] === 'object') {
            filterValue(obj[p], prop, func);
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