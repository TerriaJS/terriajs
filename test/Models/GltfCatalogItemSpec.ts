import GltfCatalogItem from "../../lib/Models/GltfCatalogItem";
import Mappable from "../../lib/Models/Mappable";
import Terria from "../../lib/Models/Terria";

describe("GltfCatalogItem", function() {
  it("is Mappable", function() {
    const terria = new Terria();
    const gltf = new GltfCatalogItem("test", terria);
    expect(Mappable.is(gltf)).toBeTruthy();
  });

  it("creates a DataSource with a model", function() {
    const terria = new Terria();
    const gltf = new GltfCatalogItem("test", terria);
    const url = "test/gltf/Cesium_Air.glb";
    gltf.setTrait("definition", "url", url);
    gltf.loadMapItems().then(() => {
      expect(gltf.mapItems.length).toBe(1);
      expect(gltf.mapItems[0].entities.values.length).toBe(1);
      expect(gltf.mapItems[0].entities.values[0].polygon).toBeUndefined();
      expect(gltf.mapItems[0].entities.values[0].model).toBeDefined();
    });
  });
});
