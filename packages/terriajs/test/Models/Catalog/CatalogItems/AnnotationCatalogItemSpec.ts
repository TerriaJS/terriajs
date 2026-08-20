import AnnotationCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/AnnotationCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../../lib/Models/Terria";

describe("AnnotationCatalogItem", function () {
  let terria: Terria;
  let item: AnnotationCatalogItem;

  beforeEach(function () {
    terria = new Terria({ baseUrl: "./" });
    item = new AnnotationCatalogItem("test", terria);
  });

  it("has a type", function () {
    expect(item.type).toBe("annotations");
  });

  it("adds an annotation and returns its id", function () {
    const id = item.addAnnotation({
      longitude: 133,
      latitude: -25,
      text: "<p>Hello</p>"
    });
    expect(typeof id).toBe("string");
    expect(item.annotations.length).toBe(1);
    expect(item.annotations[0].id).toBe(id);
    expect(item.annotations[0].longitude).toBe(133);
    expect(item.annotations[0].latitude).toBe(-25);
    expect(item.annotations[0].text).toBe("<p>Hello</p>");
  });

  it("stores annotations in the user stratum so they are shareable", function () {
    item.addAnnotation({ longitude: 1, latitude: 2, text: "a" });
    const userStratum: any = item.strata.get(CommonStrata.user);
    expect(userStratum.annotations.length).toBe(1);
  });

  it("builds a billboard entity with an HTML description per annotation", async function () {
    item.addAnnotation({
      longitude: 133,
      latitude: -25,
      text: "<p>Hello <strong>world</strong></p>"
    });
    await item.loadMapItems();
    const dataSource: any = item.mapItems[0];
    expect(dataSource.entities.values.length).toBe(1);
    const entity = dataSource.entities.values[0];
    expect(entity.billboard).toBeDefined();
    expect(entity.description?.getValue(terria.timelineClock.currentTime)).toBe(
      "<p>Hello <strong>world</strong></p>"
    );
  });

  it("updates an existing annotation's text", function () {
    const id = item.addAnnotation({ longitude: 1, latitude: 2, text: "old" });
    item.updateAnnotation(id, { text: "new" });
    expect(item.annotations.length).toBe(1);
    expect(item.getAnnotation(id)?.text).toBe("new");
  });

  it("removes an annotation", function () {
    const id1 = item.addAnnotation({ longitude: 1, latitude: 2, text: "a" });
    const id2 = item.addAnnotation({ longitude: 3, latitude: 4, text: "b" });
    item.removeAnnotation(id1);
    expect(item.annotations.length).toBe(1);
    expect(item.annotations[0].id).toBe(id2);
  });

  it("opens new annotations by default", function () {
    const id = item.addAnnotation({ longitude: 1, latitude: 2, text: "a" });
    expect(item.getAnnotation(id)?.open).toBe(true);
  });

  it("toggles an annotation's open state", function () {
    const id = item.addAnnotation({ longitude: 1, latitude: 2, text: "a" });
    item.toggleAnnotationOpen(id);
    expect(item.getAnnotation(id)?.open).toBe(false);
    item.toggleAnnotationOpen(id);
    expect(item.getAnnotation(id)?.open).toBe(true);
  });

  it("preserves open state and text through updates", function () {
    const id = item.addAnnotation({ longitude: 1, latitude: 2, text: "old" });
    item.setAnnotationOpen(id, false);
    item.updateAnnotation(id, { text: "new" });
    expect(item.getAnnotation(id)?.text).toBe("new");
    expect(item.getAnnotation(id)?.open).toBe(false);
  });
});
