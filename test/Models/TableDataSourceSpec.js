"use strict";

/*global require*/
var loadText = require("../../lib/Core/loadText");
var TableDataSource = require("../../lib/Models/TableDataSource");
var TableStyle = require("../../lib/Models/TableStyle");
var Terria = require("../../lib/Models/Terria");

describe("TableDataSource", function() {
  var tableDataSource;

  beforeEach(function() {
    var terria = new Terria({
      baseUrl: "./"
    });
    tableDataSource = new TableDataSource(terria);
  });

  it("can be constructed", function() {
    expect(tableDataSource).toBeDefined();
  });

  it("can load csv and detect lat and lon", function(done) {
    loadText("/test/csv/lat_lon_val.csv")
      .then(function(text) {
        tableDataSource.loadFromCsv(text);
        expect(tableDataSource.tableStructure.hasLatitudeAndLongitude).toEqual(
          true
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("does not set the clock when there is no date column", function(done) {
    loadText("/test/csv/lat_lon_val.csv")
      .then(function(text) {
        tableDataSource.loadFromCsv(text);
        expect(tableDataSource.clock).toBeUndefined();
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("sets the clock when there is an active date column", function(done) {
    loadText("/test/csv/lat_long_enum_moving_date.csv")
      .then(function(text) {
        tableDataSource.loadFromCsv(text);
        tableDataSource.tableStructure.setActiveTimeColumn();
        expect(tableDataSource.clock).toBeDefined();
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("scales points", function(done) {
    var tableStyle = new TableStyle({
      scaleByValue: true,
      scale: 5
    });
    tableDataSource.tableStyle = tableStyle;
    loadText("/test/csv/lat_lon_enum_val.csv")
      .then(function(text) {
        tableDataSource.loadFromCsv(text);
        tableDataSource.tableStructure.columns[3].toggleActive();
        var features = tableDataSource.entities.values;
        expect(tableDataSource.tableStructure.columns[0].values).not.toEqual(
          tableDataSource.tableStructure.columns[1].values
        );
        // expect the first two features to have different scales (line above ensures they have different values)
        expect(features[0].point.pixelSize.getValue()).not.toEqual(
          features[1].point.pixelSize.getValue()
        );
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("handles moving point csvs", function(done) {
    tableDataSource.tableStructure.idColumnNames = ["id"];
    loadText("/test/csv/lat_lon_enum_date_id.csv")
      .then(function(text) {
        tableDataSource.loadFromCsv(text); // at this point, there's no active time column, so we'll see 13 features, one per row.
        var features = tableDataSource.entities.values;
        expect(features.length).toEqual(13);
        tableDataSource.tableStructure.setActiveTimeColumn();
        tableDataSource.tableStructure.columns[5].isActive = true; // Just to trigger the feature update process
        expect(tableDataSource.clock).toBeDefined();
        features = tableDataSource.entities.values;
        expect(features.length).toEqual(4);
      })
      .then(done)
      .otherwise(done.fail);
  });
});
