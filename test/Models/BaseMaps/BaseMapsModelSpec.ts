import { BaseMapsModel } from "../../../lib/Models/BaseMaps/BaseMapsModel";
import CommonStrata from "../../../lib/Models/Definition/CommonStrata";
import Terria from "../../../lib/Models/Terria";
const baseMapPositron = {
  item: {
    id: "basemap-positron1",
    name: "Positron (Light)",
    type: "open-street-map",
    url: "https://basemaps.cartocdn.com/light_all/",
    attribution:
      "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
    subdomains: ["a", "b", "c", "d"],
    opacity: 1.0
  },
  image: "/images/positron.png"
};

const baseMapDarkMatter = {
  item: {
    id: "basemap-darkmatter1",
    name: "Dark Matter",
    type: "open-street-map",
    url: "https://basemaps.cartocdn.com/dark_all/",
    attribution:
      "© <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>, © <a href='https://carto.com/about-carto/'>CARTO</a>",
    subdomains: ["a", "b", "c", "d"],
    opacity: 1.0
  },
  image: "/images/dark-matter.png"
};

describe("BaseMapModel", () => {
  let terria: Terria;
  let baseMapsModel: BaseMapsModel;
  let defaultBaseMapsLength: number;
  beforeEach(() => {
    terria = new Terria({
      baseUrl: "./"
    });
    baseMapsModel = new BaseMapsModel("test", terria);
    baseMapsModel.initializeDefaultBaseMaps();
    defaultBaseMapsLength = baseMapsModel.items.length;
  });

  it("properly initialize default basemaps", () => {
    expect(baseMapsModel.items.length).toBe(defaultBaseMapsLength);
    expect(baseMapsModel.baseMapItems.length).toBe(defaultBaseMapsLength);
  });

  it("properly load from json", () => {
    const baseMaps = {
      items: [baseMapPositron]
    };
    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps);
    expect(baseMapsModel.items.length).toBe(
      defaultBaseMapsLength + baseMaps.items.length
    );
    expect(baseMapsModel.baseMapItems.length).toBe(
      defaultBaseMapsLength + baseMaps.items.length
    );
  });

  it("properly use enabledBaseMaps list", () => {
    const baseMaps: any = {
      items: [baseMapPositron],
      enabledBaseMaps: ["basemap-positron"]
    };
    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps);
    expect(baseMapsModel.items.length).toBe(
      defaultBaseMapsLength + baseMaps.items.length
    );
    expect(baseMapsModel.baseMapItems.length).toBe(1);
  });

  it("propperly override image", () => {
    const _baseMapPositron = JSON.parse(JSON.stringify(baseMapPositron));
    _baseMapPositron.item.id = "basemap-positron";
    _baseMapPositron.image = "test";
    const baseMaps: any = {
      items: [_baseMapPositron],
      enabledBaseMaps: ["basemap-positron"]
    };
    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps);
    expect(baseMapsModel.items.length).toBe(defaultBaseMapsLength);
    expect(baseMapsModel.baseMapItems.length).toBe(1);
    expect(baseMapsModel.baseMapItems[0].image).toBe("test");
  });

  it("propperly combines from multiple loads", () => {
    const baseMaps: any = {
      items: [baseMapPositron],
      enabledBaseMaps: ["basemap-positron1"]
    };
    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps);
    expect(baseMapsModel.items.length).toBe(defaultBaseMapsLength + 1);
    expect(baseMapsModel.baseMapItems.length).toBe(1);

    const baseMaps1: any = {
      items: [baseMapDarkMatter],
      enabledBaseMaps: ["basemap-positron1", "basemap-darkmatter1"]
    };
    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps1);
    expect(baseMapsModel.items.length).toBe(defaultBaseMapsLength + 2);
    expect(baseMapsModel.baseMapItems.length).toBe(2);
  });
});
