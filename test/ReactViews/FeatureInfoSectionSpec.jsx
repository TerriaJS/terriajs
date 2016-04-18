'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import {findAllWithType, findAllWithClass, findAll} from 'react-shallow-testutils';

import Entity from 'terriajs-cesium/Source/DataSources/Entity';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import TimeInterval from 'terriajs-cesium/Source/Core/TimeInterval';
import TimeIntervalCollectionProperty from 'terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty';

import FeatureInfoSection from '../../lib/ReactViews/FeatureInfo/FeatureInfoSection';
import Terria from '../../lib/Models/Terria';

let separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    separator = (Intl.NumberFormat().format(1000)[1]);
}

const contentClass = 'feature-info-panel__content';

function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

function findAllEqualTo(reactElement, text) {
    return findAll(reactElement, (element) => element && element === text);
}

// function getContentAndDescription(renderedResult) {
//     const content = findAllWithClass(renderedResult, contentClass)[0];
//     const descriptionElement = content.props.children.props.children[1][0]; // I have no idea why it's in this position, and don't want to test that it always is.
//     const descriptionText = descriptionElement.props.children[1][0]; // Ditto.
//     return {
//         content: renderedResult.props.children[1],
//         descriptionElement: descriptionElement,
//         descriptionText: descriptionText
//     };
// }

describe('FeatureInfoSection', function() {

    let terria;
    let feature;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        const properties = {
            'name': 'Kay',
            'foo': 'bar',
            'material': 'steel',
            'material.process.#1': 'smelted',
            'size': '12345678',
            'efficiency': '0.2345678',
            'owner_html': 'Jay<br>Smith',
            'ampersand': 'A & B',
            'lessThan': 'A < B',
            'unsafe': 'ok!<script>alert("gotcha")</script>'
        };
        feature = new Entity({
            name: 'Bar',
            properties: properties
        });
    });

    it('renders a static description', function() {
        feature.description = {
            getValue: function() { return '<p>hi!</p>'; },
            isConstant: true
        };
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result = getShallowRenderedOutput(section);
        expect(findAllWithType(result, 'p').length).toEqual(1);
        expect(findAllEqualTo(result, 'hi!').length).toEqual(1);
    });

    it('does not render unsafe html', function() {
        feature.description = {
            getValue: function() { return '<script>alert("gotcha")</script><p>hi!</p>'; },
            isConstant: true
        };
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result = getShallowRenderedOutput(section);
        expect(findAllWithType(result, 'script').length).toEqual(0);
        expect(findAllEqualTo(result, 'alert("gotcha")').length).toEqual(0);
        expect(findAllWithType(result, 'p').length).toEqual(1);
        expect(findAllEqualTo(result, 'hi!').length).toEqual(1);
    });

    function timeVaryingDescription() {
        const desc = new TimeIntervalCollectionProperty();
        desc.intervals.addInterval(new TimeInterval({start: JulianDate.fromDate(new Date('2010-01-01')), stop: JulianDate.fromDate(new Date('2011-01-01')), data: '<p>hi</p>'}));
        desc.intervals.addInterval(new TimeInterval({start: JulianDate.fromDate(new Date('2011-01-01')), stop: JulianDate.fromDate(new Date('2012-01-01')), data: '<p>bye</p>'}));
        return desc;
    }

    it('renders a time-varying description', function() {
        feature.description = timeVaryingDescription();
        terria.clock.currentTime = JulianDate.fromDate(new Date('2011-06-30'));
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'hi').length).toEqual(0);
        expect(findAllEqualTo(result, 'bye').length).toEqual(1);

        terria.clock.currentTime = JulianDate.fromDate(new Date('2010-06-30'));
        const section2 = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result2 = getShallowRenderedOutput(section2);
        expect(findAllEqualTo(result2, 'hi').length).toEqual(1);
        expect(findAllEqualTo(result2, 'bye').length).toEqual(0);
    });

    it('removes any clock event listeners', function() {
        feature.description = timeVaryingDescription();
        const renderer = ReactTestUtils.createRenderer();
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        renderer.render(section);
        //expect(terria.clock.onTick.numberOfListeners).toEqual(1);  // currently true, but we don't want to require this implementation.
        renderer.unmount();
        expect(terria.clock.onTick.numberOfListeners).toEqual(0);  // we do want to be sure that if this is the implementation, we tidy up after ourselves.
    });

    // TODO
    it('uses a white background for complete HTML documents only', function() {
        feature.description = {getValue: function() { return '<html><body>hi!</body></html>';}};
        // var section = new FeatureInfoPanelSectionViewModel(panel, feature);
        // expect(section.useWhiteBackground).toBe(true);
        // section.destroy();

        feature.description = {getValue: function() { return '<div>hi!</div>';}};
        // section = new FeatureInfoPanelSectionViewModel(panel, feature);
        // expect(section.useWhiteBackground).toBe(false);
        // section.destroy();

        feature.description = {getValue: function() { return '<html attr="yes">\n<body>hi!</body>\n</html>';}};
        // section = new FeatureInfoPanelSectionViewModel(panel, feature);
        // expect(section.useWhiteBackground).toBe(true);
        // section.destroy();
    });

    describe('templating', function() {

        it('uses and completes a string-form featureInfoTemplate if present', function() {
            const template = 'This is a {{material}} {{foo}}.';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'This is a steel bar.').length).toEqual(1);
        });

        it('can use _ to refer to . and # in property keys in the featureInfoTemplate', function() {
            const template = 'Made from {{material_process__1}} {{material}}.';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Made from smelted steel.').length).toEqual(1);
        });

        it('formats large numbers without commas', function() {
            const template = 'Size: {{size}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Size: 12345678').length).toEqual(1);
        });

        it('can format numbers with commas', function() {
            const template = {template: 'Size: {{size}}', formats: {size: {useGrouping: true}}};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Size: 12' + separator + '345' + separator + '678').length).toEqual(1);
        });

        it('does not escape ampersand as &amp;', function() {
            const template = {template: 'Ampersand: {{ampersand}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Ampersand: A & B').length).toEqual(1);
            expect(findAllEqualTo(result, '&amp;').length).toEqual(0);
        });

        it('does not escape < as &lt;', function() {
            const template = {template: 'Less than: {{lessThan}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Less than: A < B').length).toEqual(1);
            expect(findAllEqualTo(result, '&lt;').length).toEqual(0);
        });

        it('can embed safe html in template', function() {
            const template = '<div>Hello {{owner_html}}.</div>';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Hello Jay').length).toEqual(1);
            expect(findAllWithType(result, 'br').length).toEqual(1);
            expect(findAllEqualTo(result, 'Smith.').length).toEqual(1);
        });

        it('cannot embed unsafe html in template', function() {
            const template = '<div>Hello {{unsafe}}</div>';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Hello ok!').length).toEqual(1);
            expect(findAllWithType(result, 'script').length).toEqual(0);
            expect(findAllEqualTo(result, 'alert("gotcha")').length).toEqual(0);
        });

        it('can use a json featureInfoTemplate with partials', function() {
            const template = {template: '<div class="jj">test {{>boldfoo}}</div>', partials: {boldfoo: '<b>{{foo}}</b>'}};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllWithClass(result, 'jk').length).toEqual(0); // just to be sure the null case gives 0.
            expect(findAllWithClass(result, 'jj').length).toEqual(1);
            expect(findAllWithType(result, 'b').length).toEqual(1);
            expect(findAllEqualTo(result, 'test ').length).toEqual(1);
            expect(findAllEqualTo(result, 'bar').length).toEqual(1);
        });

        it('sets the name from featureInfoTemplate', function() {
            const template = {name: '{{name}} {{foo}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={false} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const nameElement = findAllWithClass(result, 'feature-info-panel__title')[0];
            const name = nameElement.props.children;
            expect(name).toContain('Kay bar');
        });

        it('can render a recursive featureInfoTemplate', function() {
            const template = {
                template: '<ul>{{>show_children}}</ul>',
                partials: {
                    show_children: '{{#children}}<li>{{name}}<ul>{{>show_children}}</ul></li>{{/children}}'
                }
            };
            feature.properties.children = [
                {name: 'Alice', children: [{name: 'Bailey', children: null}, {name: 'Beatrix', children: null}]},
                {name: 'Xavier', children: [{name: 'Yann', children: null}, {name: 'Yvette', children: null}]}
            ];
            // const recursedHtml = ''
            //     + '<ul>'
            //     +   '<li>Alice'
            //     +       '<ul>'
            //     +           '<li>' + 'Bailey' + '<ul></ul>' + '</li>'
            //     +           '<li>' + 'Beatrix' + '<ul></ul>' + '</li>'
            //     +       '</ul>'
            //     +   '</li>'
            //     +   '<li>Xavier'
            //     +       '<ul>'
            //     +           '<li>' + 'Yann' + '<ul></ul>' + '</li>'
            //     +           '<li>' + 'Yvette' + '<ul></ul>' + '</li>'
            //     +       '</ul>'
            //     +   '</li>'
            //     + '</ul>';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const content = findAllWithClass(result, contentClass)[0];
            expect(findAllWithType(content, 'ul').length).toEqual(7);
            expect(findAllWithType(content, 'li').length).toEqual(6);
        });

    });

    // describe('CZML templating', function() {
    //     var terria,
    //         panel,
    //         catalog,
    //         item,
    //         timeVaryingItem;

    //     beforeEach(function(done) {
    //         terria = new Terria({
    //             baseUrl: './'
    //         });
    //         panel = new FeatureInfoPanelViewModel({
    //             terria: terria
    //         });
    //         createCatalogMemberFromType.register('group', CatalogGroup);
    //         createCatalogMemberFromType.register('czml', CzmlCatalogItem);
    //         return loadJson('test/init/czml-with-template.json').then(function(json) {
    //             catalog = new Catalog(terria);
    //             return catalog.updateFromJson(json.catalog).then(function() {
    //                 item = catalog.group.items[0].items[0];
    //                 timeVaryingItem = catalog.group.items[0].items[1];
    //             });
    //         }).then(done).otherwise(done.fail);
    //     });

    //     afterEach(function() {
    //         panel.destroy();
    //         panel = undefined;
    //     });

    //     it('uses and completes a string-form featureInfoTemplate if present', function() {
    //         var target = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
    //         return item.load().then(function() {
    //             expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
    //             panel.terria.nowViewing.add(item);
    //             var feature = item.dataSource.entities.values[0];
    //             var pickedFeatures = new PickedFeatures();
    //             pickedFeatures.features.push(feature);
    //             pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

    //             return panel.showFeatures(pickedFeatures).then(function() {
    //                 expect(panel.sections[0].templatedInfo).toEqual(target);
    //             });
    //         }).then(done).otherwise(done.fail);
    //     });

    //     it('uses and completes a time-varying, string-form featureInfoTemplate if present', function() {
    //         var targetBlank = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td></td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
    //         var targetABC = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
    //         var targetDEF = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>DEF</td></tr></tbody></table><br /><table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';

    //         return timeVaryingItem.load().then(function() {
    //             expect(timeVaryingItem.dataSource.entities.values.length).toBeGreaterThan(0);
    //             panel.terria.nowViewing.add(timeVaryingItem);
    //             var feature = timeVaryingItem.dataSource.entities.values[0];
    //             var pickedFeatures = new PickedFeatures();
    //             pickedFeatures.features.push(feature);
    //             pickedFeatures.allFeaturesAvailablePromise = runLater(function() {});

    //             terria.clock.currentTime = JulianDate.fromIso8601('2010-02-02');

    //             return panel.showFeatures(pickedFeatures).then(function() {
    //                 expect(panel.sections[0].templatedInfo).toEqual(targetBlank);

    //                 terria.clock.currentTime = JulianDate.fromIso8601('2012-02-02');
    //                 terria.clock.tick();
    //                 expect(panel.sections[0].templatedInfo).toEqual(targetABC);

    //                 terria.clock.currentTime = JulianDate.fromIso8601('2014-02-02');
    //                 terria.clock.tick();
    //                 expect(panel.sections[0].templatedInfo).toEqual(targetDEF);
    //             });
    //         }).then(done).otherwise(done.fail);

    //     });
    // });

});
