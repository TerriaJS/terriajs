"use strict";

/*global require*/

var Terria = require("../../lib/Models/Terria");
var WfsFeaturesCatalogGroup = require("../../lib/Models/WfsFeaturesCatalogGroup");

var cedJson = {
  name: "Commonwealth Electoral Divisions (group from features)",
  type: "wfs-features-group",
  url: "http://regionmap-dev.nationalmap.nicta.com.au/admin_bnds_abs/ows",
  typeNames: "admin_bnds:COM20111216_ELB_region",
  nameProperty: "ELECT_DIV",
  groupByProperty: "STATE",
  itemProperties: {
    description: "CED test",
    info: [
      {
        name: "Licence",
        content:
          "[Australian Electoral Commission Data download licence](http://www.aec.gov.au/Electorates/gis/GIS_Data_Download_Data_Licence.htm)"
      }
    ],
    dataCustodian: "[Australian Electoral Commission](http://www.aec.gov.au/)",
    style: {
      fill: "purple",
      stroke: "orange"
    }
  }
};

describe("WfsFeaturesCatalogGroup", function() {
  var terria;
  var wfsGroup;

  beforeEach(function(done) {
    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(/.*/).andCallFunction(function(stub, xhr) {
      done.fail(xhr.url);
    });

    jasmine.Ajax.stubRequest(
      "http://regionmap-dev.nationalmap.nicta.com.au/admin_bnds_abs/ows?service=WFS&version=1.1.0&request=GetFeature&typeName=admin_bnds%3ACOM20111216_ELB_region&outputFormat=JSON&propertyName=ELECT_DIV%2CSTATE"
    ).andReturn({
      responseText: JSON.stringify({
        type: "FeatureCollection",
        totalFeatures: 150,
        features: [
          {
            type: "Feature",
            id: "COM20111216_ELB_region.1",
            geometry: null,
            properties: {
              ELECT_DIV: "Lingiari",
              STATE: "NT"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.3",
            geometry: null,
            properties: {
              ELECT_DIV: "Canberra",
              STATE: "ACT"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.5",
            geometry: null,
            properties: {
              ELECT_DIV: "Brand",
              STATE: "WA"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.20",
            geometry: null,
            properties: {
              ELECT_DIV: "Bass",
              STATE: "TAS"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.21",
            geometry: null,
            properties: {
              ELECT_DIV: "Braddon",
              STATE: "TAS"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.22",
            geometry: null,
            properties: {
              ELECT_DIV: "Denison",
              STATE: "TAS"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.23",
            geometry: null,
            properties: {
              ELECT_DIV: "Franklin",
              STATE: "TAS"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.24",
            geometry: null,
            properties: {
              ELECT_DIV: "Lyons",
              STATE: "TAS"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.25",
            geometry: null,
            properties: {
              ELECT_DIV: "Banks",
              STATE: "NSW"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.73",
            geometry: null,
            properties: {
              ELECT_DIV: "Blair",
              STATE: "QLD"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.103",
            geometry: null,
            properties: {
              ELECT_DIV: "Aston",
              STATE: "VIC"
            }
          },
          {
            type: "Feature",
            id: "COM20111216_ELB_region.140",
            geometry: null,
            properties: {
              ELECT_DIV: "Adelaide",
              STATE: "SA"
            }
          }
        ],
        crs: null
      })
    });

    terria = new Terria({
      baseUrl: "./"
    });
    wfsGroup = new WfsFeaturesCatalogGroup(terria);

    wfsGroup.updateFromJson(cedJson);
    wfsGroup
      .load()
      .otherwise(done.fail)
      .then(done);
  });

  it("groups Commonwealth Electoral Divisions from our test region mapping server into 8 states", function() {
    expect(wfsGroup.items.length).toBe(8);
  });

  it("each of which is a group", function() {
    expect(wfsGroup.items[0].type).toBe("group");
  });

  it("of which TAS is one, containing 5 electorates", function() {
    var tas = wfsGroup.items.filter(function(x) {
      return x.name === "TAS";
    })[0];
    expect(tas.items.length).toBe(5);
  });

  it("which are GeoJson types", function() {
    var tas = wfsGroup.items.filter(function(x) {
      return x.name === "TAS";
    })[0];
    expect(tas.items[0].type).toBe("geojson");
  });

  it("which have an inherited style and description property", function() {
    var tas = wfsGroup.items.filter(function(x) {
      return x.name === "TAS";
    })[0];
    expect(tas.items[0].style.fill).toBe("purple");
    expect(tas.items[0].description).toBe("CED test");
  });
});
