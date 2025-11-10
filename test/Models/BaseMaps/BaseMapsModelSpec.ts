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
  }
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
  }
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
      enabledBaseMaps: ["basemap-natural-earth-II"]
    };
    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps);
    expect(baseMapsModel.items.length).toBe(
      defaultBaseMapsLength + baseMaps.items.length
    );
    expect(baseMapsModel.baseMapItems.length).toBe(1);
  });

  it("propperly override image", () => {
    const _baseMapNaturalEarth = JSON.parse(
      JSON.stringify({
        item: {
          id: "basemap-natural-earth-II-test",
          name: "Natural Earth II",
          type: "url-template-imagery",
          url: "https://storage.googleapis.com/terria-datasets-public/basemaps/natural-earth-tiles/{z}/{x}/{reverseY}.png",
          attribution:
            "<a href='https://www.naturalearthdata.com/downloads/10m-raster-data/10m-natural-earth-2/'>Natural Earth II</a> - From Natural Earth. <a href='https://www.naturalearthdata.com/about/terms-of-use/'>Public Domain</a>.",
          maximumLevel: 7,
          opacity: 1.0
        },
        image: "build/TerriaJS/images/natural-earth.png",
        contrastColor: "#000000"
      })
    );
    _baseMapNaturalEarth.item.id = "basemap-natural-earth-II";
    _baseMapNaturalEarth.image = "test";
    const baseMaps: any = {
      items: [_baseMapNaturalEarth],
      enabledBaseMaps: ["basemap-natural-earth-II"]
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

  it("properly sorts baseMaps based on enabledBaseMaps array", () => {
    const baseMaps: any = {
      items: [baseMapPositron, baseMapDarkMatter],
      enabledBaseMaps: ["basemap-darkmatter1", "basemap-positron1"]
    };

    baseMapsModel.loadFromJson(CommonStrata.definition, baseMaps);

    expect(baseMapsModel.items.length).toBe(defaultBaseMapsLength + 2);
    expect(baseMapsModel.baseMapItems.length).toBe(2);
    expect(baseMapsModel.baseMapItems[0].item.uniqueId).toBe(
      "basemap-darkmatter1"
    );
    expect(baseMapsModel.baseMapItems[1].item.uniqueId).toBe(
      "basemap-positron1"
    );
  });
});
