"use strict";

import featureDataToGeoJson from "../../lib/Map/PickedFeatures/featureDataToGeoJson";

describe("featureDataToGeoJson", function () {
  describe("Esri polygon", function () {
    it("with a single outer ring", function () {
      const esri = {
        geometryType: "esriGeometryPolygon",
        geometry: {
          rings: [
            [
              [5.0, 5.0],
              [5.0, 10.0],
              [10.0, 10.0],
              [10.0, 5.0],
              [5.0, 5.0]
            ]
          ]
        },
        attributes: {}
      };
      const geoJson = featureDataToGeoJson(esri);
      expect(geoJson?.features[0]).toEqual({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [5.0, 5.0],
              [10.0, 5.0],
              [10.0, 10.0],
              [5.0, 10.0],
              [5.0, 5.0]
            ]
          ]
        },
        properties: {}
      });
    });

    it("with one outer ring and two holes", function () {
      const esri = {
        geometryType: "esriGeometryPolygon",
        geometry: {
          rings: [
            [
              [5.0, 5.0],
              [5.0, 10.0],
              [10.0, 10.0],
              [10.0, 5.0],
              [5.0, 5.0]
            ],
            [
              [7.0, 7.0],
              [8.0, 7.0],
              [8.0, 8.0],
              [7.0, 8.0],
              [7.0, 7.0]
            ],
            [
              [8.5, 8.5],
              [9.5, 8.5],
              [9.5, 9.5],
              [8.5, 9.5],
              [8.5, 8.5]
            ]
          ]
        },
        attributes: {}
      };
      const geoJson = featureDataToGeoJson(esri);
      expect(geoJson?.features[0]).toEqual({
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [
            [
              [5.0, 5.0],
              [10.0, 5.0],
              [10.0, 10.0],
              [5.0, 10.0],
              [5.0, 5.0]
            ],
            [
              [7.0, 7.0],
              [7.0, 8.0],
              [8.0, 8.0],
              [8.0, 7.0],
              [7.0, 7.0]
            ],
            [
              [8.5, 8.5],
              [8.5, 9.5],
              [9.5, 9.5],
              [9.5, 8.5],
              [8.5, 8.5]
            ]
          ]
        },
        properties: {}
      });
    });

    it("with two outer rings", function () {
      const esri = {
        geometryType: "esriGeometryPolygon",
        geometry: {
          rings: [
            [
              [5.0, 5.0],
              [5.0, 10.0],
              [10.0, 10.0],
              [10.0, 5.0],
              [5.0, 5.0]
            ],
            [
              [11.0, 11.0],
              [11.0, 12.0],
              [12.0, 12.0],
              [12.0, 11.0],
              [11.0, 11.0]
            ]
          ]
        },
        attributes: {}
      };
      const geoJson = featureDataToGeoJson(esri);
      expect(geoJson?.features[0]).toEqual({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [5.0, 5.0],
                [10.0, 5.0],
                [10.0, 10.0],
                [5.0, 10.0],
                [5.0, 5.0]
              ]
            ],
            [
              [
                [11.0, 11.0],
                [12.0, 11.0],
                [12.0, 12.0],
                [11.0, 12.0],
                [11.0, 11.0]
              ]
            ]
          ]
        },
        properties: {}
      });
    });

    it("with two outer rings and a hole in each", function () {
      const esri = {
        geometryType: "esriGeometryPolygon",
        geometry: {
          rings: [
            [
              [5.0, 5.0],
              [5.0, 10.0],
              [10.0, 10.0],
              [10.0, 5.0],
              [5.0, 5.0]
            ],
            [
              [11.25, 11.25],
              [11.75, 11.25],
              [11.75, 11.75],
              [11.25, 11.75],
              [11.25, 11.25]
            ],
            [
              [11.0, 11.0],
              [11.0, 12.0],
              [12.0, 12.0],
              [12.0, 11.0],
              [11.0, 11.0]
            ],
            [
              [7.0, 7.0],
              [8.0, 7.0],
              [8.0, 8.0],
              [7.0, 8.0],
              [7.0, 7.0]
            ]
          ]
        },
        attributes: {}
      };
      const geoJson = featureDataToGeoJson(esri);
      expect(geoJson?.features[0]).toEqual({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [5.0, 5.0],
                [10.0, 5.0],
                [10.0, 10.0],
                [5.0, 10.0],
                [5.0, 5.0]
              ],
              [
                [7.0, 7.0],
                [7.0, 8.0],
                [8.0, 8.0],
                [8.0, 7.0],
                [7.0, 7.0]
              ]
            ],
            [
              [
                [11.0, 11.0],
                [12.0, 11.0],
                [12.0, 12.0],
                [11.0, 12.0],
                [11.0, 11.0]
              ],
              [
                [11.25, 11.25],
                [11.25, 11.75],
                [11.75, 11.75],
                [11.75, 11.25],
                [11.25, 11.25]
              ]
            ]
          ]
        },
        properties: {}
      });
    });

    it("with no outer rings, assumes winding order is reversed and uses holes as outer rings", function () {
      const esri = {
        geometryType: "esriGeometryPolygon",
        geometry: {
          rings: [
            [
              [5.0, 5.0],
              [10.0, 5.0],
              [10.0, 10.0],
              [5.0, 10.0],
              [5.0, 5.0]
            ],
            [
              [11.0, 11.0],
              [12.0, 11.0],
              [12.0, 12.0],
              [11.0, 12.0],
              [11.0, 11.0]
            ]
          ]
        },
        attributes: {}
      };
      const geoJson = featureDataToGeoJson(esri);
      expect(geoJson?.features[0]).toEqual({
        type: "Feature",
        geometry: {
          type: "MultiPolygon",
          coordinates: [
            [
              [
                [5.0, 5.0],
                [10.0, 5.0],
                [10.0, 10.0],
                [5.0, 10.0],
                [5.0, 5.0]
              ]
            ],
            [
              [
                [11.0, 11.0],
                [12.0, 11.0],
                [12.0, 12.0],
                [11.0, 12.0],
                [11.0, 11.0]
              ]
            ]
          ]
        },
        properties: {}
      });
    });
  });
});
