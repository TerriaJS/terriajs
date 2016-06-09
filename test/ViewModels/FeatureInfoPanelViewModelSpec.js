'use strict';

/*global require,describe,it,expect,beforeEach,afterEach*/
var FeatureInfoPanelViewModel = require('../../lib/ViewModels/FeatureInfoPanelViewModel');
var PickedFeatures = require('../../lib/Map/PickedFeatures');
var runLater = require('../../lib/Core/runLater');
var Terria = require('../../lib/Models/Terria');
var loadJson = require('terriajs-cesium/Source/Core/loadJson');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var Entity = require('terriajs-cesium/Source/DataSources/Entity');

var Catalog = require('../../lib/Models/Catalog');
var createCatalogMemberFromType = require('../../lib/Models/createCatalogMemberFromType');
var CatalogGroup = require('../../lib/Models/CatalogGroup');
var GeoJsonCatalogItem = require('../../lib/Models/GeoJsonCatalogItem');
var CzmlCatalogItem = require('../../lib/Models/CzmlCatalogItem');

var separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    separator = (Intl.NumberFormat().format(1000)[1]);
}

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

    it('removes all clock event listeners', function(done) {
        var feature = createTestFeature({});
        var pickedFeatures = new PickedFeatures();
        pickedFeatures.features.push(feature);
        pickedFeatures.features.push(feature);
        pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

        return panel.showFeatures(pickedFeatures).then(function() {
            expect(terria.clock.onTick.numberOfListeners).toEqual(2);

            // now, when no features are chosen, they should go away
            pickedFeatures = new PickedFeatures();
            pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});
            return panel.showFeatures(pickedFeatures).then(function() {
                expect(terria.clock.onTick.numberOfListeners).toEqual(0);
            });
        }).then(done).otherwise(done.fail);
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

});


describe('FeatureInfoPanelViewModel templating', function() {
    var terria,
        panel,
        catalog,
        item;

    beforeEach(function(done) {
        terria = new Terria({
            baseUrl: './'
        });
        panel = new FeatureInfoPanelViewModel({
            terria: terria
        });
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('geojson', GeoJsonCatalogItem);
        return loadJson('test/init/geojson-with-template.json').then(function(json) {
            catalog = new Catalog(terria);
            return catalog.updateFromJson(json.catalog).then(function() {
                item = catalog.group.items[0].items[0];
            });
        }).then(done).otherwise(done.fail);
    });

    afterEach(function() {
        panel.destroy();
        panel = undefined;
    });

    function loadAndPick() {
        return item.load().then(function() {
            expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
            panel.terria.nowViewing.add(item);
            var feature = item.dataSource.entities.values[0];
            var pickedFeatures = new PickedFeatures();
            pickedFeatures.features.push(feature);
            pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});
            return panel.showFeatures(pickedFeatures);
        });
    }

    describe('default', function() {

        beforeEach(function(done) {
            item.featureInfoTemplate = undefined;
            return loadAndPick().then(done).otherwise(done.fail);
        });

        it('exists', function() {
            var regex = new RegExp('<td>.{0,7}Hoop_Big.{0,7}</td>');
            expect(regex.test(panel.sections[0].rawData.replace(/\n/g, ''))).toBe(true);
        });

        it('formats large numbers without commas', function() {
            expect(panel.sections[0].rawData.indexOf('1234567') >= 0).toBe(true);
        });

    });

    it('uses and completes a string-form featureInfoTemplate if present', function(done) {
        item.featureInfoTemplate = 'A {{type}} made of {{material}} with {{funding_ba}} funding.';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('A Hoop_Big made of Stainless Steel with Capex funding.');
        }).otherwise(done.fail).then(done);
    });

    it('can use _ to refer to . and # in property keys in the featureInfoTemplate', function(done) {
        item.featureInfoTemplate = 'historic.# {{historic__}}; file.number. {{file_number_}}; documents.#1 {{documents._1}}';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('historic.# -12; file.number. 10; documents.#1 4');
        }).then(done).otherwise(done.fail);
    });

    it('must use triple braces to embed html in template', function(done) {
        item.featureInfoTemplate = '<div>Hello {{owner}} - {{{owner}}}</div>';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('<div>Hello Jay&lt;br&gt; - Jay<br></div>');
        }).then(done).otherwise(done.fail);

    });

    it('can use a json featureInfoTemplate with partials', function(done) {
        item.featureInfoTemplate = {template: '<div>test {{>foobar}}</div>', partials: {foobar: '<b>{{type}}</b>'}};
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('<div>test <b>Hoop_Big</b></div>');
        }).then(done).otherwise(done.fail);
    });

    it('sets the name from featureInfoTemplate', function(done) {
        item.featureInfoTemplate = {name: 'Type {{type}}'};
        return loadAndPick().then(function() {
            expect(panel.sections[0].name).toBe('Type Hoop_Big');
        }).then(done).otherwise(done.fail);
    });

    it('formats templated large numbers without commas', function(done) {
        item.featureInfoTemplate = 'Big {{big}}';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo.indexOf('1234567') >= 0).toBe(true);
        }).then(done).otherwise(done.fail);
    });

    it('can format numbers with commas', function(done) {
        item.featureInfoTemplate = {template: 'Big {{big}}', formats: {big: {useGrouping: true}}};
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo.indexOf('1' + separator + '234' + separator + '567') >= 0).toBe(true);
        }).then(done).otherwise(done.fail);
    });

    it('can format numbers using terria.formatNumber', function(done) {
        item.featureInfoTemplate = 'Base: {{#terria.formatNumber}}{{big}}{{/terria.formatNumber}}';
        item.featureInfoTemplate += '  Sep: {{#terria.formatNumber}}{"useGrouping":true}{{big}}{{/terria.formatNumber}}';
        item.featureInfoTemplate += '  DP: {{#terria.formatNumber}}{"maximumFractionDigits":3}{{decimal}}{{/terria.formatNumber}}';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('Base: 1234567  Sep: ' + '1' + separator + '234' + separator + '567' + '  DP: 3.142');
        }).then(done).otherwise(done.fail);
    });

    it('can format numbers using terria.formatNumber without quotes', function(done) {
        item.featureInfoTemplate = 'Sep: {{#terria.formatNumber}}{useGrouping:true}{{big}}{{/terria.formatNumber}}';
        item.featureInfoTemplate += '  DP: {{#terria.formatNumber}}{maximumFractionDigits:3}{{decimal}}{{/terria.formatNumber}}';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('Sep: ' + '1' + separator + '234' + separator + '567' + '  DP: 3.142');
        }).then(done).otherwise(done.fail);
    });

    // Do we want it to handle badly specified options gracefully?
    // it('handles bad terria.formatNumber options gracefully', function(done) {
    //     item.featureInfoTemplate = 'Test: {{#terria.formatNumber}}{badjson}{{big}}{{/terria.formatNumber}}';
    //     return loadAndPick().then(function() {
    //         expect(panel.sections[0].templatedInfo).toBe('Test: 1234567');
    //     }).then(done).otherwise(done.fail);
    // });

    it('handles non-numbers terria.formatNumber', function(done) {
        item.featureInfoTemplate = 'Test: {{#terria.formatNumber}}text{{/terria.formatNumber}}';
        return loadAndPick().then(function() {
            expect(panel.sections[0].templatedInfo).toBe('Test: text');
        }).then(done).otherwise(done.fail);
    });

    it('can render a recursive featureInfoTemplate', function(done) {

        item.featureInfoTemplate = {
            template: '<ul>{{>show_children}}</ul>',
            partials: {
                show_children: '{{#children}}<li>{{name}}<ul>{{>show_children}}</ul></li>{{/children}}'
            }
        };
        return item.load().then(function() {
            expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
            panel.terria.nowViewing.add(item);
            var feature = item.dataSource.entities.values[0];
            feature.properties['children'] = [
                {name: 'Alice', children: [{name: 'Bailey', children: null}, {name: 'Beatrix', children: null}]},
                {name: 'Xavier', children: [{name: 'Yann', children: null}, {name: 'Yvette', children: null}]}
            ];
            var pickedFeatures = new PickedFeatures();
            pickedFeatures.features.push(feature);
            pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

            return panel.showFeatures(pickedFeatures).then(function() {
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
                expect(panel.sections[0].templatedInfo).toBe(recursedHtml);
            });
        }).then(done).otherwise(done.fail);
    });

});

describe('FeatureInfoPanelViewModel CZML templating', function() {
    var terria,
        panel,
        catalog,
        item,
        timeVaryingItem;

    beforeEach(function(done) {
        terria = new Terria({
            baseUrl: './'
        });
        panel = new FeatureInfoPanelViewModel({
            terria: terria
        });
        createCatalogMemberFromType.register('group', CatalogGroup);
        createCatalogMemberFromType.register('czml', CzmlCatalogItem);
        return loadJson('test/init/czml-with-template.json').then(function(json) {
            catalog = new Catalog(terria);
            return catalog.updateFromJson(json.catalog).then(function() {
                item = catalog.group.items[0].items[0];
                timeVaryingItem = catalog.group.items[0].items[1];
            });
        }).then(done).otherwise(done.fail);
    });

    afterEach(function() {
        panel.destroy();
        panel = undefined;
    });

    it('uses and completes a string-form featureInfoTemplate if present', function(done) {
        var target = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
        return item.load().then(function() {
            expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
            panel.terria.nowViewing.add(item);
            var feature = item.dataSource.entities.values[0];
            var pickedFeatures = new PickedFeatures();
            pickedFeatures.features.push(feature);
            pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

            return panel.showFeatures(pickedFeatures).then(function() {
                expect(panel.sections[0].templatedInfo).toEqual(target);
            });
        }).then(done).otherwise(done.fail);
    });

    it('uses and completes a time-varying, string-form featureInfoTemplate if present', function(done) {
        var targetBlank = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td></td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
        var targetABC = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
        var targetDEF = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>DEF</td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';

        return timeVaryingItem.load().then(function() {
            expect(timeVaryingItem.dataSource.entities.values.length).toBeGreaterThan(0);
            panel.terria.nowViewing.add(timeVaryingItem);
            var feature = timeVaryingItem.dataSource.entities.values[0];
            var pickedFeatures = new PickedFeatures();
            pickedFeatures.features.push(feature);
            pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

            terria.clock.currentTime = JulianDate.fromIso8601('2010-02-02');

            return panel.showFeatures(pickedFeatures).then(function() {
                expect(panel.sections[0].templatedInfo).toEqual(targetBlank);

                terria.clock.currentTime = JulianDate.fromIso8601('2012-02-02');
                terria.clock.tick();
                expect(panel.sections[0].templatedInfo).toEqual(targetABC);

                terria.clock.currentTime = JulianDate.fromIso8601('2014-02-02');
                terria.clock.tick();
                expect(panel.sections[0].templatedInfo).toEqual(targetDEF);
            });
        }).then(done).otherwise(done.fail);

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
