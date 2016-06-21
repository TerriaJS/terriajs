'use strict';

/*global require*/
var Terria = require('../../lib/Models/Terria');

describe('Terria', function() {
    var terria;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
    });

    it('initializes proxy with parameters from config file', function(done) {
        terria.start({
            configUrl: 'test/init/configProxy.json'
        }).then(function() {
            expect(terria.corsProxy.baseProxyUrl).toBe('/myproxy/');
            expect(terria.corsProxy.proxyDomains).toEqual([
                "example.com",
                "csiro.au"
            ]);
        }).then(done).otherwise(done.fail);
    });
});
