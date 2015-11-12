'use strict';

/*global require,describe,it,expect,beforeEach*/
var FeatureInfoPanelSectionViewModel = require('../../lib/ViewModels/FeatureInfoPanelSectionViewModel');
var Terria = require('../../lib/Models/Terria');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');


describe('FeatureInfoPanelSectionViewModel', function() {
    var terria;
    var feature;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        var properties = {
            name: 'Foo',
            value: 'bar'
        };
        properties.getValue = function() {
            var x = {};
            x[properties.name] = properties.value;
            return x;
        };
        feature = new Entity({
            name: 'Bar',
            properties: properties,
            imageryLayer: {}
        });
    });

    it('uses a white background for complete HTML documents only', function() {
        feature.description = {getValue: function() { return '<html><body>hi!</body></html>'}};
        var section = new FeatureInfoPanelSectionViewModel(terria, feature);
        expect(section.useWhiteBackground).toBe(true);
        section.destroy();

        feature.description = {getValue: function() { return '<div>hi!</div>'}};
        section = new FeatureInfoPanelSectionViewModel(terria, feature);
        expect(section.useWhiteBackground).toBe(false);
        section.destroy();

        feature.description = {getValue: function() { return '<html attr="yes">\n<body>hi!</body>\n</html>'}};
        section = new FeatureInfoPanelSectionViewModel(terria, feature);
        expect(section.useWhiteBackground).toBe(true);
        section.destroy();
    });

});
