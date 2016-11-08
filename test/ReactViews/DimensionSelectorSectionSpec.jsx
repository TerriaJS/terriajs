import DimensionSelectorSection from '../../lib/ReactViews/Workbench/Controls/DimensionSelectorSection';
import {findAllWithType} from 'react-shallow-testutils';
import {getShallowRenderedOutput} from './MoreShallowTools';
import React from 'react';
import Terria from '../../lib/Models/Terria';
import WebMapServiceCatalogItem from '../../lib/Models/WebMapServiceCatalogItem';

describe('DimensionSelectorSection', function() {
    let terria;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
    });

    it('shows all dimensions available for a single layer', function(done) {
        const wmsItem = new WebMapServiceCatalogItem(terria);
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/styles_and_dimensions.xml',
            layers: 'A',
            dimensions: {
                elevation: '-0.90625',
                custom: 'Another thing'
            }
        });

        wmsItem.load().then(function() {
            const section = <DimensionSelectorSection item={wmsItem} />;
            const result = getShallowRenderedOutput(section);
            const selects = findAllWithType(result, 'select');
            expect(selects.length).toBe(2);

            const elevation = selects[0];
            expect(elevation.props.name).toContain('elevation');
            expect(elevation.props.value).toBe('-0.90625');
            const elevationOptions = findAllWithType(elevation, 'option');
            expect(elevationOptions.length).toBe(16);

            const custom = selects[1];
            expect(custom.props.name).toContain('custom');
            expect(custom.props.value).toBe('Another thing');
            const customOptions = findAllWithType(custom, 'option');
            expect(customOptions.length).toBe(4);
        }).then(done).otherwise(done.fail);
    });

    it('shows the union of the dimensions available for multiple layers', function(done) {
        const wmsItem = new WebMapServiceCatalogItem(terria);
        wmsItem.updateFromJson({
            url: 'http://example.com',
            metadataUrl: 'test/WMS/styles_and_dimensions.xml',
            layers: 'A,B',
            dimensions: {
                elevation: '-0.90625',
                custom: 'Another thing',
                another: 'Third'
            }
        });

        wmsItem.load().then(function() {
            const section = <DimensionSelectorSection item={wmsItem} />;
            const result = getShallowRenderedOutput(section);
            const selects = findAllWithType(result, 'select');
            expect(selects.length).toBe(3);

            const elevation = selects[0];
            expect(elevation.props.name).toContain('elevation');
            expect(elevation.props.value).toBe('-0.90625');
            const elevationOptions = findAllWithType(elevation, 'option');
            expect(elevationOptions.length).toBe(16);

            const custom = selects[1];
            expect(custom.props.name).toContain('custom');
            expect(custom.props.value).toBe('Another thing');
            const customOptions = findAllWithType(custom, 'option');
            expect(customOptions.length).toBe(4);

            const another = selects[2];
            expect(another.props.name).toContain('another');
            expect(another.props.value).toBe('Third');
            const anotherOptions = findAllWithType(another, 'option');
            expect(anotherOptions.length).toBe(3);
        }).then(done).otherwise(done.fail);
    });
});
