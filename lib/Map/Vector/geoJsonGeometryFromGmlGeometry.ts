import RuntimeError from "terriajs-cesium/Source/Core/RuntimeError";
import i18next from "i18next";
import defined from "terriajs-cesium/Source/Core/defined";

const gmlNamespace = "http://www.opengis.net/gml";

function createLineStringFromGmlGeometry(geometry: any) {
  const coordinates = [];

  const posNodes = geometry.getElementsByTagNameNS(gmlNamespace, "posList");
  for (let i = 0; i < posNodes.length; ++i) {
    const positions = gml2coord(posNodes[i].textContent.trim());
    for (let j = 0; j < positions.length; ++j) {
      coordinates.push(positions[j]);
    }
  }

  return {
    type: "LineString",
    coordinates: coordinates
  };
}

function createPointFromGmlGeometry(geometry: any) {
  const posNodes = geometry.getElementsByTagNameNS(gmlNamespace, "pos");
  if (posNodes < 1) {
    throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingPos"));
  }

  return {
    type: "Point",
    coordinates: gml2coord(posNodes[0].textContent)[0]
  };
}

function createPolygonFromEnvelope(geometry: any) {
  const lowerCorners = geometry.getElementsByTagNameNS(
    gmlNamespace,
    "lowerCorner"
  );
  const upperCorners = geometry.getElementsByTagNameNS(
    gmlNamespace,
    "upperCorner"
  );

  const lowerCorner = gml2coord(lowerCorners[0].textContent)[0];
  const upperCorner = gml2coord(upperCorners[0].textContent)[0];
  const minLon = lowerCorner[0];
  const minLat = lowerCorner[1];
  const maxLon = upperCorner[0];
  const maxLat = upperCorner[1];
  return {
    type: "Polygon",
    coordinates: [
      [
        [minLon, minLat],
        [minLon, maxLat],
        [maxLon, maxLat],
        [maxLon, minLat],
        [minLon, minLat]
      ]
    ]
  };
}

function createMultiLineStringFromGmlGeometry(geometry: any) {
  const curveMembers = geometry.getElementsByTagNameNS(gmlNamespace, "posList");
  const curves = [];
  for (let i = 0; i < curveMembers.length; ++i) {
    curves.push(gml2coord(curveMembers[i].textContent));
  }

  return {
    type: "MultiLineString",
    coordinates: curves
  };
}

function createMultiPolygonFromGmlGeomtry(geometry: any) {
  const coordinates = [];

  const polygons = geometry.getElementsByTagNameNS(gmlNamespace, "Polygon");
  for (let i = 0; i < polygons.length; ++i) {
    const polygon = polygons[i];
    const exteriorNodes = polygon.getElementsByTagNameNS(
      gmlNamespace,
      "exterior"
    );
    if (exteriorNodes.length < 1) {
      throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingExteriorRing"));
    }

    const polygonCoordinates = [];

    const exterior = exteriorNodes[0];
    const posListNodes = exterior.getElementsByTagNameNS(
      gmlNamespace,
      "posList"
    );
    if (posListNodes.length < 1) {
      throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingPosList"));
    }

    polygonCoordinates.push(gml2coord(posListNodes[0].textContent));

    const interiors = polygon.getElementsByTagNameNS(gmlNamespace, "interior");
    for (let j = 0; j < interiors.length; ++j) {
      const interior = interiors[j];
      const interiorPosListNodes = interior.getElementsByTagNameNS(
        gmlNamespace,
        "posList"
      );
      if (interiorPosListNodes.length < 1) {
        continue;
      }

      polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent));
    }

    coordinates.push(polygonCoordinates);
  }

  return {
    type: "MultiPolygon",
    coordinates: coordinates
  };
}

function createPolygonFromGmlGeometry(geometry: any) {
  const polygonCoordinates = [];

  const exteriorNodes = geometry.getElementsByTagNameNS(
    gmlNamespace,
    "exterior"
  );
  if (exteriorNodes.length < 1) {
    throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingExteriorRing"));
  }
  const exterior = exteriorNodes[0];
  const posListNodes = exterior.getElementsByTagNameNS(gmlNamespace, "posList");
  if (posListNodes.length < 1) {
    throw new RuntimeError(i18next.t("map.gmlToGeoJson.missingPosList"));
  }

  polygonCoordinates.push(gml2coord(posListNodes[0].textContent));

  const interiors = geometry.getElementsByTagNameNS(gmlNamespace, "interior");
  for (let j = 0; j < interiors.length; ++j) {
    const interior = interiors[j];
    const interiorPosListNodes = interior.getElementsByTagNameNS(
      gmlNamespace,
      "posList"
    );
    if (interiorPosListNodes.length < 1) {
      continue;
    }

    polygonCoordinates.push(gml2coord(interiorPosListNodes[0].textContent));
  }

  return {
    type: "Polygon",
    coordinates: polygonCoordinates
  };
}

function createMultiPointFromGmlGeometry(geometry: any) {
  const posNodes = geometry.getElementsByTagNameNS(gmlNamespace, "pos");
  const coordinates = [];

  for (let i = 0; i < posNodes.length; ++i) {
    coordinates.push(gml2coord(posNodes[i].textContent)[0]);
  }

  return {
    type: "MultiPoint",
    coordinates: coordinates
  };
}

const featureCreators = {
  Curve: createLineStringFromGmlGeometry,
  LineString: createLineStringFromGmlGeometry,
  Point: createPointFromGmlGeometry,
  Polygon: createPolygonFromGmlGeometry,
  MultiCurve: createMultiLineStringFromGmlGeometry,
  MultiPoint: createMultiPointFromGmlGeometry,
  MultiSurface: createMultiPolygonFromGmlGeomtry,
  Surface: createPolygonFromGmlGeometry,
  Envelope: createPolygonFromEnvelope
};

function geoJsonGeometryFeatureFromGmlGeometry(geometry: any) {
  const type = geometry.localName;
  // @ts-expect-error TS(7053)
  const creator = featureCreators[type];
  if (!defined(creator)) {
    throw new RuntimeError(
      i18next.t("map.gmlToGeoJson.containsUnsupportedFeatureType", {
        type: type
      })
    );
  }

  return creator(geometry);
}

function isNotEmpty(s: any) {
  return s.length !== 0;
}

//Utility function to change esri gml positions to geojson positions
function gml2coord(posList: any) {
  const pnts = posList.split(/[ ,]+/).filter(isNotEmpty);
  const coords = [];
  for (let i = 0; i < pnts.length; i += 2) {
    coords.push([parseFloat(pnts[i + 1]), parseFloat(pnts[i])]);
  }
  return coords;
}

export default geoJsonGeometryFeatureFromGmlGeometry;
