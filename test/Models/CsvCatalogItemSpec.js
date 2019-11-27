"use strict";

/*global require,describe,it,expect,beforeEach,fail*/
var clone = require("terriajs-cesium/Source/Core/clone").default;
var Color = require("terriajs-cesium/Source/Core/Color").default;
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var CatalogItem = require("../../lib/Models/CatalogItem");
var CsvCatalogItem = require("../../lib/Models/CsvCatalogItem");
var SensorObservationServiceCatalogItem = require("../../lib/Models/SensorObservationServiceCatalogItem");
var ImageryLayerCatalogItem = require("../../lib/Models/ImageryLayerCatalogItem");
var ImageryProviderHooks = require("../../lib/Map/ImageryProviderHooks");
var loadAndStubTextResources = require("../Utility/loadAndStubTextResources");
var TableStyle = require("../../lib/Models/TableStyle");
var Terria = require("../../lib/Models/Terria");
var TimeInterval = require("terriajs-cesium/Source/Core/TimeInterval").default;
var VarType = require("../../lib/Map/VarType");
var TableStructure = require("../../lib/Map/TableStructure");

var greenTableStyle = new TableStyle({
  colorMap: [
    {
      offset: 0,
      color: "rgba(0, 64, 0, 1.00)"
    },
    {
      offset: 1,
      color: "rgba(0, 255, 0, 1.00)"
    }
  ]
});

function featureColor(csvItem, i) {
  return csvItem.dataSource.entities.values[i]._point._color._value;
}

describe("CsvCatalogItem with lat and lon", function() {
  var terria;
  var csvItem;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    csvItem = new CsvCatalogItem(terria);
  });

  it("has sensible type and typeName", function() {
    expect(csvItem.type).toBe("csv");
    expect(csvItem.typeName).toBe("Comma-Separated Values (CSV)");
  });

  it("throws if constructed without a Terria instance", function() {
    expect(function() {
      var viewModel = new CsvCatalogItem(); // eslint-disable-line no-unused-vars
    }).toThrow();
  });

  it("can be constructed", function() {
    expect(csvItem).toBeDefined();
  });

  it("is derived from CatalogItem", function() {
    expect(csvItem instanceof CatalogItem).toBe(true);
  });

  it("can update from json", function() {
    var dataStr = "col1, col2\ntest, 0";
    csvItem.updateFromJson({
      name: "Name",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      url: "http://my.csv.com/test.csv",
      data: dataStr,
      dataSourceUrl: "none",
      dataCustodian: "Data Custodian"
    });

    expect(csvItem.name).toBe("Name");
    expect(csvItem.description).toBe("Description");
    expect(csvItem.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
    expect(csvItem.type).toBe("csv");
    expect(csvItem.url.indexOf("http://my.csv.com/test.csv")).toBe(0);
    expect(csvItem.data.indexOf(dataStr)).toBe(0);
    expect(csvItem.dataCustodian).toBe("Data Custodian");
    expect(csvItem.dataSourceUrl).toBe("none");
  });

  it("uses reasonable defaults for updateFromJson", function() {
    csvItem.updateFromJson({});

    expect(csvItem.name).toBe("Unnamed Item");
    expect(csvItem.description).toBe("");
    expect(csvItem.rectangle).toBeUndefined();
    expect(csvItem.type).toBe("csv");
    expect(csvItem.url).toBeUndefined();
    expect(csvItem.data).toBeUndefined();
    expect(csvItem.dataSourceUrl).toBeUndefined();
    expect(csvItem.dataCustodian).toBeUndefined();
  });

  it("can be round-tripped with serializeToJson and updateFromJson", function() {
    var dataStr = "col1, col2\ntest, 0";
    csvItem.updateFromJson({
      name: "Name",
      id: "Id",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      url: "http://my.csv.com/test.csv",
      data: dataStr,
      dataSourceUrl: "none",
      dataCustodian: "Data Custodian",
      dataUrl: "http://my.csv.com/test.csv",
      dataUrlType: "direct"
    });

    var json = csvItem.serializeToJson();

    var reconstructed = new CsvCatalogItem(terria);
    reconstructed.updateFromJson(json);

    expect(reconstructed.name).toEqual(csvItem.name);
    expect(reconstructed.id).toEqual(csvItem.id);
    expect(reconstructed.description).toEqual(csvItem.description);
    expect(reconstructed.rectangle).toEqual(csvItem.rectangle);
    expect(reconstructed.url).toEqual(csvItem.url);
    expect(reconstructed.data).toEqual(csvItem.data);
    expect(reconstructed.dataSourceUrl).toEqual(csvItem.dataSourceUrl);
    expect(reconstructed.dataCustodian).toEqual(csvItem.dataCustodian);
    expect(reconstructed.dataUrl).toEqual(csvItem.dataUrl);
    expect(reconstructed.dataUrlType).toEqual(csvItem.dataUrlType);
  });

  it("is correctly loading csv data from a file", function(done) {
    csvItem.url = "test/csv/minimal.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource).toBeDefined();
        expect(csvItem.dataSource.tableStructure).toBeDefined();
        expect(csvItem.dataSource.tableStructure.columns.length).toEqual(5);
      })
      .otherwise(fail)
      .then(done);
  });

  it("is able to generate a Legend", function(done) {
    csvItem.url = "test/csv/minimal.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        expect(csvItem.legendUrl.mimeType).toBeDefined();
        expect(csvItem.legendUrl.url).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it('identifies "lat" and "lon" fields', function(done) {
    csvItem.updateFromJson({ data: "lat,lon,value\n-37,145,10" });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.hasLatitudeAndLongitude).toBe(
          true
        );
      })
      .otherwise(fail)
      .then(done);
  });

  it('identifies "latitude" and "longitude" fields', function(done) {
    csvItem.updateFromJson({ data: "latitude,longitude,value\n-37,145,10" });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.hasLatitudeAndLongitude).toBe(
          true
        );
      })
      .otherwise(fail)
      .then(done);
  });

  it('does not mistakenly identify "latvian" and "lone_person" fields', function(done) {
    csvItem.updateFromJson({
      data: "latvian,lone_person,lat,lon,value\n-37,145,-37,145,10"
    });
    csvItem
      .load()
      .then(function() {
        expect(
          csvItem.dataSource.tableStructure.columnsByType[VarType.LON][0].name
        ).toEqual("lon");
        expect(
          csvItem.dataSource.tableStructure.columnsByType[VarType.LAT][0].name
        ).toEqual("lat");
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles one line with enum", function(done) {
    csvItem.updateFromJson({ data: "lat,lon,org\n-37,145,test" });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.hasLatitudeAndLongitude).toBe(
          true
        );
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles numeric fields containing (quoted) thousands commas", function(done) {
    csvItem.updateFromJson({
      data: 'lat,lon,value\n-37,145,"1,000"\n-38,145,"234,567.89"'
    });
    csvItem
      .load()
      .then(function() {
        var tableStructure = csvItem.dataSource.tableStructure;
        expect(tableStructure.hasLatitudeAndLongitude).toBe(true);
        expect(tableStructure.columns[2].values[0]).toEqual(1000);
        expect(tableStructure.columns[2].values[1]).toBeCloseTo(234567.89, 2);
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles missing lines", function(done) {
    csvItem.url = "test/csv/blank_line.csv";
    csvItem
      .load()
      .then(function() {
        var tableStructure = csvItem.dataSource.tableStructure;
        var latColumn = tableStructure.columnsByType[VarType.LAT][0];
        var lonColumn = tableStructure.columnsByType[VarType.LON][0];
        // There are 7 lines after the header, but only 4 are non-blank.
        expect(tableStructure.columns[0].values.length).toBe(4);
        expect(latColumn.minimumValue).toBeLessThan(-30);
        expect(lonColumn.minimumValue).toBeGreaterThan(150);
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles enum fields", function(done) {
    csvItem.url = "test/csv/lat_lon_enum.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.activeItems[0].name).toBe(
          "enum"
        );
      })
      .otherwise(fail)
      .then(done);
  });

  it("sets active variable to dataVariable if provided", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_val.csv";
    csvItem._tableStyle = new TableStyle({
      dataVariable: "val"
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.activeItems[0].name).toBe(
          "val"
        );
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not set an active variable to dataVariable if null", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_val.csv";
    csvItem._tableStyle = new TableStyle({
      dataVariable: null
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.activeItems.length).toEqual(0);
      })
      .otherwise(fail)
      .then(done);
  });

  it("colors enum fields the same (only) when the value is the same", function(done) {
    csvItem.url = "test/csv/lat_lon_enum.csv";
    csvItem
      .load()
      .then(function() {
        expect(featureColor(csvItem, 0)).not.toEqual(featureColor(csvItem, 1));
        expect(featureColor(csvItem, 0)).not.toEqual(featureColor(csvItem, 2));
        expect(featureColor(csvItem, 0)).not.toEqual(featureColor(csvItem, 3));
        expect(featureColor(csvItem, 0)).toEqual(featureColor(csvItem, 4));
        expect(featureColor(csvItem, 1)).toEqual(featureColor(csvItem, 3));
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles no data variable", function(done) {
    csvItem.url = "test/csv/lat_lon_novals.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.tableStructure.activeItems.length).toEqual(0);
        expect(csvItem.dataSource.tableStructure.columns.length).toEqual(2);
        expect(
          csvItem.dataSource.tableStructure.columns[0].values.length
        ).toEqual(5);
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports dates", function(done) {
    csvItem.url = "test/csv/lat_long_enum_moving_date.csv";
    csvItem
      .load()
      .then(function() {
        var source = csvItem.dataSource;
        expect(source.tableStructure.activeTimeColumn.name).toEqual("date");
        expect(source.tableStructure.columns[0].values.length).toEqual(13);
        expect(
          source.tableStructure.columnsByType[VarType.TIME].length
        ).toEqual(1);
        expect(
          source.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]
        ).toEqual(JulianDate.fromIso8601("2015-08-01"));
        // Test that an entity exists at the expected dates.
        var features = source.entities.values;
        var featureDates = features.map(getPropertiesDate);
        expect(featureDates.indexOf("2015-07-31")).toBe(-1); // no such dates in the input file
        expect(featureDates.indexOf("2015-08-07")).toBe(-1);
        var earlyFeature = features[featureDates.indexOf("2015-08-01")];
        // The date '2015-08-01' appears to be interpreted as starting at midnight in the local time zone (at least on Chrome).
        // Eg. in Sydney summer, JulianDate.toIso8601(earlyFeature.availability.start) returns "2015-07-31T14:00:00Z".
        expect(
          TimeInterval.contains(
            earlyFeature.availability,
            JulianDate.fromIso8601("2015-08-01")
          )
        ).toBe(true);
        // Also test the duration of the interval is one day (the time between input rows).
        var durationInSeconds = JulianDate.secondsDifference(
          earlyFeature.availability.stop,
          earlyFeature.availability.start
        );
        expect(durationInSeconds).toBe(24 * 3600); // 24 hours
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports dates and very long displayDuration", function(done) {
    var sevenDaysInMinutes = 60 * 24 * 7;
    csvItem.url = "test/csv/lat_long_enum_moving_date.csv";
    csvItem._tableStyle = new TableStyle({
      displayDuration: sevenDaysInMinutes
    });
    csvItem
      .load()
      .then(function() {
        // Now, the features' availabilities should persist for 7 days, not just under 1 day.
        var features = csvItem.dataSource.entities.values;
        var featureDates = features.map(getPropertiesDate);
        var earlyFeature = features[featureDates.indexOf("2015-08-01")];
        expect(
          TimeInterval.contains(
            earlyFeature.availability,
            JulianDate.fromIso8601("2015-08-01T12:00:00Z")
          )
        ).toBe(true);
        var durationInSeconds = JulianDate.secondsDifference(
          earlyFeature.availability.stop,
          earlyFeature.availability.start
        );
        expect(durationInSeconds).toEqual(sevenDaysInMinutes * 60);
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports dates sorted randomly", function(done) {
    // Now that we use availability to establish when entities exist, this is not much of a test.
    // Could delete, or change it to test something more useful.
    csvItem.url = "test/csv/lat_lon_enum_moving_date_unsorted.csv";
    csvItem
      .load()
      .then(function() {
        var source = csvItem.dataSource;
        expect(source.tableStructure.columns[0].values.length).toEqual(13);
        expect(
          source.tableStructure.columnsByType[VarType.TIME].length
        ).toEqual(1);
        // expect(source.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]).toEqual(JulianDate.fromIso8601('2015-08-05'));
        // Test that an entity exists at the expected dates.
        var features = source.entities.values;
        var featureDates = features.map(getPropertiesDate);
        expect(featureDates.indexOf("2015-07-31")).toBe(-1); // no such dates in the input file
        expect(featureDates.indexOf("2015-08-07")).toBe(-1);
        var earlyFeature = features[featureDates.indexOf("2015-08-01")];
        // The date '2015-08-01' appears to be interpreted as starting at midnight in the local time zone (at least on Chrome).
        // Eg. in Sydney summer, JulianDate.toIso8601(earlyFeature.availability.start) returns "2015-07-31T14:00:00Z".
        expect(
          TimeInterval.contains(
            earlyFeature.availability,
            JulianDate.fromIso8601("2015-08-01")
          )
        ).toBe(true);
        // Also test the duration of the interval is one day (the time between input rows).
        var durationInSeconds = JulianDate.secondsDifference(
          earlyFeature.availability.stop,
          earlyFeature.availability.start
        );
        expect(durationInSeconds).toBe(24 * 3600); // 24 hours
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports moving-point csvs with id column by default", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_date_id.csv";
    csvItem
      .load()
      .then(function() {
        var features = csvItem.dataSource.entities.values;
        expect(features.length).toEqual(4); // There are 4 features A, B, C and D; does not equal the 13 rows in the file.
        var featureA = features.filter(function(feature) {
          return feature.name === "feature A";
        })[0];
        // FeatureA has rows for 1,2,4,5,6th of August. But it should still be available on the 3rd.
        expect(
          TimeInterval.contains(
            featureA.availability,
            JulianDate.fromIso8601("2015-08-02")
          )
        ).toBe(true);
        expect(
          TimeInterval.contains(
            featureA.availability,
            JulianDate.fromIso8601("2015-08-03")
          )
        ).toBe(true);
        expect(
          TimeInterval.contains(
            featureA.availability,
            JulianDate.fromIso8601("2015-08-04")
          )
        ).toBe(true);
        expect(
          TimeInterval.contains(
            featureA.availability,
            JulianDate.fromIso8601("2015-08-08")
          )
        ).toBe(false);
        // Check there is no animation gap at the end of moving point csv
        expect(
          JulianDate.equalsEpsilon(
            csvItem.clock.stopTime,
            JulianDate.fromIso8601("2015-08-06"),
            1
          )
        ).toBe(true);
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports overriding moving-point csvs with id column using null", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_date_id.csv";
    csvItem.idColumns = null;
    csvItem
      .load()
      .then(function() {
        var features = csvItem.dataSource.entities.values;
        expect(features.length).toEqual(13); // There are 13 rows in the file.
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports overriding moving-point csvs with id column using []", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_date_id.csv";
    csvItem.idColumns = [];
    csvItem
      .load()
      .then(function() {
        var features = csvItem.dataSource.entities.values;
        expect(features.length).toEqual(13); // There are 13 rows in the file.
      })
      .otherwise(fail)
      .then(done);
  });

  it("ignores dates if tableStyle.timeColumn is null", function(done) {
    csvItem.url = "test/csv/lat_long_enum_moving_date.csv";
    csvItem._tableStyle = new TableStyle({ timeColumn: null });
    csvItem
      .load()
      .then(function() {
        var source = csvItem.dataSource;
        expect(source.tableStructure.activeTimeColumn).toBeUndefined();
        expect(csvItem.clock).toBeUndefined();
        expect(source.clock).toBeUndefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("ignores dates if tableStyle.timeColumn is set to null from json", function(done) {
    // The test above did not pick up a problem in updateFromJson when the meaning of Cesium's defined was changed to also mean notNull (Cesium 1.19).
    csvItem.url = "test/csv/lat_long_enum_moving_date.csv";
    csvItem._tableStyle = new TableStyle();
    csvItem._tableStyle.updateFromJson({ timeColumn: null });
    csvItem
      .load()
      .then(function() {
        var source = csvItem.dataSource;
        expect(source.tableStructure.activeTimeColumn).toBeUndefined();
        expect(csvItem.clock).toBeUndefined();
        expect(source.clock).toBeUndefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("uses a second date column with tableStyle.timeColumn name", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_date_year.csv";
    csvItem._tableStyle = new TableStyle({ timeColumn: "year" });
    csvItem
      .load()
      .then(function() {
        var source = csvItem.dataSource;
        expect(source.tableStructure.activeTimeColumn.name).toEqual("year");
      })
      .otherwise(fail)
      .then(done);
  });

  it("uses a second date column with tableStyle.timeColumn index", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_date_year.csv";
    csvItem._tableStyle = new TableStyle({ timeColumn: 4 });
    csvItem
      .load()
      .then(function() {
        var source = csvItem.dataSource;
        expect(source.tableStructure.activeTimeColumn.name).toEqual("year");
      })
      .otherwise(fail)
      .then(done);
  });

  it("returns valid values for intervals", function(done) {
    csvItem.url = "test/csv/lat_long_enum_moving_date.csv";
    csvItem._tableStyle = new TableStyle({ displayDuration: 60 });
    csvItem
      .load()
      .then(function() {
        var intervals = csvItem.intervals;

        expect(intervals.length).toBe(6); // 13 rows over 6 days

        // interval length is 1 hour
        expect(intervals.get(0).start).toEqual(
          JulianDate.fromIso8601("2015-08-01")
        );
        expect(intervals.get(0).stop).toEqual(
          JulianDate.fromIso8601("2015-08-01T01:00Z")
        );

        expect(intervals.start).toEqual(JulianDate.fromIso8601("2015-08-01"));
        expect(intervals.stop).toEqual(
          JulianDate.fromIso8601("2015-08-06T01:00Z")
        );
      })
      .otherwise(fail)
      .then(done);
  });

  it("has the right values in descriptions for feature picking", function(done) {
    csvItem.url = "test/csv/lat_lon_enum.csv";
    csvItem
      .load()
      .then(function() {
        function desc(i) {
          return csvItem.dataSource.entities.values[i].description._value;
        }
        expect(desc(0)).toContain("hello");
        expect(desc(1)).toContain("boots");
      })
      .otherwise(fail)
      .then(done);
  });

  it("has a blank in the description table for a missing number", function(done) {
    csvItem.url = "test/csv/missingNumberFormatting.csv";
    return csvItem
      .load()
      .then(function() {
        var entities = csvItem.dataSource.entities.values;
        expect(entities.length).toBe(2);
        expect(entities[0].description.getValue()).toMatch(
          "<td>Vals</td><td[^>]*>10</td>"
        );
        expect(entities[1].description.getValue()).toMatch(
          "<td>Vals</td><td[^>]*>-</td>"
        );
      })
      .otherwise(fail)
      .then(done);
  });

  it("scales points to a size ratio of 300% if scaleByValue true and respects scale value", function(done) {
    csvItem.url = "test/csv/lat_lon_val.csv";
    csvItem._tableStyle = new TableStyle({ scale: 5, scaleByValue: true });
    return csvItem
      .load()
      .then(function() {
        var pixelSizes = csvItem.dataSource.entities.values.map(function(e) {
          return e.point._pixelSize._value;
        });
        csvItem._minPix = Math.min.apply(null, pixelSizes);
        csvItem._maxPix = Math.max.apply(null, pixelSizes);
        // we don't want to be too prescriptive, but by default the largest object should be 150% normal, smallest is 50%, so 3x difference.
        expect(csvItem._maxPix).toEqual(csvItem._minPix * 3);
      })
      .then(function() {
        var csvItem2 = new CsvCatalogItem(terria);
        csvItem2._tableStyle = new TableStyle({
          scale: 10,
          scaleByValue: true
        });
        csvItem2.url = "test/csv/lat_lon_val.csv";
        return csvItem2.load().yield(csvItem2);
      })
      .then(function(csvItem2) {
        var pixelSizes = csvItem2.dataSource.entities.values.map(function(e) {
          return e.point._pixelSize._value;
        });
        var minPix = Math.min.apply(null, pixelSizes);
        var maxPix = Math.max.apply(null, pixelSizes);
        // again, we don't specify the base size, but x10 things should be twice as big as x5 things.
        expect(maxPix).toEqual(csvItem._maxPix * 2);
        expect(minPix).toEqual(csvItem._minPix * 2);
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not make a feature if it is missing longitude", function(done) {
    csvItem.url = "test/csv/lat_lon-missing_val.csv";
    return csvItem
      .load()
      .then(function() {
        expect(csvItem.tableStructure.columns[0].values.length).toEqual(5);
        expect(csvItem.dataSource.entities.values.length).toEqual(4); // one line is missing longitude.
      })
      .otherwise(fail)
      .then(done);
  });

  it("makes features even if no value column", function(done) {
    csvItem.url = "test/csv/lat_lon.csv";
    return csvItem
      .load()
      .then(function() {
        expect(csvItem.dataSource.entities.values.length).toBeGreaterThan(1);
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports replaceWithNullValues", function(done) {
    csvItem.url = "test/csv/lat_lon_badvalue.csv";
    csvItem._tableStyle = new TableStyle({ replaceWithNullValues: ["bad"] });
    csvItem
      .load()
      .then(function() {
        var valueColumn = csvItem.tableStructure.columns[2];
        expect(valueColumn.values[0]).toEqual(5);
        expect(valueColumn.values[1]).toEqual(null);
        expect(valueColumn.values[2]).toEqual(0);
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports replaceWithZeroValues", function(done) {
    csvItem.url = "test/csv/lat_lon_badvalue.csv";
    csvItem._tableStyle = new TableStyle({ replaceWithZeroValues: ["bad"] });
    csvItem
      .load()
      .then(function() {
        var valueColumn = csvItem.tableStructure.columns[2];
        expect(valueColumn.values[0]).toEqual(5);
        expect(valueColumn.values[1]).toEqual(0);
        expect(valueColumn.values[2]).toEqual(0);
      })
      .otherwise(fail)
      .then(done);
  });

  it("defaults to blanks in numeric columns being null", function(done) {
    csvItem.url = "test/csv/lat_lon_blankvalue.csv";
    csvItem
      .load()
      .then(function() {
        var valueColumn = csvItem.tableStructure.columns[2];
        expect(valueColumn.values[0]).toEqual(5);
        expect(valueColumn.values[1]).toEqual(null);
        expect(valueColumn.values[2]).toEqual(0);
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not color null the same as zero", function(done) {
    csvItem.url = "test/csv/lat_lon_badvalue.csv";
    csvItem._tableStyle = new TableStyle({ replaceWithNullValues: ["bad"] });
    csvItem
      .load()
      .then(function() {
        expect(featureColor(csvItem, 1)).not.toEqual(featureColor(csvItem, 2));
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports nullColor", function(done) {
    csvItem.url = "test/csv/lat_lon_badvalue.csv";
    csvItem._tableStyle = new TableStyle({
      replaceWithNullValues: ["bad"],
      nullColor: "#A0B0C0"
    });
    var nullColor = new Color(160 / 255, 176 / 255, 192 / 255, 1);
    csvItem
      .load()
      .then(function() {
        expect(featureColor(csvItem, 1)).toEqual(nullColor);
        // This next expectation checks that zeros and null values are differently colored, and that
        // null values do not lead to coloring getting out of sync with values.
        expect(featureColor(csvItem, 2)).not.toEqual(nullColor);
      })
      .otherwise(fail)
      .then(done);
  });

  it("when no column selected, colors with non-null color", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_val.csv";
    csvItem._tableStyle = new TableStyle({
      dataVariable: null,
      nullColor: "#000000"
    });
    var nullColor = new Color(0, 0, 0, 1);
    csvItem
      .load()
      .then(function() {
        expect(featureColor(csvItem, 1)).not.toEqual(nullColor);
      })
      .otherwise(fail)
      .then(done);
  });

  it('replaces enum tail with "X other values" in the legend', function(done) {
    csvItem.url = "test/csv/lat_lon_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({ colorBins: 9 });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).toContain("2 other values");
        expect(url).not.toContain("unicorns");
        expect(url).toContain("guinea pigs");
      })
      .otherwise(fail)
      .then(done);
  });

  it('does not replace enum tail with "other values" if it fits', function(done) {
    csvItem.url = "test/csv/lat_lon_enum_lots2.csv";
    csvItem._tableStyle = new TableStyle({ colorBins: 9 });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        expect(csvItem.legendUrl.url).not.toContain("other values");
        expect(csvItem.legendUrl.url).toContain("turtles");
      })
      .otherwise(fail)
      .then(done);
  });

  it("honors colorBins property when it is less than the number of colors in the palette", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({ colorBins: 3 });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).toContain("8 other values");
        expect(url).toContain("cats");
        expect(url).toContain("dogs");
      })
      .otherwise(fail)
      .then(done);
  });

  it('displays a "XX values" legend when colorBinMethod=cycle and there are more unique values than color bins', function(done) {
    csvItem.url = "test/csv/lat_lon_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({
      colorBins: 9,
      colorBinMethod: "cycle"
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).toContain("10 values");
        expect(url).not.toContain("dogs");
      })
      .otherwise(fail)
      .then(done);
  });

  it("displays a normal legend when colorBinMethod=cycle but there are less unique values than color bins", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({
      colorBins: 15,
      colorBinMethod: "cycle"
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).not.toContain("values");
        expect(url).toContain("dogs");
      })
      .otherwise(fail)
      .then(done);
  });

  describe("and per-column tableStyle", function() {
    it("scales by value", function(done) {
      csvItem.url = "test/csv/lat_lon_val.csv";
      csvItem._tableStyle = new TableStyle({
        columns: {
          value: {
            // only scale the 'value' column
            scale: 5,
            scaleByValue: true
          }
        }
      });
      return csvItem
        .load()
        .then(function() {
          var pixelSizes = csvItem.dataSource.entities.values.map(function(e) {
            return e.point._pixelSize._value;
          });
          csvItem._minPix = Math.min.apply(null, pixelSizes);
          csvItem._maxPix = Math.max.apply(null, pixelSizes);
          // we don't want to be too prescriptive, but by default the largest object should be 150% normal, smallest is 50%, so 3x difference.
          expect(csvItem._maxPix).toEqual(csvItem._minPix * 3);
        })
        .then(function() {
          var csvItem2 = new CsvCatalogItem(terria);
          csvItem2._tableStyle = new TableStyle({
            scale: 10,
            scaleByValue: true
          }); // this time, apply it to all columns
          csvItem2.url = "test/csv/lat_lon_val.csv";
          return csvItem2.load().yield(csvItem2);
        })
        .then(function(csvItem2) {
          var pixelSizes = csvItem2.dataSource.entities.values.map(function(e) {
            return e.point._pixelSize._value;
          });
          var minPix = Math.min.apply(null, pixelSizes);
          var maxPix = Math.max.apply(null, pixelSizes);
          // again, we don't specify the base size, but x10 things should be twice as big as x5 things.
          expect(maxPix).toEqual(csvItem._maxPix * 2);
          expect(minPix).toEqual(csvItem._minPix * 2);
        })
        .otherwise(fail)
        .then(done);
    });

    it("uses correct defaults", function(done) {
      // nullColor is passed through to the columns as well, if not overridden explicitly.
      csvItem.url = "test/csv/lat_lon_badvalue.csv";
      csvItem._tableStyle = new TableStyle({
        nullColor: "#A0B0C0",
        columns: {
          value: {
            replaceWithNullValues: ["bad"]
          }
        }
      });
      var nullColor = new Color(160 / 255, 176 / 255, 192 / 255, 1);
      csvItem
        .load()
        .then(function() {
          expect(featureColor(csvItem, 1)).toEqual(nullColor);
        })
        .otherwise(fail)
        .then(done);
    });

    it("supports name and nullColor with column ref by name", function(done) {
      csvItem.url = "test/csv/lat_lon_badvalue.csv";
      csvItem._tableStyle = new TableStyle({
        nullColor: "#123456",
        columns: {
          value: {
            replaceWithNullValues: ["bad"],
            nullColor: "#A0B0C0",
            name: "Temperature"
          }
        }
      });
      var nullColor = new Color(160 / 255, 176 / 255, 192 / 255, 1);
      csvItem
        .load()
        .then(function() {
          expect(csvItem.tableStructure.columns[2].name).toEqual("Temperature");
          expect(featureColor(csvItem, 1)).toEqual(nullColor);
        })
        .otherwise(fail)
        .then(done);
    });

    it("supports nullColor with column ref by number", function(done) {
      csvItem.url = "test/csv/lat_lon_badvalue.csv";
      csvItem._tableStyle = new TableStyle({
        columns: {
          2: {
            replaceWithNullValues: ["bad"],
            nullColor: "#A0B0C0"
          }
        }
      });
      var nullColor = new Color(160 / 255, 176 / 255, 192 / 255, 1);
      csvItem
        .load()
        .then(function() {
          expect(featureColor(csvItem, 1)).toEqual(nullColor);
        })
        .otherwise(fail)
        .then(done);
    });

    it("supports type", function(done) {
      csvItem.url = "test/csv/lat_lon_badvalue.csv";
      csvItem._tableStyle = new TableStyle({
        columns: {
          value: {
            replaceWithNullValues: ["bad"],
            type: "enum"
          }
        }
      });
      csvItem
        .load()
        .then(function() {
          expect(csvItem.tableStructure.columns[2].type).toEqual(VarType.ENUM);
        })
        .otherwise(fail)
        .then(done);
    });
  });
});

// eg. use as entities.map(getPropertiesDate) to just get the dates of the entities.
function getPropertiesDate(obj) {
  return obj.properties.date.getValue();
}

// eg. use as regions.map(getId) to just get the ids of the regions.
function getId(obj) {
  return obj.id;
}

describe("CsvCatalogItem with region mapping", function() {
  var terria;
  var csvItem;
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "test/csv/regionMapping.json";
    csvItem = new CsvCatalogItem(terria);

    // Instead of directly inspecting the recoloring function (which is a private and inaccessible variable),
    // get it from this function call.
    // This unfortunately makes the test depend on an implementation detail.
    spyOn(ImageryProviderHooks, "addRecolorFunc");

    // Also, for feature detection, spy on this call; the second argument is the regionImageryProvider.
    // This unfortunately makes the test depend on an implementation detail.
    spyOn(ImageryLayerCatalogItem, "enableLayer");

    // loadAndStubTextResources(done, [
    //     terria.configParameters.regionMappingDefinitionsUrl
    // ]).then(done).otherwise(done.fail);
  });

  it("does not think a lat-lon csv has regions", function(done) {
    csvItem.url = "test/csv/lat_long_enum_moving_date.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.regionMapping).toBeUndefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not use region mapping when regions present with lat and lon", function(done) {
    csvItem.url = "test/csv/lat_lon_enum_postcode.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.regionMapping).toBeUndefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("detects LGAs by code", function(done) {
    csvItem.updateFromJson({ data: "lga_code,value\n31000,1" });
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        expect(regionDetail.columnName).toEqual("lga_code");
        expect(regionDetail.regionProvider.regionType).toEqual("LGA");
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("matches LGAs by code", function(done) {
    csvItem.updateFromJson({ data: "lga_code,value\n31000,1" });
    csvItem
      .load()
      .then(function() {
        csvItem.isEnabled = true; // The recolorFunction call is only made once the layer is enabled.
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(
          0
        )[1];
        var indexOfThisRegion = regionDetail.regionProvider.regions
          .map(getId)
          .indexOf(31000);
        expect(recolorFunction(indexOfThisRegion)[0]).toBeDefined(); // Test that at least one rgba component is defined.
        expect(recolorFunction(indexOfThisRegion)).not.toEqual([0, 0, 0, 0]); // And that the color is not all zeros.
      })
      .otherwise(fail)
      .then(done);
  });

  it("matches LGAs by names in various formats", function(done) {
    // City of Melbourne is not actually a region, but melbourne is. Same with Sydney (S) and sydney. But test they work anyway.
    csvItem.updateFromJson({
      data:
        "lga_name,value\nCity of Melbourne,1\nGreater Geelong,2\nSydney (S),3"
    });
    csvItem
      .load()
      .then(function() {
        csvItem.isEnabled = true;
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(
          0
        )[1];
        var regionNames = regionDetail.regionProvider.regions.map(getId);
        expect(recolorFunction(regionNames.indexOf("bogan"))).not.toBeDefined(); // Test that we didn't try to recolor other regions.
        expect(
          recolorFunction(regionNames.indexOf("melbourne"))[0]
        ).toBeDefined(); // Test that at least one rgba component is defined.
        expect(recolorFunction(regionNames.indexOf("melbourne"))).not.toEqual([
          0,
          0,
          0,
          0
        ]); // And that the color is not all zeros.
        expect(
          recolorFunction(regionNames.indexOf("greater geelong"))[0]
        ).toBeDefined(); // Test that at least one rgba component is defined.
        expect(
          recolorFunction(regionNames.indexOf("greater geelong"))
        ).not.toEqual([0, 0, 0, 0]); // And that the color is not all zeros.
        expect(recolorFunction(regionNames.indexOf("sydney"))[0]).toBeDefined(); // Test that at least one rgba component is defined.
        expect(recolorFunction(regionNames.indexOf("sydney"))).not.toEqual([
          0,
          0,
          0,
          0
        ]); // And that the color is not all zeros.
      })
      .otherwise(fail)
      .then(done);
  });

  it("matches mapped region column names", function(done) {
    csvItem.updateFromJson({
      data: "nothing,value\n31000,1",
      tableStyle: {
        columns: {
          nothing: {
            name: "lga_code"
          }
        }
      }
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.regionMapping.regionDetails).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not match original name of mapped region column names", function(done) {
    csvItem.updateFromJson({
      data: "lga_code,value\n31000,1",
      tableStyle: {
        columns: {
          lga_code: {
            name: "something else"
          }
        }
      }
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.regionMapping).not.toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  // TODO: What is this testing?
  xit("matches numeric state IDs with regexes", function(done) {
    csvItem.updateFromJson({
      data: "state,value\n3,30\n4,40\n5,50,\n8,80\n9,90"
    });
    csvItem
      .load()
      .then(function() {
        csvItem.isEnabled = true;
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        var regionNames = regionDetail.regionProvider.regions.map(getId);
        // TODO: This is the old test, which doesn't really have an equivalent in the new csv refactor:
        // expect(csvItem.dataSource.dataset.variables.state.regionCodes).toEqual(["queensland", "south australia", "western australia", "other territories"]);
        // Possibly something like this?  However, this fails - it includes tasmania and not queensland.
        var names = csvItem.dataSource.tableStructure.columns[0].values.map(
          function(id) {
            return regionNames[id];
          }
        );
        expect(names).toEqual([
          "queensland",
          "south australia",
          "western australia",
          "other territories"
        ]);
      })
      .otherwise(fail)
      .then(done);
  });

  // I think this would be better as a test of RegionProvider?
  // it('matches SA4s', function(done) {
  //     csvItem.updateFromJson({data: 'sa4,value\n209,correct'});
  //     csvItem.load().then(function() {
  //         csvItem.isEnabled = true;
  //         return csvItem.dataSource.regionPromise.then(function(regionDetails) {
  //             expect(regionDetails).toBeDefined();
  //             // There is no "rowPropertiesByCode" method any more.
  //             expect(csvItem.rowPropertiesByCode(209).value).toBe('correct');
  //         }).otherwise(fail);
  //     }).otherwise(fail).then(done);
  // });

  it("respects tableStyle color ramping for regions", function(done) {
    csvItem.updateFromJson({
      data: "lga_name,value\nmelbourne,0\ngreater geelong,5\nsydney,10",
      tableStyle: greenTableStyle
    });
    csvItem
      .load()
      .then(function() {
        csvItem.isEnabled = true;
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(
          0
        )[1];
        var regionNames = regionDetail.regionProvider.regions.map(getId);
        // Require the green value to range from 64 to 255, but do not require a linear mapping.
        expect(recolorFunction(regionNames.indexOf("melbourne"))).toEqual([
          0,
          64,
          0,
          255
        ]);
        expect(
          recolorFunction(regionNames.indexOf("greater geelong"))[1]
        ).toBeGreaterThan(64);
        expect(
          recolorFunction(regionNames.indexOf("greater geelong"))[1]
        ).toBeLessThan(255);
        expect(recolorFunction(regionNames.indexOf("sydney"))).toEqual([
          0,
          255,
          0,
          255
        ]);
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("uses the requested region mapping column, not just the first one", function(done) {
    // The column names in postcode_lga_val_enum.csv are: lga_name, val1, enum, postcode.
    var revisedGreenTableStyle = clone(greenTableStyle);
    revisedGreenTableStyle.regionType = "poa";
    revisedGreenTableStyle.regionVariable = "postcode";
    csvItem.updateFromJson({
      url: "test/csv/postcode_lga_val_enum.csv",
      tableStyle: revisedGreenTableStyle
    });
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        expect(
          csvItem.tableStructure.columnsByType[VarType.REGION][0].name
        ).toBe("postcode");
      })
      .otherwise(fail)
      .then(done);
  });

  it("can default to an enum field", function(done) {
    csvItem.url = "test/csv/postcode_enum.csv";
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        expect(csvItem.tableStructure.activeItems[0].name).toBe("enum");
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles one line with enum", function(done) {
    csvItem.updateFromJson({ data: "state,org\nNSW,test" });
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles no data variable", function(done) {
    csvItem.url = "test/csv/postcode_novals.csv";
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        expect(csvItem.tableStructure.activeItems.length).toEqual(0);
        expect(csvItem.tableStructure.columns[0].values.length).toBeGreaterThan(
          1
        );
        csvItem.isEnabled = true;
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("chooses the leftmost data column when none specified", function(done) {
    csvItem.url = "test/csv/val_enum_postcode.csv";
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        expect(csvItem.tableStructure.activeItems[0].name).toEqual("val1");
      })
      .otherwise(fail)
      .then(done);
  });

  it("handles LGA names with states for disambiguation", function(done) {
    csvItem.updateFromJson({
      url: "test/csv/lga_state_disambig.csv",
      tableStyle: new TableStyle({ dataVariable: "StateCapital" })
    });
    csvItem
      .load()
      .then(function() {
        var regionDetails = csvItem.regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        expect(regionDetail.disambigColumnName).toEqual("State");
        // The following test is much more rigorous.
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports region-mapped files with dates", function(done) {
    csvItem.updateFromJson({
      url: "test/csv/postcode_date_value.csv"
    });
    csvItem
      .load()
      .then(function() {
        var regionMapping = csvItem.regionMapping;
        var j = JulianDate.fromIso8601;
        regionMapping._catalogItem.clock.currentTime = j("2015-08-08");
        csvItem.isEnabled = true;
        var regionDetails = regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        expect(csvItem.tableStructure.columns[0].values.length).toEqual(10);
        expect(
          csvItem.tableStructure.columnsByType[VarType.TIME].length
        ).toEqual(1);
        expect(
          csvItem.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]
        ).toEqual(j("2015-08-07"));
        // Test that the right regions have been colored (since the datasource doesn't expose the entities).
        // On 2015-08-08, only postcodes 3121 and 3122 have values. On neighboring dates, so do 3123 and 3124.
        var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(
          0
        )[1];
        var regionNames = regionDetail.regionProvider.regions.map(getId);

        expect(recolorFunction(regionNames.indexOf("3121"))).toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3122"))).toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3123"))).not.toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3124"))).not.toBeDefined();
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports region-mapped files with missing dates", function(done) {
    csvItem.updateFromJson({
      url: "test/csv/postcode_date_value_missing_date.csv"
    });
    csvItem
      .load()
      .then(function() {
        var regionMapping = csvItem.regionMapping;
        var j = JulianDate.fromIso8601;
        regionMapping._catalogItem.clock.currentTime = j("2015-08-08");
        csvItem.isEnabled = true;
        var regionDetails = regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        expect(csvItem.tableStructure.columns[0].values.length).toEqual(10);
        expect(
          csvItem.tableStructure.columnsByType[VarType.TIME].length
        ).toEqual(1);
        expect(
          csvItem.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]
        ).toEqual(j("2015-08-07"));
        // Test that the right regions have been colored (since the datasource doesn't expose the entities).
        // On 2015-08-08, only postcodes 3121 and 3122 have values. On neighboring dates, so do 3123 and 3124.
        var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(
          0
        )[1];
        var regionNames = regionDetail.regionProvider.regions.map(getId);

        expect(recolorFunction(regionNames.indexOf("3121"))).toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3122"))).not.toBeDefined(); // This one was eliminated.
        expect(recolorFunction(regionNames.indexOf("3123"))).not.toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3124"))).not.toBeDefined();
        expect(csvItem.legendUrl).toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it("supports region-mapped files with displayDuration and dates", function(done) {
    csvItem.updateFromJson({
      url: "test/csv/postcode_date_value.csv",
      tableStyle: new TableStyle({ displayDuration: 60 * 6 }) // 6 hours
    });
    csvItem
      .load()
      .then(function() {
        var regionMapping = csvItem.regionMapping;
        var j = JulianDate.fromIso8601;
        var nineOclock = j("2015-08-08"); // midnight local time
        JulianDate.addHours(nineOclock, 9, nineOclock);
        regionMapping._catalogItem.clock.currentTime = nineOclock;
        csvItem.isEnabled = true;
        var regionDetails = regionMapping.regionDetails;
        expect(regionDetails).toBeDefined();
        var regionDetail = regionDetails[0];
        expect(csvItem.tableStructure.columns[0].values.length).toEqual(10);
        expect(
          csvItem.tableStructure.columnsByType[VarType.TIME].length
        ).toEqual(1);
        expect(
          csvItem.tableStructure.columnsByType[VarType.TIME][0].julianDates[0]
        ).toEqual(j("2015-08-07"));
        // Test that no regions have been colored, since at 9am we are more than 6 hours past the start date of any row.
        var recolorFunction = ImageryProviderHooks.addRecolorFunc.calls.argsFor(
          0
        )[1];
        var regionNames = regionDetail.regionProvider.regions.map(getId);

        expect(recolorFunction(regionNames.indexOf("3121"))).not.toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3122"))).not.toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3123"))).not.toBeDefined();
        expect(recolorFunction(regionNames.indexOf("3124"))).not.toBeDefined();
      })
      .otherwise(fail)
      .then(done);
  });

  it('replaces enum tail with "X other values" in the legend', function(done) {
    csvItem.url = "test/csv/postcode_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({ colorBins: 9 });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).toContain("2 other values");
        expect(url).not.toContain("unicorns");
        expect(url).toContain("guinea pigs");
      })
      .otherwise(fail)
      .then(done);
  });

  it("honors colorBins property when it is less than the number of colors in the palette", function(done) {
    csvItem.url = "test/csv/postcode_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({ colorBins: 3 });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).toContain("8 other values");
        expect(url).toContain("cats");
        expect(url).toContain("dogs");
      })
      .otherwise(fail)
      .then(done);
  });

  it('displays a "XX values" legend when colorBinMethod=cycle and there are more unique values than color bins', function(done) {
    csvItem.url = "test/csv/postcode_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({
      colorBins: 9,
      colorBinMethod: "cycle"
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).toContain("10 values");
        expect(url).not.toContain("dogs");
      })
      .otherwise(fail)
      .then(done);
  });

  it("displays a normal legend when colorBinMethod=cycle but there are less unique values than color bins", function(done) {
    csvItem.url = "test/csv/postcode_enum_lots.csv";
    csvItem._tableStyle = new TableStyle({
      colorBins: 15,
      colorBinMethod: "cycle"
    });
    csvItem
      .load()
      .then(function() {
        expect(csvItem.legendUrl).toBeDefined();
        var url = csvItem.legendUrl.url;
        expect(url).not.toContain("values");
        expect(url).toContain("dogs");
      })
      .otherwise(fail)
      .then(done);
  });

  it("is less than 2000 characters when serialised to JSON then URLEncoded", function(done) {
    csvItem.url = "test/csv/postcode_enum.csv";
    csvItem
      .load()
      .then(function() {
        var url = encodeURIComponent(JSON.stringify(csvItem.serializeToJson()));
        expect(url.length).toBeLessThan(2000);
      })
      .otherwise(fail)
      .then(done);
  });

  //describe('when data is partially unmatchable', function() {
  //    beforeEach(function(done) {
  //        spyOn(terria.error, 'raiseEvent');
  //        csvItem.updateFromJson({data: 'Postcode,value\n2000,1\n9999,2'}).otherwise(fail);
  //        csvItem.load().then(done);
  //    });
  //
  //    xit('emits an error event', function() {
  //        csvItem.isEnabled = true;
  //        expect(terria.error.raiseEvent).toHaveBeenCalled();
  //    });
  //
  //    xit('and showWarnings is false, it emits no error event or JS Error', function() {
  //        csvItem.showWarnings = false;
  //        csvItem.isEnabled = true;
  //        expect(terria.error.raiseEvent).not.toHaveBeenCalled();
  //    });
  //});

  describe("and feature picking", function() {
    var postcode3124 = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          id: "FID_POA_2011_AUST.766",
          geometry: {
            type: "MultiPolygon",
            coordinates: []
          },
          geometry_name: "the_geom",
          properties: {
            FID: 765,
            POA_CODE: "3124",
            POA_NAME: "3124",
            SQKM: 7.29156648352383
          }
        }
      ],
      crs: {
        type: "name",
        properties: {
          name: "urn:ogc:def:crs:EPSG::4326"
        }
      }
    };

    it("works", function(done) {
      var csvFile = "test/csv/postcode_val_enum.csv";

      loadAndStubTextResources(done, [
        csvFile,
        terria.configParameters.regionMappingDefinitionsUrl,
        "data/regionids/region_map-FID_POA_2011_AUST_POA_CODE.json"
      ]).then(function(resources) {
        jasmine.Ajax.stubRequest(
          "http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_POA_2011_AUST&srs=EPSG%3A3857&bbox=16143500.373829227%2C-4559315.8631541915%2C16153284.31344973%2C-4549531.923533689&width=256&height=256&query_layers=region_map%3AFID_POA_2011_AUST&x=217&y=199&info_format=application%2Fjson"
        ).andReturn({
          responseText: JSON.stringify(postcode3124)
        });

        csvItem.url = csvFile;
        csvItem
          .load()
          .then(function() {
            csvItem.isEnabled = true; // Required to create an imagery layer.
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the argument[1] is the regionImageryProvider.
            // This unfortunately makes the test depend on an implementation detail.
            var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(
              0
            )[1];
            expect(regionImageryProvider).toBeDefined();
            return regionImageryProvider.pickFeatures(
              3698,
              2513,
              12,
              2.5323739090365693,
              -0.6604719122857645
            );
          })
          .then(function(r) {
            expect(r[0].name).toEqual("3124");
            var description = r[0].description; //.getValue(terria.clock.currentTime);
            expect(description).toContain("42.42");
            expect(description).toContain("the universe");
          })
          .otherwise(fail)
          .then(done);
      });
    });

    it("works with fuzzy matching", function(done) {
      var csvFile = "test/csv/lga_fuzzy_val.csv";

      loadAndStubTextResources(done, [
        csvFile,
        terria.configParameters.regionMappingDefinitionsUrl,
        "data/regionids/region_map-FID_LGA_2011_AUST_LGA_NAME11.json",
        "data/regionids/region_map-FID_LGA_2011_AUST_STE_NAME11.json"
      ]).then(function(resources) {
        jasmine.Ajax.stubRequest(
          "http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_LGA_2011_AUST&srs=EPSG%3A3857&bbox=16143500.373829227%2C-4559315.8631541915%2C16153284.31344973%2C-4549531.923533689&width=256&height=256&query_layers=region_map%3AFID_LGA_2011_AUST&x=217&y=199&info_format=application%2Fjson"
        ).andReturn({
          responseText: JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                id: "FID_LGA_2011_AUST.163",
                geometry: {
                  type: "MultiPolygon",
                  coordinates: []
                },
                geometry_name: "the_geom",
                properties: {
                  FID: 162,
                  LGA_CODE11: "21110",
                  LGA_NAME11: "Boroondara (C)",
                  STE_CODE11: "2",
                  STE_NAME11: "Victoria",
                  AREA_SQKM: 60.1808559111785
                }
              }
            ],
            crs: {
              type: "name",
              properties: {
                name: "urn:ogc:def:crs:EPSG::4326"
              }
            }
          })
        });

        csvItem.url = csvFile;
        csvItem
          .load()
          .then(function() {
            csvItem.isEnabled = true; // Required to create an imagery layer.
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the argument[1] is the regionImageryProvider.
            // This unfortunately makes the test depend on an implementation detail.
            var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(
              0
            )[1];
            expect(regionImageryProvider).toBeDefined();
            return regionImageryProvider.pickFeatures(
              3698,
              2513,
              12,
              2.5323739090365693,
              -0.6604719122857645
            );
          })
          .then(function(r) {
            expect(r[0].name).toEqual("Boroondara (C)");
            var description = r[0].description; //.getValue(terria.clock.currentTime);
            expect(description).toContain("42.42");
            expect(description).toContain("the universe");
          })
          .otherwise(fail)
          .then(done);
      });
    });

    it("works with disambiguated LGA names like Wellington, VIC", function(done) {
      var csvFile = "test/csv/lga_state_disambig.csv";
      loadAndStubTextResources(done, [
        csvFile,
        terria.configParameters.regionMappingDefinitionsUrl,
        "data/regionids/region_map-FID_LGA_2011_AUST_LGA_NAME11.json",
        "data/regionids/region_map-FID_LGA_2011_AUST_STE_NAME11.json",
        "data/regionids/region_map-FID_STE_2011_AUST_STE_NAME11.json"
      ]).then(function(resources) {
        jasmine.Ajax.stubRequest(
          "http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_LGA_2011_AUST&bbox=16437018.562444303%2C-3913575.8482010253%2C16593561.59637234%2C-3757032.814272985&width=256&height=256&srs=EPSG%3A3857&query_layers=region_map%3AFID_LGA_2011_AUST&x=249&y=135&info_format=application%2Fjson"
        ).andReturn({
          responseText: JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                id: "FID_LGA_2011_AUST.143",
                geometry: {
                  type: "MultiPolygon",
                  coordinates: []
                },
                geometry_name: "the_geom",
                properties: {
                  FID: 142,
                  LGA_CODE11: "18150",
                  LGA_NAME11: "Wellington (A)",
                  STE_CODE11: "1",
                  STE_NAME11: "New South Wales",
                  AREA_SQKM: 4110.08848071889
                }
              }
            ],
            crs: {
              type: "name",
              properties: {
                name: "urn:ogc:def:crs:EPSG::4326"
              }
            }
          })
        });
        // Use a regular expression for this URL because IE9 has ~1e-10 differences in the bbox parameter.
        jasmine.Ajax.stubRequest(
          new RegExp(
            "http://regionmap-dev\\.nationalmap\\.nicta\\.com\\.au/region_map/ows\\?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd\\.ogc\\.se_xml&styles=&tiled=true&service=WMS&version=1\\.1\\.1&request=GetFeatureInfo&layers=region_map%3AFID_LGA_2011_AUST&bbox=16280475\\.5285162\\d\\d%2C-4618019\\.5008772\\d\\d%2C16358747\\.0454802\\d\\d%2C-4539747\\.9839131\\d\\d&width=256&height=256&srs=EPSG%3A3857&query_layers=region_map%3AFID_LGA_2011_AUST&x=126&y=58&info_format=application%2Fjson"
          )
        ).andReturn({
          responseText: JSON.stringify({
            type: "FeatureCollection",
            features: [
              {
                type: "Feature",
                id: "FID_LGA_2011_AUST.225",
                geometry: {
                  type: "MultiPolygon",
                  coordinates: []
                },
                geometry_name: "the_geom",
                properties: {
                  FID: 224,
                  LGA_CODE11: "26810",
                  LGA_NAME11: "Wellington (S)",
                  STE_CODE11: "2",
                  STE_NAME11: "Victoria",
                  AREA_SQKM: 10817.3680807268
                }
              }
            ],
            crs: {
              type: "name",
              properties: {
                name: "urn:ogc:def:crs:EPSG::4326"
              }
            }
          })
        });
        csvItem.url = csvFile;
        csvItem
          .load()
          .then(function() {
            csvItem.isEnabled = true; // Required to create an imagery provider.
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the second argument is the regionImageryProvider.
            // This unfortunately makes the test depend on an implementation detail.
            var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(
              0
            )[1];
            expect(regionImageryProvider).toBeDefined();
            return regionImageryProvider.pickFeatures(
              464,
              314,
              9,
              2.558613543017636,
              -0.6605448031188106
            );
          })
          .then(function(r) {
            expect(r[0].name).toEqual("Wellington (S)");
            var description = r[0].description; //.getValue(terria.clock.currentTime);
            expect(description).toContain("Wellington"); // leaving it open whether it should show server-side ID or provided value
            expect(description).toContain("Melbourne");
          })
          .then(function() {
            var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(
              0
            )[1];
            return regionImageryProvider.pickFeatures(
              233,
              152,
              8,
              2.600997237149669,
              -0.5686381345023742
            );
          })
          .then(function(r) {
            expect(r[0].name).toEqual("Wellington (A)");
            var description = r[0].description; //.getValue(terria.clock.currentTime);
            expect(description).toContain("Wellington");
            expect(description).toContain("Sydney");
          })
          .otherwise(fail)
          .then(done);
      });
    });

    it("time-varying features update with time", function(done) {
      var csvFile = "test/csv/postcode_val_enum_time.csv";

      loadAndStubTextResources(done, [
        csvFile,
        terria.configParameters.regionMappingDefinitionsUrl,
        "data/regionids/region_map-FID_POA_2011_AUST_POA_CODE.json"
      ]).then(function(resources) {
        jasmine.Ajax.stubRequest(
          "http://regionmap-dev.nationalmap.nicta.com.au/region_map/ows?transparent=true&format=image%2Fpng&exceptions=application%2Fvnd.ogc.se_xml&styles=&tiled=true&service=WMS&version=1.1.1&request=GetFeatureInfo&layers=region_map%3AFID_POA_2011_AUST&srs=EPSG%3A3857&bbox=16143500.373829227%2C-4559315.8631541915%2C16153284.31344973%2C-4549531.923533689&width=256&height=256&query_layers=region_map%3AFID_POA_2011_AUST&x=217&y=199&info_format=application%2Fjson"
        ).andReturn({
          responseText: JSON.stringify(postcode3124)
        });

        csvItem.url = csvFile;
        csvItem
          .load()
          .then(function() {
            csvItem.isEnabled = true; // Required to create an imagery layer.
            var regionDetails = csvItem.regionMapping.regionDetails;
            expect(regionDetails).toBeDefined();
            // We are spying on calls to ImageryLayerCatalogItem.enableLayer; the argument[1] is the regionImageryProvider.
            // This unfortunately makes the test depend on an implementation detail.
            var regionImageryProvider = ImageryLayerCatalogItem.enableLayer.calls.argsFor(
              0
            )[1];
            expect(regionImageryProvider).toBeDefined();
            return regionImageryProvider.pickFeatures(
              3698,
              2513,
              12,
              2.5323739090365693,
              -0.6604719122857645
            );
          })
          .then(function(r) {
            expect(r[0].name).toEqual("3124");
            var description = r[0].description.getValue(
              JulianDate.fromIso8601("2016-01-01T15:00:00Z")
            );
            expect(description).toContain("alpha");
            expect(description).not.toContain("beta");
            expect(description).not.toContain("gamma");
            expect(description).not.toContain("omega");
            description = r[0].description.getValue(
              JulianDate.fromIso8601("2016-01-02T15:00:00Z")
            );
            expect(description).toContain("gamma");
            expect(description).not.toContain("delta");
            expect(description).not.toContain("alpha");
            expect(description).not.toContain("omega");
            description = r[0].description.getValue(
              JulianDate.fromIso8601("2016-01-03T15:00:00Z")
            );
            expect(description).toContain("omega");
            expect(description).not.toContain("zeta");
            expect(description).not.toContain("alpha");
            expect(description).not.toContain("beta");
          })
          .otherwise(fail)
          .then(done);
      });
    });
  });
});

describe("CsvCatalogItem with no geo using default bundled regionMapping", function() {
  var terria;
  var csvItem;
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "data/regionMapping.json";

    csvItem = new CsvCatalogItem(terria);
  });

  it("is not mappable", function(done) {
    csvItem.url = "test/csv_nongeo/xy.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.isMappable).toEqual(false);
        expect(csvItem.regionMapping).toBeUndefined();
        expect(csvItem.tableStructure.name).toBe("");
        expect(csvItem.tableStructure.allowMultiple).toBe(true);
        expect(csvItem.tableStructure.items.length).toBe(2);
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not automatically enable a column if a table style is loaded in without a dataVariable", function(done) {
    csvItem.url = "test/csv_nongeo/xy.csv";
    csvItem
      .updateFromJson({
        tableStyle: {
          dataVariable: "y"
        }
      })
      .then(function() {
        return csvItem.load();
      })
      .then(function() {
        expect(csvItem.tableStructure.activeItems.length).toEqual(1);
        expect(csvItem.tableStructure.items.length).toEqual(2);
        expect(csvItem.tableStructure.activeItems[0].name).toEqual("y");
        expect(csvItem.tableStructure.name).toBe("");
        expect(csvItem.tableStructure.allowMultiple).toBe(true);
      })
      .then(function() {
        csvItem.updateFromJson({
          tableStyle: {
            allVariablesUnactive: true,
            dataVariable: undefined
          }
        });
      })
      .then(function() {
        expect(csvItem.isMappable).toEqual(false);
        expect(csvItem.tableStructure.items.length).toEqual(2);
        expect(csvItem.tableStructure.activeItems.length).toEqual(0);
      })
      .otherwise(fail)
      .then(done);
  });

  it("does not automatically enable a column if a table style is loaded in with columns all unactive", function(done) {
    csvItem.url = "test/csv_nongeo/xy.csv";
    csvItem
      .updateFromJson({
        tableStyle: {
          allVariablesUnactive: true,
          columns: {
            "0": {
              active: false
            },
            "1": {
              active: false
            },
            "2": {
              active: false
            }
          }
        }
      })
      .then(function() {
        return csvItem.load();
      })
      .then(function() {
        expect(csvItem.tableStructure.activeItems.length).toEqual(0);
        expect(csvItem.tableStructure.items.length).toEqual(2);
        expect(csvItem.tableStructure.name).toBe("");
      })
      .otherwise(fail)
      .then(done);
  });

  it("interprets height column as non-geo", function(done) {
    csvItem.url = "test/csv_nongeo/x_height.csv";
    csvItem
      .load()
      .then(function() {
        expect(csvItem.isMappable).toBe(false);
        expect(
          csvItem.tableStructure.columnsByType[VarType.ALT].length
        ).toEqual(0);
        expect(csvItem.tableStructure.items.length).toBe(3);
      })
      .otherwise(fail)
      .then(done);
  });
});

describe("CsvCatalogItem & chart sharing", function() {
  var terria;
  var csvItem;
  var columns;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    csvItem = new CsvCatalogItem(terria);
  });
  describe("disableIncompatibleTableColumn interaction", function() {
    describe("should not disable other charted columns if there are no active columns in use", function() {
      it("activates time series columns when loading the time series last", function(done) {
        const xyCsv = new CsvCatalogItem(terria);
        const timeSeriesCsv = new CsvCatalogItem(terria);
        xyCsv
          .updateFromJson({
            type: "csv",
            url: "test/csv_nongeo/xy.csv",
            isEnabled: true,
            isShown: true
          })
          .then(xyCsv.load.bind(xyCsv))
          .then(function() {
            timeSeriesCsv.updateFromJson({
              type: "csv",
              url: "test/csv_nongeo/time_series.csv",
              isEnabled: true,
              isShown: true
            });
          })
          .then(timeSeriesCsv.load.bind(timeSeriesCsv))
          .then(function() {
            expect(timeSeriesCsv.tableStructure.allowMultiple).toBe(true);
            expect(xyCsv.tableStructure.allowMultiple).toBe(true);
            expect(terria.catalog.chartableItems.length).toBe(2);
            expect(timeSeriesCsv.tableStructure.activeItems.length).toBe(1);
            expect(xyCsv.tableStructure.activeItems.length).toBe(0);
            expect(timeSeriesCsv.xAxis.type).not.toBe(xyCsv.xAxis.type);
            done();
          });
      });
      it("activates scalar columns when loading the time series first", function(done) {
        const xyCsv = new CsvCatalogItem(terria);
        const timeSeriesCsv = new CsvCatalogItem(terria);
        timeSeriesCsv
          .updateFromJson({
            type: "csv",
            url: "test/csv_nongeo/time_series.csv",
            isEnabled: true,
            isShown: true
          })
          .then(timeSeriesCsv.load.bind(timeSeriesCsv))
          .then(function() {
            xyCsv.updateFromJson({
              type: "csv",
              url: "test/csv_nongeo/xy.csv",
              isEnabled: true,
              isShown: true
            });
          })
          .then(xyCsv.load.bind(xyCsv))
          .then(function() {
            expect(timeSeriesCsv.tableStructure.allowMultiple).toBe(true);
            expect(xyCsv.tableStructure.allowMultiple).toBe(true);
            expect(terria.catalog.chartableItems.length).toBe(2);
            expect(timeSeriesCsv.tableStructure.activeItems.length).toBe(0);
            expect(xyCsv.tableStructure.activeItems.length).toBe(1);
            expect(timeSeriesCsv.xAxis.type).not.toBe(xyCsv.xAxis.type);
            // Do an update from json that triggers a 'toggleActiveCallback'
            xyCsv.updateFromJson({
              tableStyle: {
                dataVariable: "y"
              }
            });
            expect(timeSeriesCsv.tableStructure.activeItems.length).toBe(0);
            expect(xyCsv.tableStructure.activeItems.length).toBe(1);

            // if we enable columns on timeSeries, then go ahead and
            // tell the xyCsv to make sure it's disabled, the toggleActive callback
            // shouldn't go ahead and disable the other charted items
            timeSeriesCsv.updateFromJson({
              tableStyle: {
                columns: {
                  "0": {
                    active: false
                  },
                  "1": {
                    active: true
                  },
                  "2": {
                    active: true
                  }
                }
              }
            });
            xyCsv.updateFromJson({
              tableStyle: {
                allVariablesUnactive: true
              }
            });

            expect(timeSeriesCsv.tableStructure.activeItems.length).toBe(2);
            expect(xyCsv.tableStructure.activeItems.length).toBe(0);
            done();
          });
      });
    });
    // Catalog items get shown and hidden through traversing stories, ensure they're initialised correctly
    describe("should not read an out of date state of tableStructure.activeItems when show is toggled", function() {
      it("with time series csvs", function(done) {
        const timeSeriesCsv = new CsvCatalogItem(terria);
        timeSeriesCsv
          .updateFromJson({
            type: "csv",
            url: "test/csv_nongeo/time_series.csv",
            isEnabled: true,
            isShown: true
          })
          .then(timeSeriesCsv.load.bind(timeSeriesCsv))
          .then(function() {
            expect(
              timeSeriesCsv.tableStyle.allVariablesUnactive
            ).toBeUndefined();
            expect(timeSeriesCsv.tableStructure.items[1].isActive).toBe(true);
            timeSeriesCsv.tableStyle.allVariablesUnactive = true;
            expect(timeSeriesCsv.tableStructure.items[1].isActive).toBe(true);
            timeSeriesCsv._show();
            expect(timeSeriesCsv.tableStructure.items[1].isActive).toBe(false);

            done();
          });
      });
      it("with scalar csvs", function(done) {
        const xyCsv = new CsvCatalogItem(terria);
        xyCsv
          .updateFromJson({
            type: "csv",
            url: "test/csv_nongeo/xy.csv",
            isEnabled: true,
            isShown: true
          })
          .then(xyCsv.load.bind(xyCsv))
          .then(function() {
            expect(xyCsv.tableStyle.allVariablesUnactive).toBeUndefined();
            expect(xyCsv.tableStructure.items[1].isActive).toBe(true);
            xyCsv.tableStyle.allVariablesUnactive = true;
            expect(xyCsv.tableStructure.items[1].isActive).toBe(true);
            xyCsv._show();
            expect(xyCsv.tableStructure.items[1].isActive).toBe(false);

            done();
          });
      });
    });
  });
  describe("serialization around tableStyle & tableStructures for geo csvs", function() {
    it("does not generate columns when allowMultiple is false", function(done) {
      csvItem
        .updateFromJson({
          type: "csv",
          url: "test/csv/lat_lon_name_value.csv",
          isEnabled: true,
          isShown: true,
          isvForCharting: false
        })
        .then(csvItem.load.bind(csvItem))
        .then(function() {
          expect(csvItem.tableStructure.allowMultiple).toBe(false);
          expect(csvItem.isMappable).toBe(true);
          var json = csvItem.serializeToJson();
          expect(json.columns).toBeUndefined();
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("toggles the selected dataVariable in tablestructure from updateFromJson (e.g. story-transitions)", function(done) {
      csvItem
        .updateFromJson({
          type: "csv",
          url: "test/csv/lat_lon_name_value.csv",
          isEnabled: true,
          isShown: true,
          isCsvForCharting: false
        })
        .then(csvItem.load.bind(csvItem))
        .then(function() {
          expect(csvItem.isMappable).toEqual(true);
          expect(csvItem.concepts[0].activeItems.length).toEqual(1);
          expect(csvItem.concepts[0].activeItems[0].name).toEqual("value");
        })
        .then(function() {
          csvItem.updateFromJson({
            tableStyle: {
              dataVariable: "name"
            }
          });
        })
        .then(function() {
          expect(csvItem.isMappable).toEqual(true);
          expect(csvItem.concepts[0].activeItems.length).toEqual(1);
          expect(csvItem.concepts[0].activeItems[0].name).toEqual("name");
        })
        .then(done)
        .otherwise(done.fail);
    });
  });
  describe("serialization around tableStyle & tableStructures for non-geo time series csvs", function() {
    it("can be round-tripped with serializeToJson and updateFromJson", function() {
      columns = {
        "0": {
          active: false
        },
        "1": {
          active: false
        },
        "2": {
          active: false
        }
      };
      csvItem.updateFromJson({
        type: "csv",
        url: "test/csv_nongeo/time_series.csv",
        isEnabled: true,
        isShown: true,
        isCsvForCharting: true,
        tableStyle: {
          columns: columns
        }
      });

      var json = csvItem.serializeToJson();

      var reconstructed = new CsvCatalogItem(terria);
      reconstructed.updateFromJson(json);

      expect(reconstructed.type).toEqual(csvItem.type);
      expect(reconstructed.url).toEqual(csvItem.url);
      expect(reconstructed.isEnabled).toEqual(csvItem.isEnabled);
      expect(reconstructed.isShown).toEqual(csvItem.isShown);
      expect(reconstructed.isCsvForCharting).toEqual(csvItem.isCsvForCharting);

      expect(reconstructed.tableStyle.columns[0].active).toBe(
        columns[0].active
      );
      expect(reconstructed.tableStyle.columns[1].active).toBe(
        columns[1].active
      );
      expect(reconstructed.tableStyle.columns[2].active).toBe(
        columns[2].active
      );
    });
    it("serializes the dataurl for sharing if url does not exist", function() {
      columns = {
        "0": {
          active: false
        },
        "1": {
          active: false
        },
        "2": {
          active: false
        }
      };
      const dataUrl =
        "data:attachment/csv,Time%2CCapacity%2CPower%0A2015-10-19T00%3A10%3A00%2B1000%2C0.1%2C0.085%0A2015-10-19T01%3A15%3A00%2B1000%2C0.2%2C0.14%0A2015-10-19T02%3A20%3A00%2B1000%2C0.3%2C0.3%0A2015-10-19T03%3A25%3A00%2B1000%2C0%2C0%0A2015-10-19T04%3A30%3A00%2B1000%2C0.1%2C0%0A2015-10-19T05%3A35%3A00%2B1000%2C-0.4%2C0%0A2015-10-19T06%3A40%3A00%2B1000%2C0.4%2C0.3%0A2015-10-19T07%3A45%3A00%2B1000%2C0.1%2C0.1";
      csvItem.updateFromJson({
        type: "csv",
        dataUrl: dataUrl,
        isEnabled: true,
        isShown: true,
        isCsvForCharting: true,
        tableStyle: {
          columns: columns
        }
      });

      var json = csvItem.serializeToJson();
      expect(json.dataUrl).toEqual(dataUrl);

      var reconstructed = new CsvCatalogItem(terria);
      reconstructed.updateFromJson(json);

      expect(reconstructed.type).toEqual(csvItem.type);
      expect(reconstructed.url).toBeUndefined();
      expect(reconstructed.dataUrl).toEqual(dataUrl);
      expect(reconstructed.isEnabled).toEqual(csvItem.isEnabled);
      expect(reconstructed.isShown).toEqual(csvItem.isShown);
      expect(reconstructed.isCsvForCharting).toEqual(csvItem.isCsvForCharting);
      expect(reconstructed.tableStyle.columns[0].active).toBe(
        columns[0].active
      );
      expect(reconstructed.tableStyle.columns[1].active).toBe(
        columns[1].active
      );
      expect(reconstructed.tableStyle.columns[2].active).toBe(
        columns[2].active
      );
    });
    it("generates columns on a table style on serialization for chartable items, when a CsvCatalogItem is created without them", function(done) {
      columns = {
        "0": {
          active: false
        },
        "1": {
          active: false
        },
        "2": {
          active: true
        }
      };

      csvItem.updateFromJson({
        type: "csv",
        url: "test/csv_nongeo/time_series.csv",
        isEnabled: true,
        isShown: true,
        isCsvForCharting: false
      });

      expect(csvItem.tableStyle.columns).toBeUndefined();

      csvItem
        .load()
        .then(function() {
          // loaded in with 1 active item,
          expect(csvItem.isMappable).toBe(false);
          expect(csvItem.concepts[0].allowMultiple).toEqual(true);
          expect(csvItem.concepts[0].activeItems.length).toEqual(1);
          expect(csvItem.concepts[0].items.length).toEqual(3);
          expect(csvItem.concepts[0].items[0].isActive).toEqual(false);
          expect(csvItem.concepts[0].items[1].isActive).toEqual(true);
          expect(csvItem.concepts[0].items[2].isActive).toEqual(false);

          // deselect first and choose the second item
          csvItem.concepts[0].items[1].toggleActive();
          csvItem.concepts[0].items[2].toggleActive();
          expect(csvItem.concepts[0].items[1].isActive).toEqual(false);
          expect(csvItem.concepts[0].items[2].isActive).toEqual(true);

          var json = csvItem.serializeToJson();

          var reconstructed = new CsvCatalogItem(terria);
          reconstructed.updateFromJson(json);
          expect(reconstructed.tableStyle.columns[0].active).toBe(
            columns[0].active
          );
          expect(reconstructed.tableStyle.columns[1].active).toBe(
            columns[1].active
          );
          expect(reconstructed.tableStyle.columns[2].active).toBe(
            columns[2].active
          );
          expect(reconstructed.tableStyle.columns[1].chartLineColor).toBe(
            reconstructed.colors[0]
          );
          expect(reconstructed.tableStyle.columns[2].chartLineColor).toBe(
            reconstructed.colors[1]
          );

          // try with 2 active item selected
          csvItem.concepts[0].items[1].toggleActive();
          expect(csvItem.concepts[0].items[1].isActive).toEqual(true);
          expect(csvItem.concepts[0].items[2].isActive).toEqual(true);
          var json2 = csvItem.serializeToJson();
          var reconstructed2 = new CsvCatalogItem(terria);
          reconstructed2.updateFromJson(json2);
          expect(reconstructed2.tableStyle.columns[0].active).toBe(false);
          expect(reconstructed2.tableStyle.columns[1].active).toBe(true);
          expect(reconstructed2.tableStyle.columns[2].active).toBe(true);
          expect(reconstructed2.tableStyle.columns[1].chartLineColor).toBe(
            reconstructed2.colors[0]
          );
          expect(reconstructed2.tableStyle.columns[2].chartLineColor).toBe(
            reconstructed2.colors[1]
          );
        })
        .then(done)
        .otherwise(done.fail);
    });

    it("initialises and shares the correct 'no variables selected' state", function(done) {
      columns = {
        "0": {
          active: false
        },
        "1": {
          active: false
        },
        "2": {
          active: false
        }
      };
      // the flow for shared csv items is that the tableStyle is serialised
      csvItem
        .updateFromJson({
          type: "csv",
          url: "test/csv_nongeo/time_series.csv",
          isEnabled: true,
          isShown: true,
          isCsvForCharting: true,
          tableStyle: {
            columns: columns
          }
        })
        .then(function() {
          expect(csvItem.tableStyle.columns[0].active).toBe(columns[0].active);
          expect(csvItem.tableStyle.columns[1].active).toBe(columns[1].active);
          expect(csvItem.tableStyle.columns[2].active).toBe(columns[2].active);
        })
        .then(csvItem.load.bind(csvItem))
        .then(function() {
          const tableStructure = csvItem.concepts[0];
          expect(tableStructure.items[0].isActive).toBe(false);
          expect(tableStructure.items[1].isActive).toBe(true);
          expect(tableStructure.items[2].isActive).toBe(false);

          // we apply table style columns to structure when loading from a shared (chart) catalog item
          csvItem.applyTableStyleColumnsToStructure(
            { columns: columns },
            csvItem.tableStructure
          );

          // Check that the table structure now overrode and reflects the columnstyle provided
          expect(tableStructure.items[0].isActive).toBe(false);
          expect(tableStructure.items[1].isActive).toBe(false);
          expect(tableStructure.items[2].isActive).toBe(false);
          expect(tableStructure.activeItems.length).toBe(0);
        })
        .then(function() {
          const serialized = csvItem.serializeToJson();
          expect(serialized.tableStyle.allVariablesUnactive).toBe(true);
          expect(serialized.tableStyle.columns[0].active).toBe(false);
          expect(serialized.tableStyle.columns[1].active).toBe(false);
          expect(serialized.tableStyle.columns[2].active).toBe(false);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("initialises the correct 'second variable is selected' state & shares newly toggled state", function(done) {
      columns = {
        "0": {
          active: false
        },
        "1": {
          active: false
        },
        "2": {
          active: true
        }
      };
      // the flow for shared csv items is that the tableStyle is serialised
      csvItem
        .updateFromJson({
          type: "csv",
          url: "test/csv_nongeo/time_series.csv",
          isEnabled: true,
          isShown: true,
          isCsvForCharting: true,
          tableStyle: {
            columns: columns
          }
        })
        .then(function() {
          expect(csvItem.tableStyle.columns[0].active).toBe(columns[0].active);
          expect(csvItem.tableStyle.columns[1].active).toBe(columns[1].active);
          expect(csvItem.tableStyle.columns[2].active).toBe(columns[2].active);
        })
        .then(csvItem.load.bind(csvItem))
        .then(function() {
          // because we load in non-geospatial data, and there are activeItems
          // ensureActiveColumnForNonSpatial() shouldn't change active columns
          const tableStructure = csvItem.concepts[0];
          expect(tableStructure.items[0].isActive).toBe(false);
          expect(tableStructure.items[1].isActive).toBe(false);
          expect(tableStructure.items[2].isActive).toBe(true);

          // toggleActive on tableStructure items do not reflect back into table styles
          tableStructure.items[1].toggleActive();
          expect(tableStructure.items[1].isActive).toBe(true);

          // should have two active items on tableStructure now
          expect(tableStructure.items[0].isActive).toBe(false);
          expect(tableStructure.items[1].isActive).toBe(true);
          expect(tableStructure.items[2].isActive).toBe(true);

          // however active should still be false on !tableStyle! until we sync changes
          expect(csvItem.tableStyle.columns[0].active).toBe(false);
          expect(csvItem.tableStyle.columns[1].active).toBe(false);
          expect(csvItem.tableStyle.columns[2].active).toBe(true);

          // trigger a syncActiveColumns through serialization
          const serialized = csvItem.serializeToJson();
          expect(csvItem.tableStyle.columns[0].active).toBe(false);
          expect(csvItem.tableStyle.columns[1].active).toBe(true);
          expect(csvItem.tableStyle.columns[2].active).toBe(true);
          expect(serialized.tableStyle.allVariablesUnactive).toBe(undefined);
          expect(serialized.tableStyle.columns[0].active).toBe(false);
          expect(serialized.tableStyle.columns[1].active).toBe(true);
          expect(serialized.tableStyle.columns[2].active).toBe(true);
        })
        .then(done)
        .otherwise(done.fail);
    });
  });
  describe("load behaviour around SensorObservationServiceCatalogItem generated csvs", function() {
    var sosItem;
    var tableStructure;
    beforeEach(function() {
      terria = new Terria({
        baseUrl: "./"
      });
      csvItem = new CsvCatalogItem(terria);
      tableStructure = new TableStructure();
      sosItem = new SensorObservationServiceCatalogItem(terria);
      sosItem.id = "SosItem";
      terria.catalog.group.add(sosItem);
    });
    it("attempts a load when `data` property is not undefined", function(done) {
      csvItem
        .updateFromJson({
          type: "csv",
          url: "test/data/service/at/SOMEIDENTIFIER101", // this url shouldn't be utilised at all
          sourceCatalogItemId: "SosItem",
          regenerationOptions: {
            // also does nothing for the test but required for sos chart sharing
            procedure: {
              identifier:
                "http://test.domain/test/data/service/tstypes/YearlyMean",
              title: "Annual+average",
              defaultDuration: "40y"
            }
          },
          isEnabled: true,
          isShown: true,
          isCsvForCharting: true,
          tableStyle: {
            columns: {}
          }
        })
        .then(function() {
          csvItem.data = when.resolve(tableStructure);
        })
        .then(csvItem.load.bind(csvItem))
        .then(function() {
          expect(csvItem.tableStructure).toEqual(tableStructure);
        })
        .then(done)
        .otherwise(done.fail);
    });
    it("does not load when we haven't defined how to load it via the csv's `data` property", function(done) {
      csvItem
        .updateFromJson({
          type: "csv",
          url: "test/data/service/at/SOMEIDENTIFIER101", // this url shouldn't be utilised at all
          sourceCatalogItemId: "SosItem",
          isEnabled: true,
          isShown: true,
          isCsvForCharting: true,
          tableStyle: {
            columns: {}
          }
        })
        .then(csvItem.load.bind(csvItem))
        .then(function() {
          expect(csvItem.tableStructure).toBeUndefined();
        })
        .then(done)
        .otherwise(done.fail);
    });
  });
});
