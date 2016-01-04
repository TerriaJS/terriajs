var VectorTile = require('vector-tile').VectorTile;
var Protobuf = require('pbf');
var loadArrayBuffer = require('terriajs-cesium/Source/Core/loadArrayBuffer');
var WebMercatorTilingScheme = require('terriajs-cesium/Source/Core/WebMercatorTilingScheme');
var MapboxVectorTileImageryProvider = require('./MapboxVectorTileImageryProvider');

function test() {
    // var url = 'https://a.tiles.mapbox.com/v4/steve9164.1rjjq17t/5/30/18.vector.pbf?access_token=pk.eyJ1Ijoic3RldmU5MTY0IiwiYSI6ImNpaWd5b3g1MTAybnh0a2tzODVzc3pncXkifQ.N3eovPIHdr0dZopBqyQb-g';
    // loadArrayBuffer(url).then(function(data) {
    //     var tile = new VectorTile(new Protobuf(data));
    //
    //     var x = new WebMercatorTilingScheme();
    //
    //     var f = tile.layers["1270055001_sa4_2011_aust_shape"].feature(0);
    //     var geo = f.loadGeometry();
    //     var json = f.toGeoJSON(30,18,5).geometry.coordinates;
    //
    // });

    m = new MapboxVectorTileImageryProvider();

    m.requestImage(115,75,7).then(function(canvas) {
        document.body.innerHTML = '';
        document.body.style.backgroundColor = "white";
        document.body.appendChild(canvas);
        document;
    });

    m.requestImage(54,37,6).then(function(canvas) {
        document.body.appendChild(canvas);
        document;
    });
}

module.exports = test;
