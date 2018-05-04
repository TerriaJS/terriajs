const RuntimeError = require('terriajs-cesium/Source/Core/RuntimeError');
const when = require('terriajs-cesium/Source/ThirdParty/when');

/**
 * Creates a Blob with a PNG representation of the content of a Canvas.
 * @param {HTMLCanvasElement} canvas The canvas.
 * @returns {Promise<Blob>} A promise that resolves to the Blob. The promise will reject if the browser cannot do this.
 */
function canvasToPngBlob(canvas) {
    try {
        if (canvas.toBlob) {
            const deferred = when.defer();
            canvas.toBlob(deferred.resolve.bind(deferred), 'image/png');
            return deferred.promise;
        } else if (canvas.msToBlob) {
            // IE11
            return when.resolve(canvas.msToBlob());
        } else {
            return when.reject(new RuntimeError('This web browser does not support HTMLCanvasElement.toBlob or HTMLCanvasElement.toMsBlob.'));
        }
    } catch(e) {
        return when.reject(e);
    }
}

module.exports = canvasToPngBlob;
