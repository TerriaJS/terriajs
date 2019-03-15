'use strict';

/*global require*/
var URI = require('urijs');
var FileSaver = require('file-saver');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var loadBlob = require('../Core/loadBlob');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');

var MapInteractionMode = require('./MapInteractionMode');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');
var TerriaError = require('../Core/TerriaError');


const callWebCoverageService = function(wmsCatalogItem) {
    const terria = wmsCatalogItem.terria;
    terria.pickedFeatures = undefined;

    const pickPointMode = new MapInteractionMode({
        message: 'Press the SHIFT key and hold down the left mouse button to draw a rectangle to download',
        drawRectangle: true,
        onCancel: () => {
            terria.mapInteractionModeStack.pop();
            terria.selectBox = false;
            subscription.dispose();
        }
    });
    terria.selectBox = true;
    terria.mapInteractionModeStack.push(pickPointMode);

    const subscription = knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe((pickedFeatures) => {
        if (pickedFeatures instanceof Rectangle) {
            terria.mapInteractionModeStack.pop();
            terria.selectBox = false;
            launch(wmsCatalogItem, pickedFeatures);
            subscription.dispose();
        }
    });
};

// WebCoverageServiceCaller.prototype.launch = function () {
function launch(wmsCatalogItem, bbox) {
    // // At the moment just grab the screen extent
    // // Calculate view extent in degrees
    // const bbox = wmsCatalogItem.terria.currentViewer.getCurrentExtent();

    bbox.west = CesiumMath.toDegrees(bbox.west);
    bbox.south = CesiumMath.toDegrees(bbox.south);
    bbox.east = CesiumMath.toDegrees(bbox.east);
    bbox.north = CesiumMath.toDegrees(bbox.north);

    const query = {
        service: 'WCS',
        request: 'GetCoverage',
        version: '1.0.0',
        format: 'GeoTIFF',
        crs: 'EPSG:4326',
        width: 1024,
        height: Math.round(1024*bbox.height/bbox.width),
        coverage: wmsCatalogItem.linkedWcsCoverage,
        bbox: `${bbox.west},${bbox.south},${bbox.east},${bbox.north}`
    };

    if (defined(wmsCatalogItem.discreteTime)) {
        query.time = wmsCatalogItem.discreteTime.toISOString();
    }

    const style = getStyle(wmsCatalogItem);
    if(defined(style)) {
        query.styles = style;
    }

    var uri = new URI(wmsCatalogItem.linkedWcsUrl).query(query);

    var url = proxyCatalogItemUrl(wmsCatalogItem, uri.toString(), '1d');

    var now = new Date();
    var timestamp = sprintf('%04d-%02d-%02dT%02d:%02d:%02d', now.getFullYear(), now.getMonth() + 1, now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds());

    const asyncResult = new ResultPendingCatalogItem(wmsCatalogItem.terria);
    asyncResult.name = wmsCatalogItem.name + ' ' + timestamp;
    asyncResult.description = 'This is the result of exporting data from ' + wmsCatalogItem.name + ' service at ' + timestamp + ' with the input parameters below.';

    const parametersForInfo = [
        {name: 'Bounding box', value: query.bbox},
        {name: 'Format', value: query.format}
    ];
    const inputsSection =
        '<table class="cesium-infoBox-defaultTable">' +
        parametersForInfo.reduce(function(previousValue, parameter) {
            return previousValue +
                '<tr>' +
                    '<td style="vertical-align: middle">' + parameter.name + '</td>' +
                    '<td>' + parameter.value + '</td>' +
                '</tr>';
        }, '') +
        '</table>';

    asyncResult.info.push({
        name: 'Inputs',
        content: inputsSection
    });

    const promise = loadBlob(url).then(blob => {
        if (blob.type.indexOf('xml') !== -1) {
            // Geoserver errors -_-
            wmsCatalogItem.terria.error.raiseEvent(new TerriaError({
                sender: wmsCatalogItem,
                title: 'Data export failed',
                message: 'The Web Coverage Service failed'
            }));
            // Could fetch error details from XML to show to user
            asyncResult.isEnabled = false;
            return;
        }

        FileSaver.saveAs(blob, `${wmsCatalogItem.name} clip.tiff`);

        asyncResult.isEnabled = false;

    }).otherwise(error => {
        wmsCatalogItem.terria.error.raiseEvent(new TerriaError({
            sender: wmsCatalogItem,
            title: 'Data export failed',
            message: `The Web Coverage Service failed: ${error}`
        }));
        asyncResult.isEnabled = false;
    });

    asyncResult.loadPromise = promise;
    asyncResult.isEnabled = true;
}

function getStyle(wmsItem) {
    const thisLayer = wmsItem._thisLayerInRawMetadata;
    if (!defined(thisLayer)) {
        console.log("cannot find current layer");
        return undefined;
    }

    var style;
    const availStyles = wmsItem.availableStyles[thisLayer.Name];
    if(availStyles.length >= 2) {
        const layers = wmsItem.layers.split(',');
        const layerIndex = layers.indexOf(thisLayer.Name);
        if (layerIndex === -1) {
            // Not a valid layer?  Something went wrong.
            console.log("cannot find layer index");
            return undefined;
        }

        const styles = wmsItem.styles.split(',');
        style = styles[layerIndex];

        var styleFound = false;
        for(var i = 0; i < availStyles.length; i++) {
            if(availStyles[i].name === style) {
                styleFound = true;
                break;
            }
        }

        if(!styleFound) {
            style = availStyles[0].name;
        }
    }

    return style;
}

module.exports = callWebCoverageService;
