'use strict';

/*global require,describe,it,expect,beforeEach,afterEach*/
var FeatureInfoPanelViewModel = require('../../lib/ViewModels/FeatureInfoPanelViewModel');
var PickedFeatures = require('../../lib/Map/PickedFeatures');
var runLater = require('../../lib/Core/runLater');
var Terria = require('../../lib/Models/Terria');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');


describe('FeatureInfoPanelViewModel', function() {
    var terria;
    var panel;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        panel = new FeatureInfoPanelViewModel({
            terria: terria
        });
    });

    afterEach(function() {
        panel.destroy();
        panel = undefined;
    });

    it('is initially not visible', function() {
        expect(panel.isVisible).toBe(false);
    });

    it('is shown when terria.pickedFeatures is defined', function() {
        terria.pickedFeatures = new PickedFeatures();
        expect(panel.isVisible).toBe(true);
    });

    it('is hidden when terria.pickedFeatures is set back to undefined', function() {
        terria.pickedFeatures = new PickedFeatures();
        expect(panel.isVisible).toBe(true);
        terria.pickedFeatures = undefined;
        expect(panel.isVisible).toBe(false);
    });

    it('sanitizes HTML', function() {
        panel.html = '<script type="text/javascript">\nalert("foo");\n</script>';
        panel.isVisible = true;

        expect(domContainsText(panel, 'alert("foo")')).toBe(false);
    });

    it('displays a message while asychronously obtaining feature information', function() {
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});
        terria.pickedFeatures = pickedFeatures;
        expect(domContainsText(panel, 'Loading')).toBe(true);
    });

    it('creates a temporary selected feature at the pick location while picking is in progress', function() {
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});
        terria.pickedFeatures = pickedFeatures;

        expect(terria.selectedFeature).toBeDefined();
        expect(terria.selectedFeature.id).toBe('Pick Location');
    });

    function createTestFeature(options) {
        var properties = {};
        properties[options.name || 'Foo'] = options.value || 'bar';
        var description = {};
        description.getValue = function() {
            return options.value || 'bar';
        };

        return new Entity({
            name: options.name || 'Foo',
            properties: properties,
            description: description,
            imageryLayer: options.imageryLayer || {}
        });
    }

    it('uses and completes a string-form featureInfoTemplate if present', function(done) {
        var feature = createTestFeature({
            value: 'bar',
            imageryLayer: {featureInfoTemplate : '<div>test {{Foo}}</div>'}
        });
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(feature);
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

        panel.showFeatures(pickedFeatures).then(function() {
            expect(panel.sections[0].info).toBe('<div>test bar</div>');
        }).otherwise(done.fail).then(done);
    });

    it('must use triple braces to embed html in template', function(done) {
        var feature = createTestFeature({
            value: '<h1>bar</h1>',
            imageryLayer: {featureInfoTemplate : '<div>{{{Foo}}} Hello {{name}}</div>'}
        });
        feature.properties['name'] = 'Jay<br>';
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(feature);
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

        panel.showFeatures(pickedFeatures).then(function() {
            expect(panel.sections[0].info).toBe('<div><h1>bar</h1> Hello Jay&lt;br&gt;</div>');
        }).otherwise(done.fail).then(done);
    });

    it('can use a json featureInfoTemplate with partials', function(done) {
        var feature = createTestFeature({
            value: 'bar',
            imageryLayer: {featureInfoTemplate : {template: '<div>test {{>foobar}}</div>', foobar: '<b>{{Foo}}</b>'}}
        });
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(feature);
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

        panel.showFeatures(pickedFeatures).then(function() {
            expect(panel.sections[0].info).toBe('<div>test <b>bar</b></div>');
        }).otherwise(done.fail).then(done);
    });

    it('can render a recursive featureInfoTemplate', function(done) {
        var feature = createTestFeature({
            value: 'bar',
            imageryLayer: {
                featureInfoTemplate : {
                    template: '<ul>{{>show_children}}</ul>',
                    show_children: '{{#children}}<li>{{name}}<ul>{{>show_children}}</ul></li>{{/children}}'
                }
            }
        });
        feature.properties['children'] = [
            {name: 'Alice', children: [{name: 'Bailey', children: null}, {name: 'Beatrix', children: null}]}, 
            {name: 'Xavier', children: [{name: 'Yann', children: null}, {name: 'Yvette', children: null}]}
        ];
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(feature);
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

        var recursedHtml = ''
            + '<ul>'
            +   '<li>Alice'
            +       '<ul>'
            +           '<li>' + 'Bailey' + '<ul></ul>' + '</li>'
            +           '<li>' + 'Beatrix' + '<ul></ul>' + '</li>'
            +       '</ul>'
            +   '</li>'
            +   '<li>Xavier'
            +       '<ul>'
            +           '<li>' + 'Yann' + '<ul></ul>' + '</li>'
            +           '<li>' + 'Yvette' + '<ul></ul>' + '</li>'
            +       '</ul>'
            +   '</li>'
            + '</ul>';
        panel.showFeatures(pickedFeatures).then(function() {
            expect(panel.sections[0].info).toBe(recursedHtml);
        }).otherwise(done.fail).then(done);
    });

    it('removes all clock event listeners', function(done) {
        var feature = createTestFeature({});
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(feature);
        pickedFeatures.features.push(feature);
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

        panel.showFeatures(pickedFeatures).then(function() {
            expect(terria.clock.onTick.numberOfListeners).toEqual(2);
        }).otherwise(done.fail).then(function() {
            // now, when no features are chosen, they should go away
            pickedFeatures = new PickedFeatures();
            pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});            
            panel.showFeatures(pickedFeatures).then(function() {
                expect(terria.clock.onTick.numberOfListeners).toEqual(0);
            }).otherwise(done.fail).then(done);
        });
    });


    function domContainsText(panel, s) {
        for (var i = 0; i < panel._domNodes.length; ++i) {
            if (panel._domNodes[i].innerHTML && panel._domNodes[i].innerHTML.indexOf(s) >= 0) {
                return true;
            }
        }

        return false;
    }
});
