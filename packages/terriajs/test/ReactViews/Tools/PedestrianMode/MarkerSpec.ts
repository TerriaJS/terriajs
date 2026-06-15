import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import Terria from "../../../../lib/Models/Terria";
import Marker from "../../../../lib/ReactViews/Tools/PedestrianMode/Marker";

describe("Marker", function () {
  let terria: Terria;
  let marker: Marker;
  let entity: Entity;
  let billboard: BillboardGraphics;

  beforeEach(function () {
    terria = new Terria();
    marker = new Marker(undefined, terria);
    entity = marker.mapItems[0].entities.values[0];
    billboard = marker.mapItems[0].entities.values[0].billboard!;
  });

  it("correctly sets the billboard image from the icon URL", function () {
    const url = "data:image/gif;base64,ABC";
    marker.iconUrl = url;
    expect(billboard.image?.getValue()).toBe(url);
  });

  it("correctly sets the billboard rotation", function () {
    marker.rotation = Math.PI;
    expect(billboard.rotation?.getValue()).toBe(Math.PI);
  });

  it("correctly sets the billboard position", function () {
    const position = Cartesian3.fromDegrees(144.9631, -37.8136);
    marker.position = position;
    expect(entity.position?.getValue()).toEqual(position);
  });
});
