"use strict";

/*global require, fail*/
var loadText = require("../../lib/Core/loadText");
var Rectangle = require("terriajs-cesium/Source/Core/Rectangle").default;
var when = require("terriajs-cesium/Source/ThirdParty/when").default;

var Terria = require("../../lib/Models/Terria");
var SdmxJsonCatalogItem = require("../../lib/Models/SdmxJsonCatalogItem");

describe("SdmxJsonCatalogItem", function() {
  var terria;
  var item;

  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
    terria.configParameters.regionMappingDefinitionsUrl =
      "test/SDMX-JSON/regionMappingSdmx.json";
    item = new SdmxJsonCatalogItem(terria);
  });

  it("can update from json", function() {
    item.updateFromJson({
      name: "Name",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      url: "http://foo.bar",
      dataUrlComponent: "atad"
    });
    expect(item.name).toBe("Name");
    expect(item.description).toBe("Description");
    expect(item.rectangle).toEqual(Rectangle.fromDegrees(-10, 10, -20, 20));
    expect(item.type).toBe("sdmx-json");
    expect(item.url.indexOf("http://foo.bar")).toBe(0);
    expect(item.dataUrlComponent).toBe("atad");
  });

  it("can be round-tripped with serializeToJson and updateFromJson", function() {
    item.updateFromJson({
      name: "Name",
      id: "Id",
      description: "Description",
      rectangle: [-10, 10, -20, 20],
      url: "http://foo.bar/",
      dataUrlComponent: "atad"
    });
    var json = item.serializeToJson();
    // This json should include selectedInitially.
    expect(json.selectedInitially).toBeDefined();
    var reconstructed = new SdmxJsonCatalogItem(terria);
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
    expect(reconstructed.dataUrlComponent).toEqual(item.dataUrlComponent);
  });

  describe("loading", function() {
    var regionMappingJson, lga13Data, steData;
    var dataflowFoo,
      dataFoo,
      dataFooBD2,
      dataFooBD2t,
      dataFoo2,
      dataNonSpatial,
      dataAsObs,
      dataAsObsRepeated,
      dataNoSteYear;
    beforeEach(function(done) {
      when
        .all([
          loadText("test/SDMX-JSON/dataflow-foo.json").then(function(text) {
            dataflowFoo = text;
          }),
          loadText("test/SDMX-JSON/data-foo-2013.json").then(function(text) {
            dataFoo = text;
          }),
          loadText("test/SDMX-JSON/data-foo-BD2-2013.json").then(function(
            text
          ) {
            dataFooBD2 = text;
          }),
          loadText("test/SDMX-JSON/data-foo-BD2-2011_2013.json").then(function(
            text
          ) {
            dataFooBD2t = text;
          }),
          loadText("test/SDMX-JSON/data-foo2-2013.json").then(function(text) {
            dataFoo2 = text;
          }),
          loadText("test/SDMX-JSON/data-nonspatial.json").then(function(text) {
            dataNonSpatial = text;
          }),
          loadText("test/SDMX-JSON/data-as-observations.json").then(function(
            text
          ) {
            dataAsObs = text;
          }),
          loadText("test/SDMX-JSON/data-ste-no-year.json").then(function(text) {
            dataNoSteYear = text;
          }),
          loadText("test/SDMX-JSON/data-as-obs-repeated-dim.json").then(
            function(text) {
              dataAsObsRepeated = text;
            }
          ),
          loadText("test/SDMX-JSON/regionMappingSdmx.json").then(function(
            text
          ) {
            regionMappingJson = text;
          }),
          loadText(
            "data/regionids/region_map-FID_LGA_2013_AUST_LGA_CODE13.json"
          ).then(function(text) {
            lga13Data = text;
          }),
          loadText(
            "data/regionids/region_map-FID_STE_2011_AUST_STE_CODE11.json"
          ).then(function(text) {
            steData = text;
          })
        ])
        .then(function() {
          jasmine.Ajax.install();
          jasmine.Ajax.stubRequest(/.*/).andError(); // Fail all requests by default.
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/dataflow/FOO"
          ).andReturn({ responseText: dataflowFoo });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO/BD_2+BD_4.LGA_2013..A/all?startTime=2013&endTime=2013"
          ).andReturn({ responseText: dataFoo });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO/BD_2.LGA_2013..A/all?startTime=2013&endTime=2013"
          ).andReturn({ responseText: dataFooBD2 });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO/BD_2.LGA_2013..A/all?startTime=2011&endTime=2013"
          ).andReturn({ responseText: dataFooBD2t });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO2/BD_2+BD_4..A../all?startTime=2013&endTime=2013"
          ).andReturn({ responseText: dataFoo2 });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/NONSPATIAL/all/all"
          ).andReturn({ responseText: dataNonSpatial });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO-OBS/./all"
          ).andReturn({ responseText: dataAsObs });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO-STE-NO-YEAR/./all"
          ).andReturn({ responseText: dataNoSteYear });
          jasmine.Ajax.stubRequest(
            "http://sdmx.example.com/sdmx-json/data/FOO-OBS-RPT/./all"
          ).andReturn({ responseText: dataAsObsRepeated });
          jasmine.Ajax.stubRequest(
            "test/SDMX-JSON/regionMappingSdmx.json"
          ).andReturn({ responseText: regionMappingJson });
          jasmine.Ajax.stubRequest(
            "data/regionids/region_map-FID_LGA_2013_AUST_LGA_CODE13.json"
          ).andReturn({ responseText: lga13Data });
          jasmine.Ajax.stubRequest(
            "data/regionids/region_map-FID_STE_2011_AUST_STE_CODE11.json"
          ).andReturn({ responseText: steData });
        })
        .then(done)
        .otherwise(done.fail);
    });

    afterEach(function() {
      jasmine.Ajax.uninstall();
    });

    it("works with a simple file", function(done) {
      item.updateFromJson({
        name: "Foo",
        url:
          "http://sdmx.example.com/sdmx-json/data/FOO/BD_2.LGA_2013..A/all?startTime=2013&endTime=2013"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with no time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(3);
          expect(columnNames[1]).toEqual("LGA_code_2013");
          // Test a "slice" of the column's values, to remove knockout stuff.
          expect(item.tableStructure.columns[0].values.slice()).toEqual([
            "2013",
            "2013",
            "2013",
            "2013",
            "2013"
          ]);
          expect(item.tableStructure.columns[1].values.slice()).toEqual([
            "17100",
            "56520",
            "54970",
            "10300",
            "29399"
          ]);
          expect(item.tableStructure.columns[2].values.slice()).toEqual([
            1140,
            535,
            79,
            12,
            38
          ]);
          // Expect it not to show any concepts to the user.
          expect(item.concepts.length).toEqual(0);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with a two-concept file", function(done) {
      item.updateFromJson({
        name: "Foo2",
        url:
          "http://sdmx.example.com/sdmx-json/data/FOO2/BD_2+BD_4..A../all?startTime=2013&endTime=2013"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(7);
          expect(columnNames[1]).toEqual("LGA_code_2013");
          expect(item.tableStructure.columns[0].values.slice()).toEqual([
            "2013",
            "2013",
            "2013",
            "2013",
            "2013"
          ]);
          expect(item.tableStructure.columns[1].values.slice()).toEqual([
            "17100",
            "56520",
            "54970",
            "10300",
            "29399"
          ]);
          expect(item.tableStructure.columns[2].values.slice()).toEqual([
            1140,
            535,
            79,
            12,
            38
          ]);
          expect(item.tableStructure.columns[3].values.slice()).toEqual([
            2140,
            2535,
            2179,
            2112,
            2138
          ]);
          expect(item.tableStructure.columns[4].values.slice()).toEqual([
            140,
            35,
            179,
            112,
            138
          ]);
          expect(item.tableStructure.columns[5].values.slice()).toEqual([
            1140,
            1035,
            579,
            1512,
            2138
          ]);
          expect(item.tableStructure.columns[6].values.slice()).toEqual([
            1140,
            535,
            79,
            12,
            38
          ]);
          // Expect it to show 2 concepts to the user, each with 2 sub items.
          var conceptItems = item.concepts[0].items;
          expect(conceptItems.length).toEqual(2);
          expect(conceptItems[0].items.length).toEqual(2);
          expect(conceptItems[1].items.length).toEqual(2);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with a generic endpoint", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sdmx.example.com/sdmx-json/data/FOO",
        startTime: "2013",
        endTime: "2013"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(4); // It shows a single concept and so always shows a total column.
          expect(columnNames[1]).toEqual("LGA_code_2013");
          expect(item.tableStructure.columns[0].values.slice()).toEqual([
            "2013",
            "2013",
            "2013",
            "2013",
            "2013"
          ]);
          expect(item.tableStructure.columns[1].values.slice()).toEqual([
            "17100",
            "56520",
            "54970",
            "10300",
            "29399"
          ]);
          expect(item.tableStructure.columns[2].values.slice()).toEqual([
            1140,
            535,
            79,
            12,
            38
          ]);
          expect(item.tableStructure.columns[3].values.slice()).toEqual(
            item.tableStructure.columns[2].values.slice()
          );
          // Expect it to show the birth/death concept to the user.
          var conceptItems = item.concepts[0].items;
          expect(conceptItems.length).toEqual(1);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with selectedInitially on a generic endpoint", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sdmx.example.com/sdmx-json/data/FOO",
        startTime: "2013",
        endTime: "2013",
        selectedInitially: {
          MEASURE: ["BD_2", "BD_4"]
        }
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(5); // Region, BD_2, BD_4 and a total.
          expect(columnNames[1]).toEqual("LGA_code_2013");
          expect(item.tableStructure.columns[0].values.slice()).toEqual([
            "2013",
            "2013",
            "2013",
            "2013",
            "2013"
          ]);
          expect(item.tableStructure.columns[1].values.slice()).toEqual([
            "17100",
            "56520",
            "54970",
            "10300",
            "29399"
          ]);
          expect(item.tableStructure.columns[2].values.slice()).toEqual([
            1140,
            535,
            79,
            12,
            38
          ]);
          expect(item.tableStructure.columns[3].values.slice()).toEqual([
            140,
            235,
            279,
            812,
            338
          ]);
          expect(item.tableStructure.columns[4].values.slice()).toEqual([
            1280,
            770,
            358,
            824,
            376
          ]);
          // Expect it to show the birth/death concept to the user.
          var conceptItems = item.concepts[0].items;
          expect(conceptItems.length).toEqual(1);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with invalid selectedInitially", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sdmx.example.com/sdmx-json/data/FOO",
        startTime: "2013",
        endTime: "2013",
        selectedInitially: {
          MEASURE: ["NO_THERE", "NOT_HERE_EITHER"]
        }
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(4); // Region, only one BD and a total.
          // Expect the bad selectedInitially setting to be wiped out.
          expect(item.selectedInitially.MEASURE).not.toBeDefined();
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with cannotSum", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sdmx.example.com/sdmx-json/data/FOO",
        startTime: "2013",
        endTime: "2013",
        selectedInitially: {
          MEASURE: ["BD_2", "BD_4"]
        },
        cannotSum: {
          MEASURE: ["BD_2"]
        }
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension) - crucially, without a total.
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.slice()).toEqual([
            "date",
            "LGA_code_2013",
            "Births",
            "Deaths"
          ]); // No total.
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with a time-varying file", function(done) {
      item.updateFromJson({
        name: "Foo",
        url:
          "http://sdmx.example.com/sdmx-json/data/FOO/BD_2.LGA_2013..A/all?startTime=2011&endTime=2013"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(3);
          expect(columnNames[0]).toEqual("date");
          expect(columnNames[1]).toEqual("LGA_code_2013");
          expect(item.tableStructure.columns[0].values.length).toEqual(5 * 3); // 5 regions x 3 dates.
          // Expect it not to show any concepts to the user.
          expect(item.concepts.length).toEqual(0);
        })
        .otherwise(fail)
        .then(done);
    });

    it("recognizes non-spatial data", function(done) {
      item.updateFromJson({
        name: "NonSpatial",
        url: "http://sdmx.example.com/sdmx-json/data/NONSPATIAL/all/all"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this has NO regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).not.toBeDefined();
          // Beyond this, assume nothing. But if you want it to work, you may want the following:
          // expect(item.isMappable).toBe(false);
          // // Expect it to have created the right table of data (with no time dimension).
          // var columnNames = item.tableStructure.getColumnNames();
          // expect(columnNames.length).toEqual(2 + 5 * 2 * 2); // one for each value, plus date and total columns.
          // expect(item.tableStructure.columns[0].values.length).toEqual(3); // 3 dates.
          // // Expect it to show 3 concepts to the user.
          // var conceptItems = item.concepts[0].items;
          // expect(conceptItems.length).toEqual(3);
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with a data provided as observations not series", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sdmx.example.com/sdmx-json/data/FOO-OBS/./all"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(3);
          expect(columnNames[0]).toEqual("date");
          expect(columnNames[1]).toEqual("STE_code_2011");
          expect(item.tableStructure.columns[0].values.slice()).toEqual([
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001"
          ]);
          expect(item.tableStructure.columns[1].values.slice()).toEqual([
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9"
          ]);
          expect(item.tableStructure.columns[2].values.slice()).toEqual([
            17658,
            14042,
            9739,
            6572,
            2970,
            4940,
            945,
            7222,
            13001
          ]);
          // Expect it not to show any concepts to the user.
          expect(item.concepts.length).toEqual(0);
        })
        .otherwise(fail)
        .then(done);
    });

    it("can apply a template to the region column name", function(done) {
      // This is the same data as the previous spec, but now we add `regionNameTemplate: "{{name}}_code_2016"`
      item.updateFromJson({
        name: "Foo",
        regionNameTemplate: "{{name}}_code_2011",
        url: "http://sdmx.example.com/sdmx-json/data/FOO-STE-NO-YEAR/./all"
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have appended to regionYear to the region column, per csv-geo-au.
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames[1]).toEqual("STE_code_2011");
        })
        .otherwise(fail)
        .then(done);
    });

    it("works with an aggregated dimension", function(done) {
      item.updateFromJson({
        name: "Foo",
        url: "http://sdmx.example.com/sdmx-json/data/FOO-OBS-RPT/./all",
        aggregatedDimensionIds: ["STATE"]
      });
      item
        .load()
        .then(function() {
          // Expect it to have realised this is regional data.
          var regionDetails = item.regionMapping.regionDetails;
          expect(regionDetails).toBeDefined();
          // Expect it to have created the right table of data (with a time dimension).
          var columnNames = item.tableStructure.getColumnNames();
          expect(columnNames.length).toEqual(3);
          expect(columnNames[0]).toEqual("date");
          expect(columnNames[1]).toEqual("STE_code_2011");
          expect(item.tableStructure.columns[0].values.slice()).toEqual([
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001",
            "2001"
          ]);
          expect(item.tableStructure.columns[1].values.slice()).toEqual([
            "1",
            "2",
            "3",
            "4",
            "5",
            "6",
            "7",
            "8",
            "9"
          ]);
          // Expect it to have aggregated up the data across the STATE dimension.
          expect(item.tableStructure.columns[2].values.slice()).toEqual([
            17658,
            14042,
            9739,
            6572,
            2970,
            4940,
            null,
            1945,
            13001
          ]);
          // Expect it not to show any concepts to the user.
          expect(item.concepts.length).toEqual(0);
        })
        .otherwise(fail)
        .then(done);
    });

    // I'm not sure we want this test.
    it("gracefully handles a non-SDMX URL", function(done) {
      item.updateFromJson({
        name: "Name",
        url: "http://example.com"
      });
      item
        .load()
        .then(function() {
          return item.dataSource.regionPromise;
        })
        .otherwise(function(e) {
          // We actually want this to fail; if it doesn't get here, will say SPEC HAS NO EXPECTATIONS.
          expect(true).toBe(true);
        })
        .then(done);
    });

    it("is less than 2300 characters when serialised to JSON then URLEncoded", function(done) {
      item.updateFromJson({
        name: "Name",
        description: "Description",
        url: "http://abs.example.com/",
        dataUrlComponent: "foo"
      });
      item
        .load()
        .then(function() {
          var url = encodeURIComponent(JSON.stringify(item.serializeToJson()));
          expect(url.length).toBeLessThan(2300);
        })
        .otherwise(fail)
        .then(done);
    });
  });
});
