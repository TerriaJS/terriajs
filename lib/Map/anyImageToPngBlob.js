const canvasToPngBlob = require('./canvasToPngBlob');

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
    context.drawImage(image, 0, 0);
    return canvasToPngBlob(canvas);
}

module.exports = anyImageToPngBlob;
