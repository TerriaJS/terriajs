'use strict';

/*global require,describe,it,expect,beforeEach*/
var FeatureInfoPanelViewModel = require('../../lib/ViewModels/FeatureInfoPanelViewModel');
var FeatureInfoPanelSectionViewModel = require('../../lib/ViewModels/FeatureInfoPanelSectionViewModel');
var Terria = require('../../lib/Models/Terria');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');
var PickedFeatures = require('../../lib/Map/PickedFeatures');
var Ellipsoid = require('terriajs-cesium/Source/Core/Ellipsoid');
var Cartographic = require('terriajs-cesium/Source/Core/Cartographic');


describe('FeatureInfoPanelSectionViewModel', function() {
    var terria;
    var panel;
    var feature;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        var properties = {
            'Foo': 'bar',
            'herp': 'd"e"r,p'
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
        feature.description = {getValue: function() { return '<html><body>hi!</body></html>'; }};
        var section = new FeatureInfoPanelSectionViewModel(panel, feature);
        expect(section.useWhiteBackground).toBe(true);
        section.destroy();

        feature.description = {getValue: function() { return '<div>hi!</div>'; }};
        section = new FeatureInfoPanelSectionViewModel(panel, feature);
        expect(section.useWhiteBackground).toBe(false);
        section.destroy();

        feature.description = {getValue: function() { return '<html attr="yes">\n<body>hi!</body>\n</html>'; }};
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

            section = new FeatureInfoPanelSectionViewModel(panel, feature, catalogItem);
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


    describe('lat and long of the clicked point', function() {
        var section;

        beforeEach(function() {
            var catalogItem = {
                featureInfoTemplate: '<div>{{terria.coords.latitude}} {{terria.coords.longitude}}</div>'
            };
            terria.pickedFeatures = new PickedFeatures();
            terria.pickedFeatures.pickPosition = Ellipsoid.WGS84.cartographicToCartesian(Cartographic.fromDegrees(2, 4, 6));

            section = new FeatureInfoPanelSectionViewModel(panel, feature, catalogItem);
        });

        it('should be available to the template', function() {
            expect(section.templatedInfo).toBe('<div>3.999999999999998 2</div>');
        });

        it('should not be present in raw data', function() {
            expect(section.rawData.terria).toBeUndefined();
        });

        it('should not stop CSVs from being available', function() {
            expect(section.dataDownloads.length).toBe(2);
        });
    });

    it('lat and long of the clicked point are available with time-varying properties', function() {
        // Added because it used to only work for constant properties - see https://github.com/TerriaJS/terriajs/pull/1595 .
        var catalogItem = {
            featureInfoTemplate: '<div>{{terria.coords.latitude}} {{terria.coords.longitude}}</div>'
        };
        terria.pickedFeatures = new PickedFeatures();
        terria.pickedFeatures.pickPosition = Ellipsoid.WGS84.cartographicToCartesian(Cartographic.fromDegrees(2, 4, 6));
        var varyingProperties = {
            'foo': {a: 'bar', isConstant: false},
            'abc': 'def'
        };
        var varyingFeature = new Entity({
            name: 'Bar',
            properties: varyingProperties,
            imageryLayer: {}
        });
        var section = new FeatureInfoPanelSectionViewModel(panel, varyingFeature, catalogItem);

        expect(section.templatedInfo).toBe('<div>3.999999999999998 2</div>');
    });

    it('does not think a falsy property value is time-varying', function() {
        // Added because it used to think this - see https://github.com/TerriaJS/terriajs/pull/1595 .
        var catalogItem = {
            featureInfoTemplate: '<div>{{terria.coords.latitude}} {{terria.coords.longitude}}</div>'
        };
        terria.pickedFeatures = new PickedFeatures();
        terria.pickedFeatures.pickPosition = Ellipsoid.WGS84.cartographicToCartesian(Cartographic.fromDegrees(2, 4, 6));
        var falsyProperties = {
            'foo': 0,
            'abc': 'def'
        };
        var falsyFeature = new Entity({
            name: 'Bar',
            properties: falsyProperties,
            imageryLayer: {}
        });
        var section = new FeatureInfoPanelSectionViewModel(panel, falsyFeature, catalogItem);
        expect(section.terria.clock.onTick.numberOfListeners).toEqual(0);
    });

    describe('when template is not provided', function () {
        var section;

        beforeEach(function () {
            section = new FeatureInfoPanelSectionViewModel(panel, feature, {});
        });

        it('templatedInfo should not be available', function () {
            expect(section.templatedInfo).not.toBeDefined();
        });

        it('rawData should be available', function () {
            expect(section.rawData).toBeDefined();
        });
    });

    describe('download data', function () {
        describe('on init', function () {
            it('should generate data uris for json and csv for 2-dimensional data', function() {
                // csv should separate with commas and surround data with quotes, and make existing quotes double-quotes ("")
                var EXPECTED_CSV_URL = 'data:attachment/csv,%22Foo%22%2C%22herp%22%0A%22bar%22%2C%22d%22%22e%22%22r%2Cp%22';
                var EXPECTED_JSON_URL = 'data:attachment/json,%7B%22Foo%22%3A%22bar%22%2C%22herp%22%3A%22d%5C%22e%5C%22r%2Cp%22%7D';

                var section = new FeatureInfoPanelSectionViewModel(panel, feature);

                expect(section.dataDownloads.length).toBe(2);

                expect(section.dataDownloads[0].href).toBe(EXPECTED_CSV_URL);
                expect(section.dataDownloads[0].ext).toBe('csv');
                expect(section.dataDownloads[0].name).toBe('CSV');

                expect(section.dataDownloads[1].href).toBe(EXPECTED_JSON_URL);
                expect(section.dataDownloads[1].ext).toBe('json');
                expect(section.dataDownloads[1].name).toBe('JSON');
            });

            it('should only generate data uris for json for hierarchical data', function() {
                var EXPECTED_JSON_URL = 'data:attachment/json,%7B%22Foo%22%3A%22bar%22%2C%22herp%22%3A%7B%22nestedHerp%22%3A%22nestedDerp%22%7D%7D';

                feature.properties.herp = {
                    'nestedHerp': 'nestedDerp'
                };

                var section = new FeatureInfoPanelSectionViewModel(panel, feature);

                expect(section.dataDownloads.length).toBe(1);

                expect(section.dataDownloads[0].href).toBe(EXPECTED_JSON_URL);
                expect(section.dataDownloads[0].ext).toBe('json');
                expect(section.dataDownloads[0].name).toBe('JSON');
            });

            it('download options dropdown should be hidden', function () {
                var section = new FeatureInfoPanelSectionViewModel(panel, feature);
                expect(section.downloadOptionsVisible).toBe(false);
            });
        });

        describe('on dropdown click', function() {
            var section, fakeEvent, fakeInfoPanel, scrollListener, bodyClickListener;

            beforeEach(function() {
                section = new FeatureInfoPanelSectionViewModel(panel, feature);

                fakeEvent = {
                    currentTarget: {
                        parentNode: {
                            parentNode: {
                                getBoundingClientRect: jasmine.createSpy('getBoundingClientRectangle')
                            }
                        }
                    },
                    stopPropagation: jasmine.createSpy('stopPropagation')
                };

                fakeEvent.currentTarget.parentNode.parentNode.getBoundingClientRect.and.returnValue({
                    top: 10,
                    left: 15,
                    right: 35
                });

                fakeInfoPanel = {
                    addEventListener: jasmine.createSpy('addEventListener').and.callFake(function(eventType, listener) {
                       if (eventType === 'scroll') {
                           scrollListener = listener;
                       }
                    }),
                    removeEventListener: jasmine.createSpy('removeEventListener')
                };

                spyOn(document.body, 'addEventListener').and.callFake(function(eventType, listener) {
                    if (eventType === 'click') {
                        bodyClickListener = listener;
                    }
                });
                spyOn(document.body, 'removeEventListener');
                spyOn(document, 'querySelector').and.callFake(function(query) {
                    if (query === '#feature-info-panel-sections') {
                        return fakeInfoPanel;
                    }
                });

                section.toggleDownloadOptions(section, fakeEvent);
            });

            it('should show the dropdown if it\'s currently hidden', function () {
                expect(section.downloadOptionsVisible).toBe(true);
            });

            it('should hide the dropdown if it\'s currently shown', function () {
                section.toggleDownloadOptions(section, fakeEvent);

                expect(section.downloadOptionsVisible).toBe(false);
            });

            it('should set the position of the dropdown to just below that of the parent of the event target', function() {
                expect(section.downloadDropdownPosition).toEqual({
                    top: '10px',
                    left: '15px',
                    width: '20px'
                });
            });

            it('should stop the event from propagating', function() {
               expect(fakeEvent.stopPropagation).toHaveBeenCalled();
            });

            it('should hide the download options dropdown when the feature info panel scrolls', function() {
                scrollListener();

                expect(section.downloadOptionsVisible).toBe(false);
            });

            it('should unbind both the scroll and body click listeners when the feature info panel scrolls', function() {
                scrollListener();

                expect(fakeInfoPanel.removeEventListener).toHaveBeenCalledWith('scroll', scrollListener);
                expect(document.body.removeEventListener).toHaveBeenCalledWith('click', bodyClickListener);
            });

            it('should hide the download options dropdown when a click is registered on the body', function() {
                bodyClickListener();

                expect(section.downloadOptionsVisible).toBe(false);
            });

            it('should unbind both the scroll and body click listeners when a click is registered on the body', function() {
                bodyClickListener();

                expect(fakeInfoPanel.removeEventListener).toHaveBeenCalledWith('scroll', scrollListener);
                expect(document.body.removeEventListener).toHaveBeenCalledWith('click', bodyClickListener);
            });

            it('should only add click/scroll handlers when dropdown is changing to shown', function () {
                // toggle dropdown back to invisible
                section.toggleDownloadOptions(section, fakeEvent);

                expect(fakeInfoPanel.addEventListener.calls.count()).toBe(1);
                expect(document.body.addEventListener.calls.count()).toBe(1);
            });
        });

        describe('when data uri anchor tag is clicked', function () {
            var HREF = 'data:application/json,baergiajerogijaeorigjaoeri';
            var section, clickEvent;

            beforeEach(function () {

                section = new FeatureInfoPanelSectionViewModel(panel, feature);

                clickEvent = {
                    currentTarget: {
                        getAttribute: function(name) {
                            if (name === 'href') {
                                return HREF;
                            }
                        }
                    }
                };
            });

            it('should stop the event for incompatible browsers', function () {
                section.canUseDataUriInHref = false;

                expect(section.checkDataUriCompatibility(section, clickEvent)).toBeFalsy(); // non-true return type = default prevented
            });

            it('should allow the event for compatible browsers', function () {
                section.canUseDataUriInHref = true;

                expect(section.checkDataUriCompatibility(section, clickEvent)).toBe(true); // true return type = default not prevented
            });

            it('should raise an error for incompatible browsers ', function () {
                section.canUseDataUriInHref = false;

                spyOn(terria.error, 'raiseEvent');

                section.checkDataUriCompatibility(section, clickEvent);

                expect(terria.error.raiseEvent).toHaveBeenCalled();

                var error = terria.error.raiseEvent.calls.argsFor(0)[0];

                expect(error.message.indexOf(HREF)).toBeGreaterThan(-1);
            });
        });
    });
});
