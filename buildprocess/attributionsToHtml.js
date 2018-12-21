/*
  Converts the output of oss-attribution-generator's licenseInfos.json into a human readable HTML.
*/
const licenses = require('./licenseInfos.json');
const fs = require('fs');

function safe(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function infoToHtml(info) {
    Object.keys(info).forEach(k => {
        if (typeof info[k] === 'string') {
            info[k] = safe(info[k]);
        }
    });
    let s = '';
    const npm = 'https://www.npmjs.com/package/' + info.name + '/v/' + info.version;
    s += '<h2><a href="' + npm + '">' + info.name + ' ' + info.version + '</a></h2>\n';
    if (info.url) {
        s += 'Repository: <a href="' + info.url + '">'  + info.url + '</a><br>\n';
    }
    if (info.authors) {
        s += 'Authors: ' + info.authors + '<br>\n'; 
    }
    s += 'License: ' + info.license + '<br>\n';
    s += '<pre>' + info.licenseText + '</pre>\n';
    return s;
}

module.exports = function(licenseInfos, outName) {
    const out = fs.createWriteStream(outName);

    out.write('<html>\n');
    out.write('<h1>License information</h1>\n');
    out.write('TerriaJS uses these open source components, under the following licences.\n');
    Object.keys(licenses).forEach(packageName => {
        out.write(infoToHtml(licenses[packageName]));
    });
    out.write('</html>');
};