'use strict';

/*global require,describe,it,expect,beforeEach*/
var FeatureInfoPanelViewModel = require('../../lib/ViewModels/FeatureInfoPanelViewModel');
var FeatureInfoPanelSectionViewModel = require('../../lib/ViewModels/FeatureInfoPanelSectionViewModel');
var Terria = require('../../lib/Models/Terria');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');


describe('FeatureInfoPanelSectionViewModel', function() {
    var terria;
    var panel;
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

        panel = new FeatureInfoPanelViewModel({
            terria: terria
        });
    });

    afterEach(function() {
        panel.destroy();
        panel = undefined;
    });

    it('uses a white background for complete HTML documents only', function() {
        feature.description = {getValue: function() { return '<html><body>hi!</body></html>'}};
        var section = new FeatureInfoPanelSectionViewModel(panel, feature);
        expect(section.useWhiteBackground).toBe(true);
        section.destroy();

        feature.description = {getValue: function() { return '<div>hi!</div>'}};
        section = new FeatureInfoPanelSectionViewModel(panel, feature);
        expect(section.useWhiteBackground).toBe(false);
        section.destroy();

        feature.description = {getValue: function() { return '<html attr="yes">\n<body>hi!</body>\n</html>'}};
        section = new FeatureInfoPanelSectionViewModel(panel, feature);
        expect(section.useWhiteBackground).toBe(true);
        section.destroy();
    });

    describe('when template is provided', function () {
        var section;

        beforeEach(function () {
            var catalogItem = {
                featureInfoTemplate: '<div>{{blah}}</div>'
            };

            section = new FeatureInfoPanelSectionViewModel(terria, feature, catalogItem);
        });

        describe('rawDataVisible', function () {
            it('should be false on init', function () {
                expect(section.rawDataVisible).toBe(false);
            });

            it('should be true once showRawData is called', function () {
                section.showRawData();

                expect(section.rawDataVisible).toBe(true);
            });

            it('should be false once hideRawData is called', function () {
                section.showRawData();
                section.hideRawData();

                expect(section.rawDataVisible).toBe(false);
            });
        });

        it('rawData should still be available', function() {
           expect(section.rawData).toBeDefined();
        });

        it('templatedInfo should be available', function() {
            expect(section.templatedInfo).toBeDefined();
        });
    });

    describe('when template is not provided', function () {
        var section;

        beforeEach(function () {
            section = new FeatureInfoPanelSectionViewModel(terria, feature, {});
        });

        it('templatedInfo should not be available', function () {
            expect(section.templatedInfo).not.toBeDefined();
        });

        it('rawData should be available', function () {
            expect(section.rawData).toBeDefined();
        });
    });

});
