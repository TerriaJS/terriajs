'use strict';

/*global require*/
var URI = require('urijs');
var knockout = require('terriajs-cesium/Source/ThirdParty/knockout');

var CesiumMath = require('terriajs-cesium/Source/Core/Math');
var defined = require('terriajs-cesium/Source/Core/defined');
var loadBlob = require('terriajs-cesium/Source/Core/loadBlob');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');
var sprintf = require('terriajs-cesium/Source/ThirdParty/sprintf');

var MapInteractionMode = require('./MapInteractionMode');
var proxyCatalogItemUrl = require('./proxyCatalogItemUrl');
var ResultPendingCatalogItem = require('./ResultPendingCatalogItem');
var TerriaError = require('../Core/TerriaError');


const callWebCoverageService = function(wmsCatalogItem) {
//     this.terria = terria;
//     this.rectangle = undefined;
// };

// WebCoverageServiceCaller.prototype.startPicking = function() {
//     const terria = this.terria;
    // Cancel any feature picking already in progress.
    const terria = wmsCatalogItem.terria;
    terria.pickedFeatures = undefined;

    const pickPointMode = new MapInteractionMode({
        message: 'Press the SHIFT key and hold down the left mouse button to draw a rectangle to download',
        drawRectangle: true,
        onCancel: () => {
            terria.mapInteractionModeStack.pop();
            terria.selectBox = false;
        }
    });
    terria.selectBox = true;
    terria.mapInteractionModeStack.push(pickPointMode);

    knockout.getObservable(pickPointMode, 'pickedFeatures').subscribe((pickedFeatures) => {
        if (pickedFeatures instanceof Rectangle) {
            terria.mapInteractionModeStack.pop();
            terria.selectBox = false;
            launch(wmsCatalogItem, pickedFeatures);
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
    var uri = new URI(wmsCatalogItem.linkedWcsURL).query(query);

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

        // Adapted from http://www.alexhadik.com/blog/2016/7/7/l8ztp8kr5lbctf5qns4l8t3646npqh
        //Create a link element, hide it, direct
        //it towards the blob, and then 'click' it programatically
        const a = document.createElement("a");
        a.style = "display: none";
        document.body.appendChild(a);
        //Create a DOMString representing the blob
        //and point the link element towards it
        const blobUrl = window.URL.createObjectURL(blob);
        a.href = blobUrl;
        a.download = `${wmsCatalogItem.name} clip.tiff`;
        //programatically click the link to trigger the download
        a.click();
        //release the reference to the file by revoking the Object URL
        window.URL.revokeObjectURL(blobUrl);

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

module.exports = callWebCoverageService;
