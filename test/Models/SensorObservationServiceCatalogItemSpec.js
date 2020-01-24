"use strict";

/*global require, fail*/
var JulianDate = require("terriajs-cesium/Source/Core/JulianDate").default;
var loadText = require("../../lib/Core/loadText");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var SensorObservationServiceCatalogItem = require("../../lib/Models/SensorObservationServiceCatalogItem");
var Terria = require("../../lib/Models/Terria");
var VarType = require("../../lib/Map/VarType");

var j = JulianDate.fromIso8601;

describe("SensorObservationServiceCatalogItem", function() {
  var terria;
  var item;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    item = new SensorObservationServiceCatalogItem(terria);
  });

  it("can update from json", function() {
    item.updateFromJson({
      name: "Name",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      url: "http://foo.bar"
    });
    expect(item.name).toBe("Name");
    expect(item.description).toBe("Description");
    expect(item.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
    expect(item.type).toBe("sos");
    expect(item.url.indexOf("http://foo.bar")).toBe(0);
  });

  it("can be round-tripped with serializeToJson and updateFromJson", function() {
    item.updateFromJson({
      name: "Name",
      id: "Id",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      url: "http://foo.bar/",
      initialProcedureIndex: 2
    });
    var json = item.serializeToJson();
    // This json should include initialProcedureIndex.
    expect(json.initialProcedureIndex).toBeDefined();
    var reconstructed = new SensorObservationServiceCatalogItem(terria);
    reconstructed.updateFromJson(json);
    // item.concepts has a circular dependency via its __knockoutSubscribable property,
    // with itself being a subscriber, so it will not equal reconstructed.concepts.
    // So check the arrays are equal, and then remove them before comparing the rest of the item.
    expect(item.concepts.slice(), reconstructed.concepts.slice());
    delete item.concepts;
    delete item._concepts;
    delete reconstructed.concepts;
    delete reconstructed._concepts;
    // for (var i = Object.keys(item).length - 1; i >= 0; i--) {
    //     var k = Object.keys(item)[i];
    //     console.log(k);
    //     expect(reconstructed[k]).toEqual(item[k]);
    // }

    expect(reconstructed.name).toEqual(item.name);
    expect(reconstructed.id).toEqual(item.id);
    expect(reconstructed.description).toEqual(item.description);
    expect(reconstructed.rectangle).toEqual(item.rectangle);
    expect(reconstructed.url).toEqual(item.url);
    expect(reconstructed.initialProcedureIndex).toEqual(
      item.initialProcedureIndex
    );
  });

  describe("loading", function() {
    var getFeatureOfInterestResponse,
      getObservationResponseYearly,
      getObservationResponseDaily;
    beforeEach(function(done) {
      when
        .all([
          loadText("test/sos/GetFeatureOfInterestResponse.xml").then(function(
            text
          ) {
            getFeatureOfInterestResponse = text;
          }),
          loadText("test/sos/GetObservationResponse_Yearly.xml").then(function(
            text
          ) {
            getObservationResponseYearly = text;
          }),
          loadText("test/sos/GetObservationResponse_Daily.xml").then(function(
            text
          ) {
            getObservationResponseDaily = text;
          })
        ])
        .then(function() {
          jasmine.Ajax.install();
          jasmine.Ajax.stubRequest(/.*/).andError(); // Fail all requests by default.
          jasmine.Ajax.stubRequest(
            "http://sos.example.com",
            /\<sos:GetFeatureOfInterest/
          ).andReturn({ responseText: getFeatureOfInterestResponse });
          jasmine.Ajax.stubRequest(
            "http://sos.example.com",
            /\<sos:GetObservation[\s\S]*Yearly/
          ).andReturn({ responseText: getObservationResponseYearly });
          jasmine.Ajax.stubRequest(
            "http://sos.example.com",
            /\<sos:GetObservation[\s\S]*Daily/
          ).andReturn({ responseText: getObservationResponseDaily });
        })
        .then(done)
        .otherwise(done.fail);
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("works with tryToLoadObservationData false", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sos.example.com",
        procedures: [
          {
            identifier: "http://sos.example.com/tstypes/Yearly Mean",
            title: "Annual average"
          }
        ],
        observableProperties: [
          {
            identifier: "http://sos.example.com/parameters/Storage Level",
            title: "Storage Level",
            units: "m"
          }
        ],
        tryToLoadObservationData: false
      });
      item
        .load()
        .then(function() {
          // This is not region mapped.
          expect(item.regionMapping).not.toBeDefined();
          // Expect it to have created the right table of data (with no time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames).toEqual([
            "type",
            "name",
            "id",
            "lat",
            "lon",
            "identifier",
            "Annual average"
          ]);
          // Test a "slice" of the column's values, to remove knockout stuff.
          expect(
            item.tableStructure.columns[6].values[0].indexOf("<chart")
          ).toBeGreaterThan(-1);
          // Expect it not to show any concepts to the user.
          expect(item.concepts.length).toEqual(0);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with tryToLoadObservationData true", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sos.example.com",
        procedures: [
          {
            identifier: "http://sos.example.com/tstypes/Yearly Mean",
            title: "Annual average"
          }
        ],
        observableProperties: [
          {
            identifier: "http://sos.example.com/parameters/Storage Level",
            title: "Storage Level",
            units: "m"
          }
        ],
        tryToLoadObservationData: true,
        proceduresName: "Frequency",
        observablePropertiesName: "Observation"
      });
      item
        .load()
        .then(function() {
          var columnNames = item.tableStructure.getColumnNames();
          // This check of the column names is a bit too prescriptive.
          expect(columnNames).toEqual([
            "date",
            "Storage Level Annual average (m)",
            "identifier",
            "Frequency",
            "Observation",
            "type",
            "name",
            "id",
            "lat",
            "lon"
          ]);
          var values = item.tableStructure.columns.filter(function(column) {
            return column.id === "value";
          })[0].values;
          function valuesForFeatureIdentifier(identifier) {
            return item.tableStructure
              .getColumnWithNameIdOrIndex("identifier")
              .values.map(function(thisIdentifier, rowNumber) {
                if (identifier === thisIdentifier) {
                  return values[rowNumber];
                }
              })
              .filter(function(x) {
                return x !== undefined;
              });
          }
          expect(
            valuesForFeatureIdentifier("http://sos.example.com/stations/1")
          ).toEqual([null, 129.425, 123.123]);
          expect(
            valuesForFeatureIdentifier("http://sos.example.com/stations/2")
          ).toEqual([14.575, 12.991, null]);
          expect(
            valuesForFeatureIdentifier("http://sos.example.com/stations/3")
          ).toEqual([43.066, 42.981, 40.136, 40.088, null]);
          // Expect a time dimension
          expect(
            item.tableStructure.columnsByType[VarType.TIME].length
          ).toEqual(1);
          // Expect the terria clock to reflect the yearly data time range. This happens only when the item is shown.
          item.isShown = true;
          expect(JulianDate.toIso8601(item.terria.clock.startTime)).toContain(
            "2012-01"
          );
          // Expect it not to show any concepts to the user.
          expect(item.concepts.length).toEqual(0);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with showFeaturesAtAllTimes false", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sos.example.com",
        procedures: [
          {
            identifier: "http://sos.example.com/tstypes/Yearly Mean",
            title: "Annual average"
          }
        ],
        observableProperties: [
          {
            identifier: "http://sos.example.com/parameters/Storage Level",
            title: "Storage Level",
            units: "m"
          }
        ],
        showFeaturesAtAllTimes: false,
        proceduresName: "Frequency",
        observablePropertiesName: "Observation"
      });
      item
        .load()
        .then(function() {
          expect(
            item.tableStructure.columnsByType[VarType.TIME].length
          ).toEqual(1);
          var dates =
            item.tableStructure.columnsByType[VarType.TIME][0].julianDates;
          function datesForFeatureIdentifier(identifier) {
            return item.tableStructure
              .getColumnWithNameIdOrIndex("identifier")
              .values.map(function(thisIdentifier, rowNumber) {
                if (identifier === thisIdentifier) {
                  return dates[rowNumber];
                }
              })
              .filter(function(x) {
                return x !== undefined;
              });
          }
          var d2012 = j("2012-01-03T02:00+10:00");
          var d2013 = j("2013-01-03T02:00+10:00");
          var d2014 = j("2014-01-03T02:00+10:00");
          var d2015 = j("2015-01-03T02:00+10:00");
          var d2016 = j("2016-01-03T02:00+10:00");
          var d2017 = j("2017-01-03T02:00+10:00");
          expect(
            datesForFeatureIdentifier("http://sos.example.com/stations/1")
          ).toEqual([d2015, d2016, d2017]);
          expect(
            datesForFeatureIdentifier("http://sos.example.com/stations/2")
          ).toEqual([d2014, d2015, d2016]);
          expect(
            datesForFeatureIdentifier("http://sos.example.com/stations/3")
          ).toEqual([d2012, d2013, d2014, d2015, d2016]);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with showFeaturesAtAllTimes true", function(done) {
      // showFeaturesAtAllTimes adds in artificial rows for each feature at the start and end of the total date range,
      // if not already present.
      item.updateFromJson({
        name: "Foo",
        url: "http://sos.example.com",
        procedures: [
          {
            identifier: "http://sos.example.com/tstypes/Yearly Mean",
            title: "Annual average"
          }
        ],
        observableProperties: [
          {
            identifier: "http://sos.example.com/parameters/Storage Level",
            title: "Storage Level",
            units: "m"
          }
        ],
        showFeaturesAtAllTimes: true,
        proceduresName: "Frequency",
        observablePropertiesName: "Observation"
      });
      item
        .load()
        .then(function() {
          expect(
            item.tableStructure.columnsByType[VarType.TIME].length
          ).toEqual(1);
          var dates =
            item.tableStructure.columnsByType[VarType.TIME][0].julianDates;
          function datesForFeatureIdentifier(identifier) {
            return item.tableStructure
              .getColumnWithNameIdOrIndex("identifier")
              .values.map(function(thisIdentifier, rowNumber) {
                if (identifier === thisIdentifier) {
                  return dates[rowNumber];
                }
              })
              .filter(function(x) {
                return x !== undefined;
              });
          }
          var d2012 = j("2012-01-03T02:00+10:00");
          var d2013 = j("2013-01-03T02:00+10:00");
          var d2014 = j("2014-01-03T02:00+10:00");
          var d2015 = j("2015-01-03T02:00+10:00");
          var d2016 = j("2016-01-03T02:00+10:00");
          var d2017 = j("2017-01-03T02:00+10:00");
          expect(
            datesForFeatureIdentifier("http://sos.example.com/stations/1")
          ).toEqual([d2012, d2015, d2016, d2017]);
          expect(
            datesForFeatureIdentifier("http://sos.example.com/stations/2")
          ).toEqual([d2012, d2014, d2015, d2016, d2017]);
          expect(
            datesForFeatureIdentifier("http://sos.example.com/stations/3")
          ).toEqual([d2012, d2013, d2014, d2015, d2016, d2017]);
        })
        .otherwise(fail)
        .then(done);
    });

    it("reloads observation data when concept changes", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sos.example.com",
        procedures: [
          {
            identifier: "http://sos.example.com/tstypes/Yearly Mean",
            title: "Annual average"
          },
          {
            identifier: "http://sos.example.com/tstypes/Daily Mean",
            title: "Daily average"
          }
        ],
        observableProperties: [
          {
            identifier: "http://sos.example.com/parameters/Storage Level",
            title: "Storage Level"
          }
        ],
        tryToLoadObservationData: true,
        proceduresName: "Frequency",
        observablePropertiesName: "Observation"
      });
      item
        .load()
        .then(function() {
          // Expect it to show the procedures concepts to the user.
          expect(item.concepts.length).toEqual(1);
          // Show the item so the terria clock is shown.
          item.isShown = true;
          expect(JulianDate.toIso8601(item.terria.clock.startTime)).toContain(
            "2012-01"
          );
          // Change the value to Daily average, which loads the data and puts the promise in item._observationDataPromise.
          item.concepts[0].items[1].toggleActive();
          return item._observationDataPromise;
        })
        .then(function() {
          // The new data is now loaded.
          var columnNames = item.tableStructure.getColumnNames();
          // The column should now be the daily average.
          expect(columnNames[1]).toEqual("Storage Level Daily average");
          // And expect the terria clock to now reflect the new daily data time range.
          expect(JulianDate.toIso8601(item.terria.clock.startTime)).toContain(
            "2016-08"
          );
        })
        .otherwise(fail)
        .then(done);
    });

    it("is less than 2500 characters when serialised to JSON then URLEncoded", function(done) {
      item.updateFromJson({
        name: "Name",
        url: "http://sos.example.com",
        procedures: [
          {
            identifier: "http://sos.example.com/tstypes/Yearly Mean",
            title: "Annual average"
          }
        ],
        observableProperties: [
          {
            identifier: "http://sos.example.com/parameters/Storage Level",
            title: "Storage Level"
          }
        ],
        initialProcedureIndex: 0,
        tryToLoadObservationData: false
      });
      item
        .load()
        .then(function() {
          var url = encodeURIComponent(JSON.stringify(item.serializeToJson()));
          // This used to be < 2000, but when we added useOwnClock and canUseOwnClock it hit 2007 characters.
          expect(url.length).toBeLessThan(2500);
        })
        .otherwise(fail)
        .then(done);
    });
  });
});
