var VectorTile = require('vector-tile').VectorTile;
var Protobuf = require('pbf');
var loadArrayBuffer = require('terriajs-cesium/Source/Core/loadArrayBuffer');

function test() {
    loadArrayBuffer('https://a.tiles.mapbox.com/v4/steve9164.1rjjq17t/5/29/19.vector.pbf?access_token=tk.eyJ1Ijoic3RldmU5MTY0IiwiZXhwIjoxNDUwODMxOTQ5LCJpYXQiOjE0NTA4MjgzNDgsInNjb3BlcyI6WyJlc3NlbnRpYWxzIiwic2NvcGVzOmxpc3QiLCJtYXA6cmVhZCIsIm1hcDp3cml0ZSIsInVzZXI6cmVhZCIsInVzZXI6d3JpdGUiLCJ1cGxvYWRzOnJlYWQiLCJ1cGxvYWRzOmxpc3QiLCJ1cGxvYWRzOndyaXRlIiwic3R5bGVzOnJlYWQiLCJmb250czpyZWFkIiwic3R5bGVzOndyaXRlIiwic3R5bGVzOmxpc3QiLCJzdHlsZXM6ZHJhZnQiLCJmb250czpsaXN0IiwiZm9udHM6d3JpdGUiLCJmb250czptZXRhZGF0YSIsImRhdGFzZXRzOnJlYWQiLCJkYXRhc2V0czp3cml0ZSIsInN0eWxlczp0aWxlcyJdLCJjbGllbnQiOiJtYXBib3guY29tIn0.Wp_iBax6c_dD6EcFA_9PGw').then(function(data) {
        console.log("In function");
        var tile = new VectorTile(new Protobuf(data));

        // Contains a map of all layers
        tile.layers;

    });
}

module.exports = test;
