import { runInAction } from "mobx";
import OpenDataSoftCatalogItem from "../../../../lib/Models/Catalog/CatalogItems/OpenDataSoftCatalogItem";
import Terria from "../../../../lib/Models/Terria";
import fetchMock from "fetch-mock";
import CommonStrata from "../../../../lib/Models/Definition/CommonStrata";

const dataset = JSON.stringify(
  require("../../../../wwwroot/test/ods/weather-station-dataset.json")
);

const groupBy = JSON.stringify(
  require("../../../../wwwroot/test/ods/weather-station-groupby.json")
);

const weatherStationData = JSON.stringify(
  require("../../../../wwwroot/test/ods/weather-station-100.json")
);

const regionMapping = JSON.stringify(
  require("../../../../wwwroot/data/regionMapping.json")
);

describe("OpenDataSoftCatalogItem", function () {
  let terria: Terria;
  let odsItem: OpenDataSoftCatalogItem;

  beforeEach(function () {
    fetchMock.mock(
      "https://example.com/api/v2/catalog/datasets/weather-stations/",
      { body: dataset }
    );

    fetchMock.mock(
      "https://example.com/api/v2/catalog/datasets/weather-stations/records/?group_by=geolocation&limit=100&select=min%28metadata_time%29+as+min_time%2C+max%28metadata_time%29+as+max_time%2C+count%28metadata_time%29+as+num",
      { body: groupBy }
    );

    fetchMock.mock(
      "https://example.com/api/v2/catalog/datasets/weather-stations/records/?limit=100&offset=0&order_by=metadata_time+DESC&select=device_name%2C+dev_id%2C+metadata_time%2C+heat_stress_index%2C+payload_fields_uvindex%2C+payload_fields_wshumidity%2C+payload_fields_wstemperature%2C+payload_fields_airpressure%2C+payload_fields_brightness%2C+payload_fields_gustdirection%2C+payload_fields_gustspeed%2C+payload_fields_precip%2C+payload_fields_precipint%2C+payload_fields_radiation%2C+payload_fields_winddirection%2C+payload_fields_windspeed%2C+payload_fields_averagespl%2C+payload_fields_carbonmonoxide%2C+payload_fields_humidity%2C+payload_fields_ibatt%2C+payload_fields_nitrogendioxide%2C+payload_fields_ozone%2C+payload_fields_particulateserr%2C+payload_fields_particulatesvsn%2C+payload_fields_peakspl%2C+payload_fields_pm1%2C+payload_fields_pm10%2C+payload_fields_pm25%2C+payload_fields_temperature%2C+payload_fields_vbatt%2C+payload_fields_vpanel%2C+payload_fields_fixstatus%2C+payload_fields_hdop%2C+payload_fields_nsat%2C+geolocation%2C+organisation",
      { body: weatherStationData }
    );

    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      "build/TerriaJS/data/regionMapping.json"
    ).andReturn({ responseText: regionMapping });

    terria = new Terria();
    odsItem = new OpenDataSoftCatalogItem("test", terria, undefined);
  });

  afterEach(function () {
    jasmine.Ajax.uninstall();
    fetchMock.restore();
  });

  it("has a type", function () {
    expect(odsItem.type).toBe("opendatasoft-item");
  });

  describe("loads dataset", function () {
    beforeEach(async function () {
      runInAction(() => {
        odsItem.setTrait("definition", "url", "https://example.com");
        odsItem.setTrait("definition", "datasetId", "weather-stations");
      });
    });

    it("load map items", async function () {
      await odsItem.loadMapItems();

      expect(odsItem.name).toBe("Environmental sensors");
      expect(odsItem.description?.length).toBe(244);
      expect(odsItem.datasetId).toBe("weather-stations");
    });

    it("sets refreshInterval from refreshIntervalTemplate", async function () {
      odsItem.setTrait(
        CommonStrata.definition,
        "refreshIntervalTemplate",
        "{{metas.custom.update_frequency}}"
      );
      await odsItem.loadMapItems();

      // metametas.custom.update_frequency = "10 min"
      expect(odsItem.refreshInterval).toBe(10 * 60);
    });
  });
});
