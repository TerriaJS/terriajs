'use strict';

/*global require*/
var xml2json = require('../ThirdParty/xml2json');
var defined = require('terriajs-cesium/Source/Core/defined');
var ImageryLayerFeatureInfo = require('terriajs-cesium/Source/Scene/ImageryLayerFeatureInfo');
var loadXML = require('terriajs-cesium/Source/Core/loadXML');

/**
 * Monkey patch a WebMapServiceCatalogItem to replace the default GetFeatureInfo call with a call
 * to a Web Processing Service. The Web Processing Service url is a template which will receive the
 * point (lon,lat) coords as geojson and layer name. An example template is:
 *
 * http://oa-gis.csiro.au/wps?version=1.0.0&request=Execute&service=WPS
 *                &Identifier=get-value-at-point
 *                &DataInputs=LonLatPosition={geojson_point};layerKey={layer}
 *
 *
 * @param {Terria} terria Terria object.
 * @param {WebMapServiceCatalogItem} catalogItem The web map service catalog item that will have its pickFeatures function overriden with a call to the WPS.
 * @param {String} getFeatureInfoUrl The OGC WPS template url - see above for an example.
 */
function createPickFeaturesUsingWebProcessingService(terria, catalogItem, getFeatureInfoUrl) {

          catalogItem.pickFeatures = function(tileX, tileY, tileLevel, lon, lat) {
            var geojson = {
               'type': 'FeatureCollection',
              'features': [
                {
                  'type': 'Feature',
                  'geometry': {
                    'type': 'Point',
                    'coordinates': [ lon*57.2958 , lat*57.2958 ]
                  }
                }
              ]
            };

            var submitUrl =  getFeatureInfoUrl.replace('{geojson_point}', encodeURIComponent(JSON.stringify(geojson))).replace('{layer}', encodeURIComponent(catalogItem.layers));
            return loadXML(proxyUrl(terria, submitUrl)).then(function(xml) {
              var resultData;
              var results = [];

               if (!xml || !xml.documentElement || (xml.documentElement.localName !== 'ExecuteResponse')) {
                resultData = {'Error': 'ExecuteResponse on get-value-at-point failed: '+submitUrl};
               } else {
                var json = xml2json(xml);

                var executeStatus = json.Status;
                if (defined(executeStatus.ProcessFailed)) {
                  var errorMessage = "No error message - problem is unknown";
                  if (defined(executeStatus.ProcessFailed.ExceptionReport.Exception.ExceptionText)) {
                    errorMessage = executeStatus.ProcessFailed.ExceptionReport.Exception.ExceptionText;
                  } else if (defined(executeStatus.ProcessFailed.ExceptionReport.Exception.Exception)) {
                    errorMessage = executeStatus.ProcessFailed.ExceptionReport.Exception.Exception;
                  }
                  resultData = { 'Error': errorMessage };
                } else {
                  if (defined(json.ProcessOutputs.Output.Data.LiteralData)) {
                    resultData = { 'Value': json.ProcessOutputs.Output.Data.LiteralData.text };
                  } else {
                    resultData = { 'Error': "No LiteralData returned from WPS "+submitUrl };
                  }
                }
              }
              var featureInfo = new ImageryLayerFeatureInfo();
              featureInfo.data = resultData;
              featureInfo.properties = resultData;
              featureInfo.configureDescriptionFromProperties(resultData);
              featureInfo.name = catalogItem.layers;
              results.push(featureInfo);
              return results;
            }).otherwise(function() {
              var results = [];
              var featureInfo = new ImageryLayerFeatureInfo();
              featureInfo.data = { 'Error': 'Pick features from web map service layer failed: '+submitUrl };
              featureInfo.name = catalogItem.layers;
              featureInfo.properties = featureInfo.data;
              results.push(featureInfo);
              return results;
            });
          };

    return catalogItem;
}

function proxyUrl(terria, url) {
    if (defined(terria.corsProxy) && terria.corsProxy.shouldUseProxy(url)) {
          return terria.corsProxy.getURL(url);
    }
    return url;
}

module.exports = createPickFeaturesUsingWebProcessingService;
