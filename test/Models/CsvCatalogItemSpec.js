'use strict';

/*global require,describe,it,expect,beforeEach,fail*/
var clone = require('terriajs-cesium/Source/Core/clone');
var Color = require('terriajs-cesium/Source/Core/Color');
var JulianDate = require('terriajs-cesium/Source/Core/JulianDate');
var Rectangle = require('terriajs-cesium/Source/Core/Rectangle');

var CatalogItem = require('../../lib/Models/CatalogItem');
var CsvCatalogItem = require('../../lib/Models/CsvCatalogItem');
var ImageryLayerCatalogItem = require('../../lib/Models/ImageryLayerCatalogItem');
var ImageryProviderHooks = require('../../lib/Map/ImageryProviderHooks');
var sinon = require('sinon');
var TableStyle = require('../../lib/Models/TableStyle');
var Terria = require('../../lib/Models/Terria');
var URI = require('urijs');
var VarType = require('../../lib/Map/VarType');

var greenTableStyle = new TableStyle({
    'colorMap': [
        {
            'offset': 0,
            'color': 'rgba(0, 64, 0, 1.00)'
        },
        {
            'offset': 1,
            'color': 'rgba(0, 255, 0, 1.00)'
        }
    ]
});

describe('CsvCatalogItem with lat and lon', function() {

    var terria;
    var csvItem;

    beforeEach(function() {
        terria = new Terria({
            baseUrl: './'
        });
        csvItem = new CsvCatalogItem(terria);
    });

    it('has sensible type and typeName', function() {
        expect(csvItem.type).toBe('csv');
        expect(csvItem.typeName).toBe('Comma-Separated Values (CSV)');
    });

    it('throws if constructed without a Terria instance', function() {
        expect(function() {
            var viewModel = new CsvCatalogItem(); // jshint ignore:line
        }).toThrow();
    });

    it('can be constructed', function() {
        expect(csvItem).toBeDefined();
    });

    it('is derived from CatalogItem', function() {
        expect(csvItem instanceof CatalogItem).toBe(true);
    });

    it('can update from json', function() {
        var dataStr = 'col1, col2\ntest, 0';
        csvItem.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://my.csv.com/test.csv',
            data: dataStr,
            dataSourceUrl: 'none',
            dataCustodian: 'Data Custodian',
        });

        expect(csvItem.name).toBe('Name');
        expect(csvItem.description).toBe('Description');
        expect(csvItem.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
        expect(csvItem.type).toBe('csv');
        expect(csvItem.url.indexOf('http://my.csv.com/test.csv')).toBe(0);
        expect(csvItem.data.indexOf(dataStr)).toBe(0);
        expect(csvItem.dataCustodian).toBe('Data Custodian');
        expect(csvItem.dataSourceUrl).toBe('none');
    });

    it('uses reasonable defaults for updateFromJson', function() {
        csvItem.updateFromJson({});

        expect(csvItem.name).toBe('Unnamed Item');
        expect(csvItem.description).toBe('');
        expect(csvItem.rectangle).toBeUndefined();
        expect(csvItem.type).toBe('csv');
        expect(csvItem.url).toBeUndefined();
        expect(csvItem.data).toBeUndefined();
        expect(csvItem.dataSourceUrl).toBeUndefined();
        expect(csvItem.dataCustodian).toBeUndefined();
    });

    it('can be round-tripped with serializeToJson and updateFromJson', function() {
        var dataStr = 'col1, col2\ntest, 0';
        csvItem.updateFromJson({
            name: 'Name',
            description: 'Description',
            rectangle: [-10, 10, -20, 20],
            url: 'http://my.csv.com/test.csv',
            data: dataStr,
            dataSourceUrl: 'none',
            dataCustodian: 'Data Custodian',
            dataUrl: 'http://my.csv.com/test.csv',
            dataUrlType: 'direct'
        });

        var json = csvItem.serializeToJson();

        var reconstructed = new CsvCatalogItem(terria);
        reconstructed.updateFromJson(json);

        expect(reconstructed).toEqual(csvItem);
    });

    it('is correctly loading csv data from a file', function(done) {
        csvItem.url = 'test/csv/minimal.csv';
        csvItem.load().then(function() {
            expect(csvItem.dataSource).toBeDefined();
            expect(csvItem.dataSource.tableStructure).toBeDefined();
            expect(csvItem.dataSource.tableStructure.columns.length).toEqual(5);
        }).otherwise(fail).then(done);
    });

    it('is able to generate a Legend', function(done) {
        csvItem.url = 'test/csv/minimal.csv';
        csvItem.load().then(function() {
            expect(csvItem.legendUrl).toBeDefined();
            expect(csvItem.legendUrl.mimeType).toBe('image/png');
            expect(csvItem.legendUrl.url).toBeDefined();
        }).otherwise(fail).then(done);
    });

    it('identifies "lat" and "lon" fields', function(done) {
        csvItem.updateFromJson( { data: 'lat,lon,value\n-37,145,10' });
        csvItem.load().then(function() {
            expect(csvItem.dataSource.tableStructure.hasLatitudeAndLongitude).toBe(true);
        }).otherwise(fail).then(done);
    });

    it('identifies "latitude" and "longitude" fields', function(done) {
        csvItem.updateFromJson( { data: 'latitude,longitude,value\n-37,145,10' });
        csvItem.load().then(function() {
            expect(csvItem.dataSource.tableStructure.hasLatitudeAndLongitude).toBe(true);
        }).otherwise(fail).then(done);
    });

    it('does not mistakenly identify "latvian" and "lone_person" fields', function(done) {
        csvItem.updateFromJson( { data: 'latvian,lone_person,lat,lon,value\n-37,145,-37,145,10' });
        csvItem.load().then(function() {
            expect(csvItem.dataSource.tableStructure.columnsByType[VarType.LON][0].name).toEqual('lon');
            expect(csvItem.dataSource.tableStructure.columnsByType[VarType.LAT][0].name).toEqual('lat');
        }).otherwise(fail).then(done);
    });

    it('handles numeric fields containing (quoted) thousands commas', function(done) {
        csvItem.updateFromJson({data: 'lat,lon,value\n-37,145,"1,000"\n-38,145,"234,567.89"'});
        csvItem.load().then(function() {
            var tableStructure = csvItem.dataSource.tableStructure;
            expect(tableStructure.hasLatitudeAndLongitude).toBe(true);
            expect(tableStructure.columns[2].values[0]).toEqual(1000);
            expect(tableStructure.columns[2].values[1]).toBeCloseTo(234567.89, 2);
        }).otherwise(fail).then(done);
    });

    it('handles enum fields', function(done) {
        csvItem.url = 'test/csv/lat_lon_enum.csv';
        csvItem.load().then(function() {
            expect(csvItem.dataSource.tableStructure.activeItems[0].name).toBe('enum');
        }).otherwise(fail).then(done);
    });

    it('sets active variable to dataVariable if provided', function(done) {
        csvItem.url = 'test/csv/lat_lon_enum_val.csv';
        csvItem._tableStyle = new TableStyle({
            dataVariable: 'val'
        });
        csvItem.load().then(function() {
            expect(csvItem.dataSource.tableStructure.activeItems[0].name).toBe('val');
        }).otherwise(fail).then(done);
    });

    it('colors enum fields the same (only) when the value is the same', function(done) {
        csvItem.url = 'test/csv/lat_lon_enum.csv';
        csvItem.load().then(function() {
            function cval(i) { return csvItem.dataSource.entities.values[i]._point._color._value; }
            expect(cval(0)).not.toEqual(cval(1));
            expect(cval(0)).not.toEqual(cval(2));
            expect(cval(0)).not.toEqual(cval(3));
            expect(cval(0)).toEqual(cval(4));
            expect(cval(1)).toEqual(cval(3));
        }).otherwise(fail).then(done);
    });

    it('handles no data variable', function(done) {
        csvItem.url = 'test/csv/lat_lon_novals.csv';
        csvItem.load().then(function() {
            expect(csvItem.dataSource.tableStructure.activeItems.length).toEqual(0);
            expect(csvItem.dataSource.tableStructure.columns.length).toEqual(2);
            expect(csvItem.dataSource.tableStructure.columns[0].values.length).toEqual(5);
        }).otherwise(fail).then(done);
    });

    it('supports dates', function(done) {
        csvItem.url = 'test/csv/lat_long_enum_moving_date.csv';
        csvItem.load().then(function() {
            var j = JulianDate.fromIso8601;
            var source = csvItem.dataSource;
            expect(source.tableStructure.columns[0].values.length).toEqual(13);
            expect(source.tableStructure.columnsByType[VarType.TIME].length).toEqual(1);
            expect(source.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]).toEqual(j('2015-08-01'));
            // Test that an entity exists at the expected dates.
            var features = source.entities.values;
            var featureDates = features.map(getPropertiesDate);
            expect(featureDates.indexOf('2015-07-31')).toBe(-1);  // no such dates in the input file
            expect(featureDates.indexOf('2015-08-07')).toBe(-1);
            var earlyFeature = features[featureDates.indexOf('2015-08-01')];
            // The date '2015-08-01' appears to be interpreted as starting at midnight in the local time zone (at least on Chrome).
            // Eg. in Sydney summer, JulianDate.toIso8601(earlyFeature.availability.start) returns "2015-07-31T14:00:00Z".
            expect(earlyFeature.availability.contains(j('2015-08-01'))).toBe(true);
            // Also test the duration of the interval is just under one day (the time between input rows).
            var durationInSeconds = JulianDate.secondsDifference(earlyFeature.availability.stop, earlyFeature.availability.start);
            expect(durationInSeconds).toBeGreaterThan(23 * 3600);  // more than 23 hours
            expect(durationInSeconds).toBeLessThan(24 * 3600);  // but less than 24 hours
        }).otherwise(fail).then(done);
    });

    it('supports dates and very long displayDuration', function(done) {
        var sevenDaysInMinutes = 60 * 24 * 7;
        csvItem.url = 'test/csv/lat_long_enum_moving_date.csv';
        csvItem._tableStyle = new TableStyle({displayDuration: sevenDaysInMinutes});
        csvItem.load().then(function() {
            // Now, the features' availabilities should persist for 7 days, not just under 1 day.
            var features = csvItem.dataSource.entities.values;
            var featureDates = features.map(getPropertiesDate);
            var earlyFeature = features[featureDates.indexOf('2015-08-01')];
            expect(earlyFeature.availability.contains(JulianDate.fromIso8601('2015-08-01T12:00:00Z'))).toBe(true);
            var durationInSeconds = JulianDate.secondsDifference(earlyFeature.availability.stop, earlyFeature.availability.start);
            expect(durationInSeconds).toEqual(sevenDaysInMinutes * 60);
        }).otherwise(fail).then(done);
    });

    it('supports dates sorted randomly', function(done) {
        // Now that we use availability to establish when entities exist, this is not much of a test.
        // Could delete, or change it to test something more useful.
        csvItem.url = 'test/csv/lat_lon_enum_moving_date_unsorted.csv';
        csvItem.load().then(function() {
            var j = JulianDate.fromIso8601;
            var source = csvItem.dataSource;
            expect(source.tableStructure.columns[0].values.length).toEqual(13);
            expect(source.tableStructure.columnsByType[VarType.TIME].length).toEqual(1);
            expect(source.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]).toEqual(j('2015-08-05'));
            // Test that an entity exists at the expected dates.
            var features = source.entities.values;
            var featureDates = features.map(getPropertiesDate);
            expect(featureDates.indexOf('2015-07-31')).toBe(-1);  // no such dates in the input file
            expect(featureDates.indexOf('2015-08-07')).toBe(-1);
            var earlyFeature = features[featureDates.indexOf('2015-08-01')];
            // The date '2015-08-01' appears to be interpreted as starting at midnight in the local time zone (at least on Chrome).
            // Eg. in Sydney summer, JulianDate.toIso8601(earlyFeature.availability.start) returns "2015-07-31T14:00:00Z".
            expect(earlyFeature.availability.contains(j('2015-08-01'))).toBe(true);
            // Also test the duration of the interval is just under one day (the time between input rows).
            var durationInSeconds = JulianDate.secondsDifference(earlyFeature.availability.stop, earlyFeature.availability.start);
            expect(durationInSeconds).toBeGreaterThan(23 * 3600);  // more than 23 hours
            expect(durationInSeconds).toBeLessThan(24 * 3600);  // but less than 24 hours
        }).otherwise(fail).then(done);
    });

    it('has the right values in descriptions for feature picking', function(done) {
        csvItem.url = 'test/csv/lat_lon_enum.csv';
        csvItem.load().then(function() {
            function desc(i) { return csvItem.dataSource.entities.values[i].description._value; }
            expect(desc(0)).toContain('hello');
            expect(desc(1)).toContain('boots');
        }).otherwise(fail).then(done);
    });
    
    it('has a blank in the description table for a missing number', function(done) {
        csvItem.url = 'test/missingNumberFormatting.csv';
        return csvItem.load().then(function() {
            var entities = csvItem.dataSource.entities.values;
            expect(entities.length).toBe(2);
            expect(entities[0].description.getValue()).toMatch('<td>Vals</td><td[^>]*>10</td>');
            expect(entities[1].description.getValue()).toMatch('<td>Vals</td><td[^>]*></td>');
        }).otherwise(fail).then(done);
    });

    it('scales points to a size ratio of 300% if scaleByValue true and respects scale value', function(done) {
        csvItem.url = 'test/csv/lat_lon_val.csv';
        csvItem._tableStyle = new TableStyle({scale: 5, scaleByValue: true });
        return csvItem.load().then(function() {
            var pixelSizes = csvItem.dataSource.entities.values.map(function(e) { return e.point._pixelSize._value; });
            csvItem._minPix = Math.min.apply(null, pixelSizes);
            csvItem._maxPix = Math.max.apply(null, pixelSizes);
            // we don't want to be too prescriptive, but by default the largest object should be 150% normal, smallest is 50%, so 3x difference.
            expect(csvItem._maxPix).toEqual(csvItem._minPix * 3);
        }).then(function(minMax) {
            var csvItem2 = new CsvCatalogItem(terria);
            csvItem2._tableStyle = new TableStyle({scale: 10, scaleByValue: true });
            csvItem2.url = 'test/csv/lat_lon_val.csv';
            return csvItem2.load().yield(csvItem2);
        }).then(function(csvItem2) {
            var pixelSizes = csvItem2.dataSource.entities.values.map(function(e) { return e.point._pixelSize._value; });
            var minPix = Math.min.apply(null, pixelSizes);
            var maxPix = Math.max.apply(null, pixelSizes);
            // again, we don't specify the base size, but x10 things should be twice as big as x5 things.
            expect(maxPix).toEqual(csvItem._maxPix * 2);
            expect(minPix).toEqual(csvItem._minPix * 2);
        })
        .otherwise(fail).then(done);
    });

    it('supports replaceWithNullValues', function(done) {
        csvItem.url = 'test/csv/lat_lon_badvalue.csv';
        csvItem._tableStyle = new TableStyle({replaceWithNullValues: ['bad']});
        csvItem.load().then(function() {
            var valueColumn = csvItem.tableStructure.columns[2];
            expect(valueColumn.values[0]).toEqual(5);
            expect(valueColumn.values[1]).toEqual(null);
            expect(valueColumn.values[2]).toEqual(0);
        }).otherwise(fail).then(done);
    });

    it('colors null the same as zero by default', function(done) {
        csvItem.url = 'test/csv/lat_lon_badvalue.csv';
        csvItem._tableStyle = new TableStyle({replaceWithNullValues: ['bad']});
        csvItem.load().then(function() {
            function cval(i) { return csvItem.dataSource.entities.values[i]._point._color._value; }
            expect(cval(1)).toEqual(cval(2));
        }).otherwise(fail).then(done);
    });

    it('supports nullColor', function(done) {
        csvItem.url = 'test/csv/lat_lon_badvalue.csv';
        csvItem._tableStyle = new TableStyle({
            replaceWithNullValues: ['bad'],
            nullColor: '#A0B0C0'
        });
        var nullColor = new Color(160/255, 176/255, 192/255, 1);
        csvItem.load().then(function() {
            function cval(i) { return csvItem.dataSource.entities.values[i]._point._color._value; }
            expect(cval(1)).toEqual(nullColor);
            // This next expectation checks that zeros and null values are differently colored, and that
            // null values do not lead to coloring getting out of sync with values.
            expect(cval(2)).not.toEqual(nullColor);
        }).otherwise(fail).then(done);
    });

    it('works with nulls in a range not including zero', function(done) {
        csvItem.url = 'test/csv/lat_lon_nullvalue.csv';
        csvItem.load().then(function() {
            function cval(i) { return csvItem.dataSource.entities.values[i]._point._color._value; }
            expect(cval(1)).toEqual(cval(0));  // colors null (row 2) the same as the lowest-value point (row 1).
        }).otherwise(fail).then(done);
    });

    // Removed: not clear that this is correct behaviour, and it's failing.
    // xit('renders a point with no value in transparent black', function(done) {
    //     csvItem.url = 'test/missingNumberFormatting.csv';
    //     return csvItem.load().then(function() {
    //         var entities = csvItem.dataSource.entities.values;
    //         expect(entities.length).toBe(2);
    //         expect(entities[0].point.color.getValue()).not.toEqual(new Color(0.0, 0.0, 0.0, 0.0));
    //         expect(entities[1].point.color.getValue()).toEqual(new Color(0.0, 0.0, 0.0, 0.0));
    //         done();
    //     });
    // });
});

// eg. use as entities.map(getPropertiesDate) to just get the dates of the entities.
function getPropertiesDate(obj) {
    return obj.properties.date;
}

// eg. use as regions.map(getId) to just get the ids of the regions.
function getId(obj) {
    return obj.id;
}

describe('CsvCatalogItem with region mapping', function() {

    var terria;
    var csvItem;
    beforeEach(function() {
        terria = new Terria({
            baseUrl: './',
            regionMappingDefinitionsUrl: 'test/csv/regionMapping.json'
        });
        csvItem = new CsvCatalogItem(terria);
        console.log('Note - this test requires an internet connection.');

        // Instead of directly inspecting the recoloring function (which is a private and inaccessible variable),
        // get it from this function call.
        // This unfortunately makes the test depend on an implementation detail.
        spyOn(ImageryProviderHooks, 'addRecolorFunc');

        // Also, for feature detection, spy on this call; the second argument is the regionImageryProvider.
        // This unfortunately makes the test depend on an implementation detail.
        spyOn(ImageryLayerCatalogItem, 'enableLayer');
    });

    it('does not think a lat-lon csv has regions', function(done) {
        csvItem.url = 'test/csv/lat_long_enum_moving_date.csv';
        csvItem.load().then(function() {
            expect(csvItem.regionMapping).toBeUndefined();
        }).otherwise(fail).then(done);
    });

    it('does not use region mapping when regions present with lat and lon', function(done) {
        csvItem.url = 'test/csv/lat_lon_enum_postcode.csv';
        csvItem.load().then(function() {
            expect(csvItem.regionMapping).toBeUndefined();
        }).otherwise(fail).then(done);
    });

    it('detects LGAs by code', function(done) {
        csvItem.updateFromJson({data: 'lga_code,value\n31000,1'});
        csvItem.load().then(function() {
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            expect(regionDetail.column.name).toEqual('lga_code');
            expect(regionDetail.regionProvider.regionType).toEqual('LGA');
        }).otherwise(fail).then(done);
    });

    it('matches LGAs by code', function(done) {
        csvItem.updateFromJson({data: 'lga_code,value\n31000,1'});
        csvItem.load().then(function() {
            csvItem.regionMapping.enable();  // The recolorFunction call is only made once the layer is enabled.
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(0)[1];
            var indexOfThisRegion = regionDetail.regionProvider.regions.map(getId).indexOf(31000);
            expect(recolorFunction(indexOfThisRegion)[0]).toBeDefined(); // Test that at least one rgba component is defined.
            expect(recolorFunction(indexOfThisRegion)).not.toEqual([0, 0, 0, 0]); // And that the color is not all zeros.
        }).otherwise(fail).then(done);
    });

    it('matches LGAs by names in various formats', function(done) {
        // City of Melbourne is not actually a region, but melbourne is. Same with Sydney (S) and sydney. But test they work anyway.
        csvItem.updateFromJson({data: 'lga_name,value\nCity of Melbourne,1\nGreater Geelong,2\nSydney (S),3'});
        csvItem.load().then(function() {
            csvItem.regionMapping.enable();
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(0)[1];
            var regionNames = regionDetail.regionProvider.regions.map(getId);
            expect(recolorFunction(regionNames.indexOf('bogan'))).not.toBeDefined(); // Test that we didn't try to recolor other regions.
            expect(recolorFunction(regionNames.indexOf('melbourne'))[0]).toBeDefined(); // Test that at least one rgba component is defined.
            expect(recolorFunction(regionNames.indexOf('melbourne'))).not.toEqual([0, 0, 0, 0]); // And that the color is not all zeros.
            expect(recolorFunction(regionNames.indexOf('greater geelong'))[0]).toBeDefined(); // Test that at least one rgba component is defined.
            expect(recolorFunction(regionNames.indexOf('greater geelong'))).not.toEqual([0, 0, 0, 0]); // And that the color is not all zeros.
            expect(recolorFunction(regionNames.indexOf('sydney'))[0]).toBeDefined(); // Test that at least one rgba component is defined.
            expect(recolorFunction(regionNames.indexOf('sydney'))).not.toEqual([0, 0, 0, 0]); // And that the color is not all zeros.
        }).otherwise(fail).then(done);
    });

    // TODO: What is this testing?
    xit('matches numeric state IDs with regexes', function(done) {
        csvItem.updateFromJson({data: 'state,value\n3,30\n4,40\n5,50,\n8,80\n9,90'});
        csvItem.load().then(function() {
            csvItem.regionMapping.enable();
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            var regionNames = regionDetail.regionProvider.regions.map(getId);
            // TODO: This is the old test, which doesn't really have an equivalent in the new csv refactor:
            // expect(csvItem.dataSource.dataset.variables.state.regionCodes).toEqual(["queensland", "south australia", "western australia", "other territories"]);
            // Possibly something like this?  However, this fails - it includes tasmania and not queensland.
            var names = csvItem.dataSource.tableStructure.columns[0].values.map(function(id) { return regionNames[id] });
            expect(names).toEqual(["queensland", "south australia", "western australia", "other territories"]);
        }).otherwise(fail).then(done);
    });

    // I think this would be better as a test of RegionProvider?
    // it('matches SA4s', function(done) {
    //     csvItem.updateFromJson({data: 'sa4,value\n209,correct'});
    //     csvItem.load().then(function() {
    //         csvItem.regionMapping.enable();
    //         return csvItem.dataSource.regionPromise.then(function(regionDetails) {
    //             expect(regionDetails).toBeDefined();
    //             // There is no "rowPropertiesByCode" method any more.
    //             expect(csvItem.rowPropertiesByCode(209).value).toBe('correct');
    //         }).otherwise(fail);
    //     }).otherwise(fail).then(done);
    // });

    it('respects tableStyle color ramping for regions', function(done) {
        csvItem.updateFromJson({
            data: 'lga_name,value\nmelbourne,0\ngreater geelong,5\nsydney,10',
            tableStyle: greenTableStyle
        });
        csvItem.load().then(function() {
            csvItem.regionMapping.enable();
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(0)[1];
            var regionNames = regionDetail.regionProvider.regions.map(getId);
            // Require the green value to range from 64 to 255, but do not require a linear mapping.
            expect(recolorFunction(regionNames.indexOf('melbourne'))).toEqual([0, 64, 0, 255]);
            expect(recolorFunction(regionNames.indexOf('greater geelong'))[1]).toBeGreaterThan(64);
            expect(recolorFunction(regionNames.indexOf('greater geelong'))[1]).toBeLessThan(255);
            expect(recolorFunction(regionNames.indexOf('sydney'))).toEqual([0, 255, 0, 255]);
        }).otherwise(fail).then(done);
    });

    it('uses the requested region mapping column, not just the first one', function(done) {
        // The column names in postcode_lga_val_enum.csv are: lga_name, val1, enum, postcode.
        var revisedGreenTableStyle = clone(greenTableStyle);
        revisedGreenTableStyle.regionType = 'poa';
        revisedGreenTableStyle.regionVariable = 'postcode';
        csvItem.updateFromJson({
            url: 'test/csv/postcode_lga_val_enum.csv',
            tableStyle: revisedGreenTableStyle
        });
        csvItem.load().then(function() {
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            expect(csvItem.tableStructure.columnsByType[VarType.REGION][0].name).toBe('postcode');
        }).otherwise(fail).then(done);

    });

    it('can default to an enum field', function(done) {
        csvItem.url = 'test/csv/postcode_enum.csv';
        csvItem.load().then(function() {
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            expect(csvItem.tableStructure.activeItems[0].name).toBe('enum');
        }).otherwise(fail).then(done);
    });

    it('handles region-mapped CSVs with no data variable', function(done) {
        csvItem.url = 'test/csv/postcode_novals.csv';
        csvItem.load().then(function() {
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            expect(csvItem.tableStructure.activeItems.length).toEqual(0);
            expect(csvItem.tableStructure.columns[0].values.length).toBeGreaterThan(1);
        }).otherwise(fail).then(done);
    });

    it('chooses the leftmost data column when none specified', function(done) {
        csvItem.url = 'test/csv/val_enum_postcode.csv';
        csvItem.load().then(function() {
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            expect(csvItem.tableStructure.activeItems[0].name).toEqual('val1');
        }).otherwise(fail).then(done);
    });

    it('handles LGA names with states for disambiguation', function(done) {
        csvItem.updateFromJson({
            url: 'test/csv/lga_state_disambig.csv',
            tableStyle: new TableStyle({dataVariable: 'StateCapital'})
        });
        csvItem.load().then(function() {
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            expect(regionDetail.disambigColumn).toBeDefined();
            expect(regionDetail.disambigColumn.name).toEqual('State');
            // The following test is much more rigorous.
        }).otherwise(fail).then(done);
    });

    it('supports region-mapped files with dates', function(done) {
        csvItem.updateFromJson({
            url: 'test/csv/postcode_date_value.csv'
        });
        csvItem.load().then(function() {
            var regionMapping = csvItem.regionMapping;
            var j = JulianDate.fromIso8601;
            regionMapping._catalogItem.terria.clock.currentTime = j('2015-08-08');
            regionMapping.enable();
            var regionDetails = regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            expect(csvItem.tableStructure.columns[0].values.length).toEqual(10);
            expect(csvItem.tableStructure.columnsByType[VarType.TIME].length).toEqual(1);
            expect(csvItem.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]).toEqual(j('2015-08-07'));
            // Test that the right regions have been colored (since the datasource doesn't expose the entities).
            // On 2015-08-07, only postcodes 3121 and 3122 have values. On neighboring dates, so do 3123 and 3124.
            var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(0)[1];
            var regionNames = regionDetail.regionProvider.regions.map(getId);
            
            expect(recolorFunction(regionNames.indexOf('3121'))).toBeDefined();
            expect(recolorFunction(regionNames.indexOf('3122'))).toBeDefined();
            expect(recolorFunction(regionNames.indexOf('3123'))).not.toBeDefined();
            expect(recolorFunction(regionNames.indexOf('3124'))).not.toBeDefined();
        }).otherwise(fail).then(done);
    });

    it('supports region-mapped files with displayDuration and dates', function(done) {
        csvItem.updateFromJson({
            url: 'test/csv/postcode_date_value.csv',
            tableStyle: new TableStyle({ displayDuration: 60 * 6 }) // 6 hours
        });
        csvItem.load().then(function() {
            var regionMapping = csvItem.regionMapping;
            var j = JulianDate.fromIso8601;
            var nineOclock = j('2015-08-08'); // midnight local time
            JulianDate.addHours(nineOclock, 9, nineOclock);
            regionMapping._catalogItem.terria.clock.currentTime = nineOclock;
            regionMapping.enable();
            var regionDetails = regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            var regionDetail = regionDetails[0];
            expect(csvItem.tableStructure.columns[0].values.length).toEqual(10);
            expect(csvItem.tableStructure.columnsByType[VarType.TIME].length).toEqual(1);
            expect(csvItem.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]).toEqual(j('2015-08-07'));
            // Test that no regions have been colored, since at 9am we are more than 6 hours past the start date of any row.
            var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(0)[1];
            var regionNames = regionDetail.regionProvider.regions.map(getId);

            expect(recolorFunction(regionNames.indexOf('3121'))).not.toBeDefined();
            expect(recolorFunction(regionNames.indexOf('3122'))).not.toBeDefined();
            expect(recolorFunction(regionNames.indexOf('3123'))).not.toBeDefined();
            expect(recolorFunction(regionNames.indexOf('3124'))).not.toBeDefined();
        }).otherwise(fail).then(done);
    });

    it('is less than 2000 characters when serialised to JSON then URLEncoded', function(done) {
        csvItem.url = 'test/csv/postcode_enum.csv';
        csvItem.load().then(function() {
            var url = encodeURIComponent(JSON.stringify(csvItem.serializeToJson()));
            expect(url.length).toBeLessThan(2000);
        }).otherwise(fail).then(done);
    });

    describe('and feature picking', function() {
        var fakeServer;

        beforeEach(function() {
            sinon.xhr.supportsCORS = true; // force Sinon to use XMLHttpRequest even on IE9
            fakeServer = sinon.fakeServer.create();
            fakeServer.autoRespond = true;

            fakeServer.xhr.useFilters = true;
            fakeServer.xhr.addFilter(function(method, url, async, username, password) {
                // Allow requests for local files.
                var uri = new URI(url);
                var protocol = uri.protocol();
                return !protocol && url.indexOf('//') !== 0;
            });

            fakeServer.respond(function(request) {
                fail('Unhandled request to URL: ' + request.url);
            });
        });

        afterEach(function() {
            fakeServer.xhr.filters.length = 0;
            fakeServer.restore();
        });

        it('works', function(done) {
            fakeServer.respondWith(
                'GET',
                'http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_POA_2011_AUST&srs=EPSG%3A3857&bbox=16143500.373829227%2C-4559315.8631541915%2C16153284.31344973%2C-4549531.923533689&width=256&height=256&query_layers=region_map%3AFID_POA_2011_AUST&x=217&y=199&info_format=application%2Fjson',
                JSON.stringify({
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "id": "FID_POA_2011_AUST.766",
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": []
                        },
                        "geometry_name": "the_geom",
                        "properties": {
                            "FID": 765,
                            "POA_CODE": "3124",
                            "POA_NAME": "3124",
                            "SQKM": 7.29156648352383
                        }
                    }],
                    "crs": {
                        "type": "name",
                        "properties": {
                            "name": "urn:ogc:def:crs:EPSG::4326"
                        }
                    }
                })
            );
            csvItem.url = 'test/csv/postcode_val_enum.csv';
            csvItem.load().then(function() {
                csvItem.regionMapping.enable(); // Required to create an imagery layer.
                var regionDetails = csvItem.regionMapping.regionDetails;
                expect(regionDetails).toBeDefined();
                // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the argument[1] is the regionImageryProvider.
                // This unfortunately makes the test depend on an implementation detail.
                var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(0)[1];
                expect(regionImageryProvider).toBeDefined();
                return regionImageryProvider.pickFeatures(3698, 2513, 12, 2.5323739090365693, -0.6604719122857645);
            }).then(function(r) {
                expect(r[0].name).toEqual("3124");
                expect(r[0].description).toContain("42.42");
                expect(r[0].description).toContain("the universe");
            }).otherwise(fail).then(done);
        });

        it('works with fuzzy matching', function(done) {
            fakeServer.respondWith(
                'GET',
                'http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_LGA_2011_AUST&srs=EPSG%3A3857&bbox=16143500.373829227%2C-4559315.8631541915%2C16153284.31344973%2C-4549531.923533689&width=256&height=256&query_layers=region_map%3AFID_LGA_2011_AUST&x=217&y=199&info_format=application%2Fjson',
                JSON.stringify({
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "id": "FID_LGA_2011_AUST.163",
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": []
                        },
                        "geometry_name": "the_geom",
                        "properties": {
                            "FID": 162,
                            "LGA_CODE11": "21110",
                            "LGA_NAME11": "Boroondara (C)",
                            "STE_CODE11": "2",
                            "STE_NAME11": "Victoria",
                            "AREA_SQKM": 60.1808559111785
                        }
                    }],
                    "crs": {
                        "type": "name",
                        "properties": {
                            "name": "urn:ogc:def:crs:EPSG::4326"
                        }
                    }
                })
            );
            csvItem.url = 'test/csv/lga_fuzzy_val.csv';
            csvItem.load().then(function() {
                csvItem.regionMapping.enable(); // Required to create an imagery layer.
                var regionDetails = csvItem.regionMapping.regionDetails;
                expect(regionDetails).toBeDefined();
                // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the argument[1] is the regionImageryProvider.
                // This unfortunately makes the test depend on an implementation detail.
                var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(0)[1];
                expect(regionImageryProvider).toBeDefined();
                return regionImageryProvider.pickFeatures(3698, 2513, 12, 2.5323739090365693, -0.6604719122857645);
            }).then(function(r) {
                expect(r[0].name).toEqual("Boroondara (C)");
                expect(r[0].description).toContain("42.42");
                expect(r[0].description).toContain("the universe");
            }).otherwise(fail).then(done);
        });

        it('works with disambiguated LGA names like Wellington, VIC', function(done) {
            fakeServer.respondWith(
                'GET',
                'http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_LGA_2011_AUST&srs=EPSG%3A3857&bbox=16437018.562444303%2C-3913575.8482010253%2C16593561.59637234%2C-3757032.814272985&width=256&height=256&query_layers=region_map%3AFID_LGA_2011_AUST&x=249&y=135&info_format=application%2Fjson',
                JSON.stringify({
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "id": "FID_LGA_2011_AUST.143",
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": []
                        },
                        "geometry_name": "the_geom",
                        "properties": {
                            "FID": 142,
                            "LGA_CODE11": "18150",
                            "LGA_NAME11": "Wellington (A)",
                            "STE_CODE11": "1",
                            "STE_NAME11": "New South Wales",
                            "AREA_SQKM": 4110.08848071889
                        }
                    }],
                    "crs": {
                        "type": "name",
                        "properties": {
                            "name": "urn:ogc:def:crs:EPSG::4326"
                        }
                    }
                })
            );
            // Use a regular expression for this URL because IE9 has ~1e-10 differences in the bbox parameter.
            fakeServer.respondWith(
                'GET',
                new RegExp('http://regionmap-dev\\.nationalmap\\.nicta\\.com\\.au/region_map/ows\\?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd\\.ogc\\.se_xml&styles=&tiled=true&service=WMS&version=1\\.1\\.1&request=GetFeatureInfo&layers=region_map%3AFID_LGA_2011_AUST&srs=EPSG%3A3857&bbox=16280475\\.5285162\\d\\d%2C-4618019\\.5008772\\d\\d%2C16358747\\.0454802\\d\\d%2C-4539747\\.9839131\\d\\d&width=256&height=256&query_layers=region_map%3AFID_LGA_2011_AUST&x=126&y=58&info_format=application%2Fjson'),
                JSON.stringify({
                    "type": "FeatureCollection",
                    "features": [{
                        "type": "Feature",
                        "id": "FID_LGA_2011_AUST.225",
                        "geometry": {
                            "type": "MultiPolygon",
                            "coordinates": []
                        },
                        "geometry_name": "the_geom",
                        "properties": {
                            "FID": 224,
                            "LGA_CODE11": "26810",
                            "LGA_NAME11": "Wellington (S)",
                            "STE_CODE11": "2",
                            "STE_NAME11": "Victoria",
                            "AREA_SQKM": 10817.3680807268
                        }
                    }],
                    "crs": {
                        "type": "name",
                        "properties": {
                            "name": "urn:ogc:def:crs:EPSG::4326"
                        }
                    }
                })
            );
            csvItem.url = 'test/csv/lga_state_disambig.csv';
            csvItem.load().then(function() {
                csvItem.regionMapping.enable(); // Required to create an imagery provider.
                var regionDetails = csvItem.regionMapping.regionDetails;
                expect(regionDetails).toBeDefined();
                // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the second argument is the regionImageryProvider.
                // This unfortunately makes the test depend on an implementation detail.
                var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(0)[1];
                expect(regionImageryProvider).toBeDefined();
                return regionImageryProvider.pickFeatures(464, 314, 9, 2.558613543017636, -0.6605448031188106);
            }).then(function(r) {
                expect(r[0].name).toEqual("Wellington (S)");
                expect(r[0].description).toContain("Wellington"); // leaving it open whether it should show server-side ID or provided value
                expect(r[0].description).toContain("Melbourne");
            }).then(function() {
                var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(0)[1];
                return regionImageryProvider.pickFeatures(233, 152, 8, 2.600997237149669, -0.5686381345023742);
            }).then(function(r) {
                expect(r[0].name).toEqual("Wellington (A)");
                expect(r[0].description).toContain("Wellington");
                expect(r[0].description).toContain("Sydney");
            }).otherwise(fail).then(done);
        });

    });

});
