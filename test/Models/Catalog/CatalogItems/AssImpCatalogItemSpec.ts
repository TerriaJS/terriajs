import loadBlob from "../../../../lib/Core/loadBlob";
import MappableMixin from "../../../../lib/ModelMixins/MappableMixin";
import AssImpCatalogItem from "../../../../lib/Models/Catalog/Gltf/AssImpCatalogItem";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";
import updateModelFromJson from "../../../../lib/Models/Definition/updateModelFromJson";
import Terria from "../../../../lib/Models/Terria";
import { GlTf } from "../../../../lib/Models/Catalog/Gltf/GLTF";

describe("AssImpCatalogItem", function () {
  let model: AssImpCatalogItem;
  const terria = new Terria();

  beforeEach(function () {
    model = new AssImpCatalogItem("test", terria);
    updateModelFromJson(model, CommonStrata.override, {
      urls: [
        "test/AssImp/cube_with_materials.obj",
        "test/AssImp/cube_with_materials.mtl"
      ],
      baseUrl: "some-base-url/"
    });
  });

  it("is Mappable", function () {
    expect(MappableMixin.isMixedInto(model)).toBeTruthy();
  });

  it("creates a DataSource with a model", async function () {
    await model.loadMapItems();
    expect(model.mapItems.length).toBe(1);
    expect(model.mapItems[0].entities.values.length).toBe(1);
    expect(model.mapItems[0].entities.values[0].polygon).toBeUndefined();
    expect(model.mapItems[0].entities.values[0].model?.uri).toBeDefined();
  });

  it("applies baseUrl", async function () {
    await model.loadMapItems();

    const gltfUri = model.mapItems[0].entities.values[0].model?.uri;
    expect(gltfUri).toBeDefined();

    if (!gltfUri) throw "gltfUri is undefined";

    const blob = await loadBlob(
      gltfUri.getValue(terria.timelineClock.currentTime)
    );
    const file = new File([blob], "gltf");
    const gltfJson = JSON.parse(await file.text()) as GlTf;

    expect(gltfJson.buffers?.[0].uri?.startsWith("blob:")).toBeTruthy();
    expect(gltfJson.images?.[0].uri).toBe("some-base-url/cube_texture.png");
  });

  it("supports zip file", async function () {
    model.setTrait(CommonStrata.override, "urls", ["test/AssImp/zip-test.zip"]);
    await model.loadMapItems();

    const gltfUri = model.mapItems[0].entities.values[0].model?.uri;
    expect(gltfUri).toBeDefined();

    if (!gltfUri) throw "gltfUri is undefined";

    const blob = await loadBlob(
      gltfUri.getValue(terria.timelineClock.currentTime)
    );
    const file = new File([blob], "gltf");
    const gltfJson = JSON.parse(await file.text()) as GlTf;

    expect(gltfJson.buffers?.[0].uri?.startsWith("blob:")).toBeTruthy();
    expect(gltfJson.images?.[0].uri?.startsWith("blob:")).toBeTruthy();
  });

  describe("hasLocalData", function () {
    it("should be false by default", function () {
      expect(model.hasLocalData).toBeFalsy();
    });

    it("should be true if the catalog item has local file data", function () {
      model.setFileInput(new Blob());
      expect(model.hasLocalData).toBeTruthy();
    });
  });
});
