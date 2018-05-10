const when = require('terriajs-cesium/Source/ThirdParty/when');

function createPdf(options) {
    const deferred = when.defer();
    require.ensure([
        'pdfkit',
        'blob-stream'
    ], function() {
        const modules = {
            pdfkit: require('pdfkit'),
            blobStream: require('blob-stream')
        };
        new modules.pdfkit().image
        deferred.resolve(create(modules, options));
    }, function(e) {
        deferred.reject(e);
    }, 'pdf');
    return deferred.promise;
}

function create(modules, options) {
    return options.terria.currentViewer.captureScreenshot().then(function(mapImageDataUri) {
        const pdf = new modules.pdfkit(options);
        const stream = pdf.pipe(modules.blobStream());

        console.log('width: ' + pdf.page.width + ' height: ' + pdf.page.height);
        pdf.image(mapImageDataUri, undefined, undefined, {
            fit: [pdf.page.width - pdf.page.margins.left - pdf.page.margins.right, pdf.page.height - pdf.page.margins.top - pdf.page.margins.bottom]
        });
        pdf.text('test');
        pdf.end();

        return streamToBlob(stream);
    });
}

function streamToBlob(stream) {
    const deferred = when.defer();
    stream.on('finish', function() {
        deferred.resolve(stream.toBlob('application/pdf'));
    });
    stream.on('error', function(e) {
        deferred.reject(e);
    });
    return deferred.promise;
}

module.exports = createPdf;
