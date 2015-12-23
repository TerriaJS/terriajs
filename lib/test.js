var VectorTile = require('vector-tile').VectorTile;
var Protobuf = require('pbf');
var loadArrayBuffer = require('terriajs-cesium/Source/Core/loadArrayBuffer');

function test() {
    var url = 'https://a.tiles.mapbox.com/v4/steve9164.1rjjq17t/5/30/18.vector.pbf?access_token=tk.eyJ1Ijoic3RldmU5MTY0IiwiZXhwIjoxNDUwODMyODk1LCJpYXQiOjE0NTA4MjkyOTQsInNjb3BlcyI6WyJlc3NlbnRpYWxzIiwic2NvcGVzOmxpc3QiLCJtYXA6cmVhZCIsIm1hcDp3cml0ZSIsInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiLCJ1cGxvYWRzOnJlYWQiLCJ1cGxvYWRzOmxpc3QiLCJ1cGxvYWRzOndyaXRlIiwic3R5bGVzOnJlYWQiLCJmb250czpyZWFkIiwic3R5bGVzOndyaXRlIiwic3R5bGVzOmxpc3QiLCJzdHlsZXM6ZHJhZnQiLCJmb250czpsaXN0IiwiZm9udHM6d3JpdGUiLCJmb250czptZXRhZGF0YSIsImRhdGFzZXRzOnJlYWQiLCJkYXRhc2V0czp3cml0ZSIsInN0eWxlczp0aWxlcyJdLCJjbGllbnQiOiJtYXBib3guY29tIn0.VAzTxMx07t5O3jR949Codg';
    loadArrayBuffer(url).then(function(data) {
        var tile = new VectorTile(new Protobuf(data));

        var f = tile.layers["1270055001_sa4_2011_aust_shape"].feature(0);
        var geo = f.loadGeometry();
        var json = f.toGeoJSON(5,30,18).geometry.coordinates;

    });
}

module.exports = test;
