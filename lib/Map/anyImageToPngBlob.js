const canvasToPngBlob = require('./canvasToPngBlob');
const canvg = require('canvg');
const when = require('terriajs-cesium/Source/ThirdParty/when');
// const FeatureDetection = require('terriajs-cesium/Source/Core/FeatureDetection');

/**
 * Creates a Blob in PNG format from any image by drawing it to a canvas and calling {@link canvasToPngBlob}
 * @param {HTMLImageElement} image The image
 * @returns {Promise<Blob>} A promise that resolves to the Blob. The promise will reject if the browser cannot do this.
 */
function anyImageToPngBlob(image) {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const context = canvas.getContext('2d');

    if (image.src.indexOf('image/svg+xml') >= 0) {
        const commaIndex = image.src.indexOf(',');
        const svg = decodeURIComponent(image.src.substring(commaIndex + 1));
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);

        const deferred = when.defer();
        canvg(canvas, svg, {
            useCORS: true,
            log: true,
            ignoreMouse: true,
            ignoreAnimation: true,
            ignoreClear: true,
            renderCallback: deferred.resolve
        });
        return deferred.promise.then(function() {
            return canvasToPngBlob(canvas);
        });
    } else {
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        return canvasToPngBlob(canvas);
    }
}

module.exports = anyImageToPngBlob;
