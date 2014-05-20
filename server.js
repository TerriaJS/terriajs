/*global require,__dirname*/
/*jshint es3:false*/
var connect = require('connect');

connect.createServer(
 connect.static(__dirname + '/public')
).listen(3001);

console.log('Starting Server');

