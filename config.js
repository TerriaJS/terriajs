'use strict';

// If we're running inside a docker container, we'll have our mongo
// dependency provided in environment variables. In the case where we
// are running inside the docker container, but using  an external
// (non dockerized) mongo instance, these variables can still be set
// on the docker command line with -e
var mongoAddr = process.env['MONGODB_PORT_27017_TCP_ADDR'];
var mongoPort = process.env['MONGODB_PORT_27017_TCP_PORT'];

if (typeof mongoAddr !== 'undefined' && typeof mongoPort !== 'undefined') {
  var connString = 'mongodb://'+mongoAddr+':'+mongoPort;
  module.exports = {
    db: {
      production: connString + "/geospace-prod",
      development: connString  + "/geospace-dev",
      test: connString + "/geospace-test",
    }
  }
} else {
  module.exports = {
   db: {
     production: "mongodb://geospace:geospace@geospace.research.nicta.com.au:1234/geospace-prod",
     development: "mongodb://localhost/geospace-dev",
     test: "mongodb://localhost/geospace-test",
   }
  };
}
