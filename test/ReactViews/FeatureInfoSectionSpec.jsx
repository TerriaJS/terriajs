'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';

import Entity from 'terriajs-cesium/Source/DataSources/Entity';
import Iso8601 from 'terriajs-cesium/Source/Core/Iso8601';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import TimeInterval from 'terriajs-cesium/Source/Core/TimeInterval';
import TimeIntervalCollectionProperty from 'terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty';

import FeatureInfoSection from '../../lib/ReactViews/FeatureInfo/FeatureInfoSection';
import Terria from '../../lib/Models/Terria';

let separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    separator = (Intl.NumberFormat().format(1000)[1]);
}

function getShallowRenderedOutput(jsx) {
    const renderer = ReactTestUtils.createRenderer();
    renderer.render(jsx);
    return renderer.getRenderOutput();
}

function getContentAndDescription(renderedResult) {
    const content = renderedResult.props.children[1];
    const descriptionElement = content.props.children.props.children[1][0]; // I have no idea why it's in this position, and don't want to test that it always is.
    const descriptionText = descriptionElement.props.children[1][0]; // Ditto.
    return {
        content: renderedResult.props.children[1],
        descriptionElement: descriptionElement,
        descriptionText: descriptionText
    };
}

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
            'owner_html': 'Jay<br>Smith'
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
        // expect(result.type).toBe('li');
        const {content, descriptionElement, descriptionText} = getContentAndDescription(result);
        expect(content.type).toBe('section');
        expect(descriptionElement.type).toBe('p');
        expect(descriptionText).toBe('hi!');
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
        // expect(result.type).toBe('li');
        let {content, descriptionElement, descriptionText} = getContentAndDescription(result);
        expect(content.type).toBe('section');
        expect(descriptionElement.type).toBe('p');
        expect(descriptionText).toBe('bye');

        terria.clock.currentTime = JulianDate.fromDate(new Date('2010-06-30'));
        const section2 = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        const result2 = getShallowRenderedOutput(section2);
        // expect(result.type).toBe('li');
        ({content, descriptionElement, descriptionText} = getContentAndDescription(result2));
        expect(content.type).toBe('section');
        expect(descriptionElement.type).toBe('p');
        expect(descriptionText).toBe('hi');
    });

    it('removes all clock event listeners', function() {
        feature.description = timeVaryingDescription();
        const renderer = ReactTestUtils.createRenderer();
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock}/>;
        renderer.render(section);
        renderer._instance._instance.componentDidMount();
        // expect(terria.clock.onTick.numberOfListeners).toEqual(1);  // may be true, but we don't want to require this implementation.
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
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe('This is a steel bar.');
        });

        it('can use _ to refer to . and # in property keys in the featureInfoTemplate', function() {
            const template = 'Made from {{material_process__1}} {{material}}.';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe('Made from smelted steel.');
        });

        it('formats large numbers without commas', function() {
            const template = 'Size: {{size}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe('Size: 12345678');
        });

        it('can format numbers with commas', function() {
            const template = {template: 'Size: {{size}}', formats: {size: {useGrouping: true}}};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe('Size: 12' + separator + '345' + separator + '678');
        });

        // Do we want this?
        xit('must use triple braces to embed html in template', function() {
            const template = '<div>Hello {{owner_html}} - {{{owner_html}}}</div>';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe('<div>Hello Jay&lt;br&gt;Smith - Jay<br>Smith</div>');
        });

        it('can use a json featureInfoTemplate with partials', function() {
            const template = {template: '<div>test {{>boldfoo}}</div>', partials: {boldfoo: '<b>{{foo}}</b>'}};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe('<div>test <b>bar</b></div>');
        });

        it('sets the name from featureInfoTemplate', function() {
            const template = {name: '{{name}} {{foo}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={false} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const name = result.props.children[0].props.children.join('');
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
            const recursedHtml = ''
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
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template}/>;
            const result = getShallowRenderedOutput(section);
            const descriptionText = getContentAndDescription(result).descriptionText;
            expect(descriptionText).toBe(recursedHtml);
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
