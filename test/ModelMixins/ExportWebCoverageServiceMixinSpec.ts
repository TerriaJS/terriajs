import { runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";

const describeCoverageXml = require("raw-loader!../../wwwroot/test/WCS/DescribeCoverage.xml");
const wmsGetCapabilitiesXml = require("raw-loader!../../wwwroot/test/WMS/wms_crs.xml");

describe("ExportWebCoverageServiceMixin", function () {
  let terria: Terria;

  beforeEach(async function () {
    terria = new Terria({
      baseUrl: "./"
    });

    jasmine.Ajax.install();

    jasmine.Ajax.stubRequest(
      "https://some.ows.service/wms?service=WMS&version=1.3.0&request=GetCapabilities"
    ).andReturn({
      responseText: wmsGetCapabilitiesXml
    });

    jasmine.Ajax.stubRequest(
      "https://some.ows.service/wcs?service=WCS&request=DescribeCoverage&version=2.0.0&coverageId=some_layer"
    ).andReturn({ responseText: describeCoverageXml });

    jasmine.Ajax.stubRequest(
      "https://some.ows.service/wcs?service=WCS&request=GetCoverage&version=2.0.0&coverageId=some_layer&format=image%2Fgeotiff&subset=Long(115.17293930053712%2C115.21465301513675)&subset=Lat(-33.66155217864614%2C-33.63376478677889)&subset=time(%222018-01-01%22)&subsettingCrs=EPSG%3A4326&outputCrs=EPSG%3A3577"
    ).andReturn({ responseText: "cool" });
  });

  afterEach(() => {
    jasmine.Ajax.uninstall();
  });

  it("Can call DescribeCoverage and set correct GetCoverage URL", async function () {
    const wms = new WebMapServiceCatalogItem("test", terria);
    runInAction(() => {
      wms.setTrait("definition", "url", "https://some.ows.service/wms");
      wms.setTrait("definition", "layers", "ls8_nbart_geomedian_annual");
      wms.setTrait(
        "definition",
        "linkedWcsUrl",
        "https://some.ows.service/wcs"
      );
      wms.setTrait("definition", "linkedWcsCoverage", "some_layer");
    });
    await wms.loadMapItems();

    expect(wms.currentDiscreteTimeTag).toBe("2018-01-01");

    expect(wms.styles).toBe("simple_rgb");
    expect(wms.linkedWcsUrl).toBe("https://some.ows.service/wcs");
    expect(wms.linkedWcsCoverage).toBe("some_layer");
    expect(wms.linkedWcsParameters.outputCrs).toBe("EPSG:4326");
    expect(wms.linkedWcsParameters.outputFormat).toBe("image/geotiff");
    expect(wms.linkedWcsParameters.subsets[0].key).toEqual("time");
    expect(wms.linkedWcsParameters.subsets[0].value).toEqual("2018-01-01");

    await wms.loadWcsMetadata();

    expect(wms.linkedWcsParameters.outputCrs).toBe("EPSG:3577");
    expect(wms.linkedWcsParameters.outputFormat).toBe("image/geotiff");
    expect(wms.linkedWcsParameters.subsets[0].key).toEqual("time");
    expect(wms.linkedWcsParameters.subsets[0].value).toEqual("2018-01-01");

    expect(
      wms
        .getCoverageUrl(
          new Rectangle(
            2.0101529921064003,
            -0.5874914705360393,
            2.0108211126448747,
            -0.587010105729862
          )
        )
        .ignoreError()
    ).toBe(
      "https://some.ows.service/wcs?service=WCS&request=GetCoverage&version=2.0.0&coverageId=some_layer&format=image%2Fgeotiff&subset=Long%28115.17328262329103%2C115.21156311035162%29&subset=Lat%28-33.66078176164941%2C-33.633201589849314%29&subset=time%28%222018-01-01%22%29&subsettingCrs=EPSG%3A4326&outputCrs=EPSG%3A3577&styles=simple_rgb"
    );

    // Set some custom parameters

    wms.linkedWcsParameters.setTrait("definition", "additionalParameters", [
      { key: "someKey", value: "someValue" }
    ]);
    wms.linkedWcsParameters.setTrait("definition", "outputCrs", "someCrs");
    wms.linkedWcsParameters.setTrait(
      "definition",
      "outputFormat",
      "someFormat"
    );
    wms.linkedWcsParameters.setTrait("definition", "subsets", [
      { key: "someSubsetKey", value: "someSubsetValue" }
    ]);

    expect(
      wms
        .getCoverageUrl(
          new Rectangle(
            2.0101529921064003,
            -0.5874914705360393,
            2.0108211126448747,
            -0.587010105729862
          )
        )
        .ignoreError()
    ).toBe(
      "https://some.ows.service/wcs?service=WCS&request=GetCoverage&version=2.0.0&coverageId=some_layer&format=someFormat&subset=Long%28115.17328262329103%2C115.21156311035162%29&subset=Lat%28-33.66078176164941%2C-33.633201589849314%29&subset=time%28%222018-01-01%22%29&subset=someSubsetKey%28%22someSubsetValue%22%29&subsettingCrs=EPSG%3A4326&outputCrs=someCrs&someKey=someValue"
    );
  });
});
