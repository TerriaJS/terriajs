'use strict';

/*global require,expect*/
// import knockout from 'terriajs-cesium/Source/ThirdParty/knockout';
import React from 'react';
import ReactTestUtils from 'react-addons-test-utils';
import {findAllWithType, findAllWithClass, findWithRef} from 'react-shallow-testutils';
import {getShallowRenderedOutput, findAllEqualTo, findAllWithPropsChildEqualTo} from './MoreShallowTools';

import Cartographic from 'terriajs-cesium/Source/Core/Cartographic';
import Ellipsoid from 'terriajs-cesium/Source/Core/Ellipsoid';
import Entity from 'terriajs-cesium/Source/DataSources/Entity';
import JulianDate from 'terriajs-cesium/Source/Core/JulianDate';
import TimeInterval from 'terriajs-cesium/Source/Core/TimeInterval';
import TimeIntervalCollectionProperty from 'terriajs-cesium/Source/DataSources/TimeIntervalCollectionProperty';

import Catalog from '../../lib/Models/Catalog';
import createCatalogMemberFromType from '../../lib/Models/createCatalogMemberFromType';
import CatalogGroup from '../../lib/Models/CatalogGroup';
import CzmlCatalogItem from '../../lib/Models/CzmlCatalogItem';
import FeatureInfoSection from '../../lib/ReactViews/FeatureInfo/FeatureInfoSection';
import loadJson from 'terriajs-cesium/Source/Core/loadJson';
import Terria from '../../lib/Models/Terria';

import Styles from '../../lib/ReactViews/FeatureInfo/feature-info-section.scss';

let separator = ',';
if (typeof Intl === 'object' && typeof Intl.NumberFormat === 'function') {
    separator = (Intl.NumberFormat().format(1000)[1]);
}

const contentClass = Styles.content;

// function getShallowRenderedOutput(jsx) {
//     const renderer = ReactTestUtils.createRenderer();
//     renderer.render(jsx);
//     return renderer.getRenderOutput();
// }

// function findAllEqualTo(reactElement, text) {
//     return findAll(reactElement, (element) => element && element === text);
// }

// function findAllWithPropsChildEqualTo(reactElement, text) {
//     // Returns elements with element.props.children[i] or element.props.children[i][j] equal to text, for any i or j.
//     return findAll(reactElement, (element) => {
//         if (!(element && element.props && element.props.children)) {
//             return;
//         }
//         return element.props.children.indexOf(text) >= 0 || (element.props.children.some && element.props.children.some(x => x && x.length && x.indexOf(text) >= 0));
//     });
// }

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
    let viewState;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        viewState = {}; // Not important for tests, but is a required prop.
        const properties = {
            'name': 'Kay',
            'foo': 'bar',
            'material': 'steel',
            'material.process.#1': 'smelted',
            'size': '12345678.9012',
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
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllWithType(result, 'p').length).toEqual(1);
        expect(findAllEqualTo(result, 'hi!').length).toEqual(1);
    });

    it('does not render unsafe html', function() {
        feature.description = {
            getValue: function() { return '<script>alert("gotcha")</script><p>hi!</p>'; },
            isConstant: true
        };
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
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
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'hi').length).toEqual(0);
        expect(findAllEqualTo(result, 'bye').length).toEqual(1);

        terria.clock.currentTime = JulianDate.fromDate(new Date('2010-06-30'));
        const section2 = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result2 = getShallowRenderedOutput(section2);
        expect(findAllEqualTo(result2, 'hi').length).toEqual(1);
        expect(findAllEqualTo(result2, 'bye').length).toEqual(0);
    });

    it('removes any clock event listeners', function() {
        feature.description = timeVaryingDescription();
        const renderer = ReactTestUtils.createRenderer();
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        renderer.render(section);
        expect(terria.clock.onTick.numberOfListeners).toEqual(1);  // This implementation is not required, but while we have it, keep this test so we know the next one is meaningful.
        renderer.unmount();
        expect(terria.clock.onTick.numberOfListeners).toEqual(0);  // we do want to be sure that if this is the implementation, we tidy up after ourselves.
    });

    it('does not set a clock event listener if no description or properties', function() {
        const emptyFeature = new Entity({
            name: 'Empty'
        });
        const renderer = ReactTestUtils.createRenderer();
        const section = <FeatureInfoSection feature={emptyFeature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        renderer.render(section);
        expect(terria.clock.onTick.numberOfListeners).toEqual(0);
    });

    it('does not set a clock event listener if no description and constant properties', function() {
        const renderer = ReactTestUtils.createRenderer();
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        renderer.render(section);
        expect(terria.clock.onTick.numberOfListeners).toEqual(0);
    });

    it('handles features with no properties', function() {
        feature = new Entity({
            name: 'Foot',
            description: 'bart'
        });
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'Foot').length).toEqual(1);
        expect(findAllEqualTo(result, 'bart').length).toEqual(1);
    });

    it('handles html format feature info', function() {
        feature = new Entity({
            name: 'Foo',
            description: '<html><head><title>GetFeatureInfo</title></head><body><table><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>'
        });
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'Foo').length).toEqual(1);
        expect(findAllEqualTo(result, 'BAR').length).toEqual(1);
    });

    it('handles html format feature info where markdown would break the html', function() {
        feature = new Entity({
            name: 'Foo',
            description: '<html><head><title>GetFeatureInfo</title></head><body><table>\n\n    <tr>\n\n<th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>'
        });
        // Markdown applied to this description would pull out the lonely <tr> and make it <pre><code><tr>\n</code></pre> , so check this doesn't happen.
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, '<tr>\n').length).toEqual(0);
        expect(findAllEqualTo(result, '&lt;\n').length).toEqual(0);  // Also cover the possibility that it might be encoded.
    });

    it('maintains and applies inline style attributes', function() {
        feature = new Entity({
            name: 'Foo',
            description: '<div style="background:rgb(170, 187, 204)">countdown</div>'
        });
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        const divs = findAllWithPropsChildEqualTo(result, 'countdown');
        expect(divs.length).toEqual(1);
        // Note #ABC is converted by IE11 to rgb(170, 187, 204), so just test that directly. Also IE11 adds space to the front, so strip all spaces out.
        expect(divs[0].props.style.background.replace(/ /g,'')).toEqual('rgb(170,187,204)');
    });

    it('does not break when html format feature info has style tag', function() {
        // Note this does not test that it actually uses the style tag for styling.
        feature = new Entity({
            name: 'Foo',
            description: '<html><head><title>GetFeatureInfo</title></head><style>table.info tr {background:#fff;}</style><body><table class="info"><tr><th>thing</th></tr><tr><td>BAR</td></tr></table><br/></body></html>'
        });
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'Foo').length).toEqual(1);
        expect(findAllEqualTo(result, 'BAR').length).toEqual(1);
    });

    it('does not break when there are neither properties nor description', function() {
        feature = new Entity({
            name: 'Vapid'
        });
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'Vapid').length).toEqual(1);
        expect(findWithRef(result, 'no-info')).toBeDefined();
    });

    it('shows properties if no description', function() {
        // Tests both static and potentially time-varying properties.
        feature = new Entity({
            name: 'Meals',
            properties: {
                lunch: 'eggs',
                dinner: {
                    getValue: function() {
                        return 'ham';
                    }
                }
            }
        });
        const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
        const result = getShallowRenderedOutput(section);
        expect(findAllEqualTo(result, 'Meals').length).toEqual(1);
        expect(findAllEqualTo(result, 'lunch').length).toEqual(1);
        expect(findAllEqualTo(result, 'eggs').length).toEqual(1);
        expect(findAllEqualTo(result, 'dinner').length).toEqual(1);
        expect(findAllEqualTo(result, 'ham').length).toEqual(1);
    });

    describe('templating', function() {

        it('uses and completes a string-form featureInfoTemplate if present', function() {
            const template = 'This is a {{material}} {{foo}}.';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'This is a steel bar.').length).toEqual(1);
        });

        it('can use _ to refer to . and # in property keys in the featureInfoTemplate', function() {
            const template = 'Made from {{material_process__1}} {{material}}.';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Made from smelted steel.').length).toEqual(1);
        });

        it('formats large numbers without commas', function() {
            const template = 'Size: {{size}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Size: 12345678.9012').length).toEqual(1);
        });

        it('can format numbers with commas', function() {
            const template = {template: 'Size: {{size}}', formats: {size: {useGrouping: true}}};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Size: 12' + separator + '345' + separator + '678.9012').length).toEqual(1);
        });

        it('can format numbers using terria.formatNumber', function() {
            let template = 'Base: {{#terria.formatNumber}}{{size}}{{/terria.formatNumber}}';
            template += '  Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3}{{size}}{{/terria.formatNumber}}';
            template += '  DP: {{#terria.formatNumber}}{"maximumFractionDigits":3}{{efficiency}}{{/terria.formatNumber}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Base: 12345678.9012  Sep: 12' + separator + '345' + separator + '678.901  DP: 0.235').length).toEqual(1);
        });

        it('can format numbers using terria.formatNumber without quotes', function() {
            let template = 'Sep: {{#terria.formatNumber}}{useGrouping:true, maximumFractionDigits:3}{{size}}{{/terria.formatNumber}}';
            template += '  DP: {{#terria.formatNumber}}{maximumFractionDigits:3}{{efficiency}}{{/terria.formatNumber}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Sep: 12' + separator + '345' + separator + '678.901  DP: 0.235').length).toEqual(1);
        });

        it('can handle white text in terria.formatNumber', function() {
            let template = 'Sep: {{#terria.formatNumber}}{"useGrouping":true, "maximumFractionDigits":3} \n {{size}}{{/terria.formatNumber}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Sep: 12' + separator + '345' + separator + '678.901').length).toEqual(1);
        });

        it('handles non-numbers terria.formatNumber', function() {
            const template = 'Test: {{#terria.formatNumber}}text{{/terria.formatNumber}}';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Test: text').length).toEqual(1);
        });

        it('does not escape ampersand as &amp;', function() {
            const template = {template: 'Ampersand: {{ampersand}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Ampersand: A & B').length).toEqual(1);
            expect(findAllEqualTo(result, '&amp;').length).toEqual(0);
        });

        it('does not escape < as &lt;', function() {
            const template = {template: 'Less than: {{lessThan}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Less than: A < B').length).toEqual(1);
            expect(findAllEqualTo(result, '&lt;').length).toEqual(0);
        });

        it('can embed safe html in template', function() {
            const template = '<div>Hello {{owner_html}}.</div>';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Hello Jay').length).toEqual(1);
            expect(findAllWithType(result, 'br').length).toEqual(1);
            expect(findAllEqualTo(result, 'Smith.').length).toEqual(1);
        });

        it('cannot embed unsafe html in template', function() {
            const template = '<div>Hello {{unsafe}}</div>';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Hello ok!').length).toEqual(1);
            expect(findAllWithType(result, 'script').length).toEqual(0);
            expect(findAllEqualTo(result, 'alert("gotcha")').length).toEqual(0);
        });

        it('can use a json featureInfoTemplate with partials', function() {
            const template = {template: '<div class="jj">test {{>boldfoo}}</div>', partials: {boldfoo: '<b>{{foo}}</b>'}};
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllWithClass(result, 'jk').length).toEqual(0); // just to be sure the null case gives 0.
            expect(findAllWithClass(result, 'jj').length).toEqual(1);
            expect(findAllWithType(result, 'b').length).toEqual(1);
            expect(findAllEqualTo(result, 'test ').length).toEqual(1);
            expect(findAllEqualTo(result, 'bar').length).toEqual(1);
        });

        it('sets the name from featureInfoTemplate', function() {
            const template = {name: '{{name}} {{foo}}'};
            const section = <FeatureInfoSection feature={feature} isOpen={false} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            const nameElement = findAllWithClass(result, Styles.title)[0];
            const nameSpan = nameElement.props.children[0];
            const name = nameSpan.props.children;
            expect(name).toContain('Kay bar');
        });

        it('can access clicked lat and long', function() {
            const template = '<div>Clicked {{#terria.formatNumber}}{maximumFractionDigits:0}{{terria.coords.latitude}}{{/terria.formatNumber}}, {{#terria.formatNumber}}{maximumFractionDigits:0}{{terria.coords.longitude}}{{/terria.formatNumber}}</div>';
            const position = Ellipsoid.WGS84.cartographicToCartesian(Cartographic.fromDegrees(77, 44, 6));
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} position={position}/>;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Clicked 44, 77').length).toEqual(1);
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
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} template={template} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            const content = findAllWithClass(result, contentClass)[0];
            expect(findAllWithType(content, 'ul').length).toEqual(7);
            expect(findAllWithType(content, 'li').length).toEqual(6);
        });

    });

    describe('raw data', function() {

        beforeEach(function() {
            feature.description = {
                getValue: function() { return '<p>hi!</p>'; },
                isConstant: true
            };
        });

        it('does not appear if no template', function() {
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Hide Raw Data').length).toEqual(0);
            expect(findAllEqualTo(result, 'Show Raw Data').length).toEqual(0);
        });

        it('shows "Show Raw Data" if template', function() {
            const template = 'Test';
            const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} template={template} />;
            const result = getShallowRenderedOutput(section);
            expect(findAllEqualTo(result, 'Hide Raw Data').length).toEqual(0);
            expect(findAllEqualTo(result, 'Show Raw Data').length).toEqual(1);
        });

    });

    describe('CZML templating', function() {
        let item;
        let timeVaryingItem;

        beforeEach(function(done) {
            createCatalogMemberFromType.register('group', CatalogGroup);
            createCatalogMemberFromType.register('czml', CzmlCatalogItem);
            return loadJson('test/init/czml-with-template.json').then(function(json) {
                const catalog = new Catalog(terria);
                return catalog.updateFromJson(json.catalog).then(function() {
                    item = catalog.group.items[0].items[0];
                    timeVaryingItem = catalog.group.items[0].items[1];
                });
            }).then(done).otherwise(done.fail);
        });

        it('uses and completes a string-form featureInfoTemplate', function(done) {
            // target = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br />
            //           <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
            return item.load().then(function() {
                expect(item.dataSource.entities.values.length).toBeGreaterThan(0);
                const feature = item.dataSource.entities.values[0];
                const section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} template={item.featureInfoTemplate} />;
                const result = getShallowRenderedOutput(section);
                expect(findAllEqualTo(result, 'ABC').length).toEqual(1);
                expect(findAllEqualTo(result, '2010').length).toEqual(1);
                expect(findAllEqualTo(result, '14.4').length).toEqual(1);
                expect(findAllEqualTo(result, '2012').length).toEqual(1);
                expect(findAllEqualTo(result, '10.7').length).toEqual(1);
            }).then(done).otherwise(done.fail);
        });

        it('uses and completes a time-varying, string-form featureInfoTemplate', function(done) {
            // targetBlank = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td></td></tr></tbody></table><br />
            //                <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
            // targetABC = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>ABC</td></tr></tbody></table><br />
            //              <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
            // targetDEF = '<table><tbody><tr><td>Name:</td><td>Test</td></tr><tr><td>Type:</td><td>DEF</td></tr></tbody></table><br />
            //              <table><tbody><tr><td>Year</td><td>Capacity</td></tr><tr><td>2010</td><td>14.4</td></tr><tr><td>2011</td><td>22.8</td></tr><tr><td>2012</td><td>10.7</td></tr></tbody></table>';
            return timeVaryingItem.load().then(function() {
                expect(timeVaryingItem.dataSource.entities.values.length).toBeGreaterThan(0);
                const feature = timeVaryingItem.dataSource.entities.values[0];
                terria.clock.currentTime = JulianDate.fromIso8601('2010-02-02');
                let section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} template={timeVaryingItem.featureInfoTemplate} />;
                let result = getShallowRenderedOutput(section);
                expect(findAllEqualTo(result, 'ABC').length).toEqual(0);
                expect(findAllEqualTo(result, 'DEF').length).toEqual(0);

                terria.clock.currentTime = JulianDate.fromIso8601('2012-02-02');
                section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} template={timeVaryingItem.featureInfoTemplate} />;
                result = getShallowRenderedOutput(section);
                expect(findAllEqualTo(result, 'ABC').length).toEqual(1);
                expect(findAllEqualTo(result, 'DEF').length).toEqual(0);

                terria.clock.currentTime = JulianDate.fromIso8601('2014-02-02');
                section = <FeatureInfoSection feature={feature} isOpen={true} clock={terria.clock} viewState={viewState} template={timeVaryingItem.featureInfoTemplate} />;
                result = getShallowRenderedOutput(section);
                expect(findAllEqualTo(result, 'ABC').length).toEqual(0);
                expect(findAllEqualTo(result, 'DEF').length).toEqual(1);

            }).then(done).otherwise(done.fail);
        });

    });

});
