"use strict";

/*global require,describe,it,expect*/
var CswCatalogGroup = require("../../lib/Models/CswCatalogGroup");
var loadText = require("../../lib/Core/loadText");
var Terria = require("../../lib/Models/Terria");

describe("CswCatalogGroup", function() {
  var terria;
  beforeEach(function() {
    terria = new Terria({
      baseUrl: "./"
    });
  });

  afterEach(function() {
    jasmine.Ajax.uninstall();
  });

  describe("_findLevel", function() {
    it("function findLevel is able to sort a hierarchy correctly", function() {
      var metadataGroups = [];

      var keyList = [
        ["Multiple Use", "National"],
        ["Multiple Use", "Western Australia"],
        [
          "Wave Models",
          "Direction of Maximum Directionally Resolved Wave Power",
          "Averages"
        ],
        ["Wave Models", "Maximum Directionally Resolved Wave Power", "Averages"]
      ];
      for (var i = 0; i < keyList.length; i++) {
        var keys = keyList[i];
        CswCatalogGroup._findLevel(keys, 0, metadataGroups, " | ", "subject");
      }

      var expectedObj = [
        {
          field: "subject",
          value: "^Multiple Use\\ \\|\\ ",
          regex: true,
          group: "Multiple Use",
          children: [
            {
              field: "subject",
              value: "Multiple Use | National",
              regex: false,
              group: "National"
            },
            {
              field: "subject",
              value: "Multiple Use | Western Australia",
              regex: false,
              group: "Western Australia"
            }
          ]
        },
        {
          field: "subject",
          value: "^Wave Models\\ \\|\\ ",
          regex: true,
          group: "Wave Models",
          children: [
            {
              field: "subject",
              value:
                "^Wave Models\\ \\|\\ Direction of Maximum Directionally Resolved Wave Power\\ \\|\\ ",
              regex: true,
              group: "Direction of Maximum Directionally Resolved Wave Power",
              children: [
                {
                  field: "subject",
                  value:
                    "Wave Models | Direction of Maximum Directionally Resolved Wave Power | Averages",
                  regex: false,
                  group: "Averages"
                }
              ]
            },
            {
              field: "subject",
              value:
                "^Wave Models\\ \\|\\ Maximum Directionally Resolved Wave Power\\ \\|\\ ",
              regex: true,
              group: "Maximum Directionally Resolved Wave Power",
              children: [
                {
                  field: "subject",
                  value:
                    "Wave Models | Maximum Directionally Resolved Wave Power | Averages",
                  regex: false,
                  group: "Averages"
                }
              ]
            }
          ]
        }
      ];
      // If you're trying to debug this, run it through a json formatter. Then the structure becomes clear.
      var strActual = JSON.stringify(metadataGroups);
      var strExpected = JSON.stringify(expectedObj);
      expect(strActual).toEqual(strExpected);
    });
  });

  it("is able to use <references> links with a scheme attribute", function(done) {
    loadText("test/csw/ReferencesWithoutProtocol.xml")
      .then(function(xml) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError();
        jasmine.Ajax.stubRequest("http://gamone.whoi.edu/csw").andReturn({
          contentType: "text/xml",
          responseText: xml
        });

        var group = new CswCatalogGroup(terria);

        group.updateFromJson({
          name: "USGS Woods Hole pycsw",
          type: "csw",
          url: "http://gamone.whoi.edu/csw",
          getRecordsTemplate:
            '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" outputFormat="application/xml" version="2.0.2" service="CSW" resultType="results" maxRecords="1000" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd"> <csw:Query typeNames="csw:Record"> <csw:ElementSetName>full</csw:ElementSetName> <csw:Constraint version="1.1.0"> <ogc:Filter> <ogc:And> <ogc:BBOX> <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName> <gml:Envelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84"> <gml:lowerCorner> -158.4 20.7</gml:lowerCorner> <gml:upperCorner> -60.2 50.6</gml:upperCorner> </gml:Envelope> </ogc:BBOX> <ogc:PropertyIsLike wildCard="*" singleChar="?" escapeChar="\\"> <ogc:PropertyName>apiso:AnyText</ogc:PropertyName> <ogc:Literal>*CMG_Portal*</ogc:Literal> </ogc:PropertyIsLike> <ogc:PropertyIsLike wildCard="*" singleChar="?" escapeChar="\\"> <ogc:PropertyName>apiso:ServiceType</ogc:PropertyName> <ogc:Literal>*WMS*</ogc:Literal> </ogc:PropertyIsLike> </ogc:And> </ogc:Filter> </csw:Constraint> </csw:Query> </csw:GetRecords>'
        });

        return group.load().then(function() {
          expect(group.items.length).toBe(5);
        });
      })
      .then(done)
      .otherwise(done.fail);
  });

  it("honors itemProperties", function(done) {
    loadText("test/csw/ReferencesWithoutProtocol.xml")
      .then(function(xml) {
        jasmine.Ajax.install();
        jasmine.Ajax.stubRequest(/.*/).andError();
        jasmine.Ajax.stubRequest("http://gamone.whoi.edu/csw").andReturn({
          contentType: "text/xml",
          responseText: xml
        });

        var group = new CswCatalogGroup(terria);

        group.updateFromJson({
          name: "USGS Woods Hole pycsw",
          type: "csw",
          url: "http://gamone.whoi.edu/csw",
          getRecordsTemplate:
            '<csw:GetRecords xmlns:csw="http://www.opengis.net/cat/csw/2.0.2" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml" outputSchema="http://www.opengis.net/cat/csw/2.0.2" outputFormat="application/xml" version="2.0.2" service="CSW" resultType="results" maxRecords="1000" xsi:schemaLocation="http://www.opengis.net/cat/csw/2.0.2 http://schemas.opengis.net/csw/2.0.2/CSW-discovery.xsd"> <csw:Query typeNames="csw:Record"> <csw:ElementSetName>full</csw:ElementSetName> <csw:Constraint version="1.1.0"> <ogc:Filter> <ogc:And> <ogc:BBOX> <ogc:PropertyName>ows:BoundingBox</ogc:PropertyName> <gml:Envelope srsName="urn:ogc:def:crs:OGC:1.3:CRS84"> <gml:lowerCorner> -158.4 20.7</gml:lowerCorner> <gml:upperCorner> -60.2 50.6</gml:upperCorner> </gml:Envelope> </ogc:BBOX> <ogc:PropertyIsLike wildCard="*" singleChar="?" escapeChar="\\"> <ogc:PropertyName>apiso:AnyText</ogc:PropertyName> <ogc:Literal>*CMG_Portal*</ogc:Literal> </ogc:PropertyIsLike> <ogc:PropertyIsLike wildCard="*" singleChar="?" escapeChar="\\"> <ogc:PropertyName>apiso:ServiceType</ogc:PropertyName> <ogc:Literal>*WMS*</ogc:Literal> </ogc:PropertyIsLike> </ogc:And> </ogc:Filter> </csw:Constraint> </csw:Query> </csw:GetRecords>',
          itemProperties: {
            titleField: "name"
          }
        });

        return group.load().then(function() {
          expect(group.items[0].titleField).toBe("name");
        });
      })
      .then(done)
      .otherwise(done.fail);
  });
});
