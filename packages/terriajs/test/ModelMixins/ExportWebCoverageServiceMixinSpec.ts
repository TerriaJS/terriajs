import { http, HttpResponse } from "msw";
import { runInAction } from "mobx";
import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import WebMapServiceCatalogItem from "../../lib/Models/Catalog/Ows/WebMapServiceCatalogItem";
import Terria from "../../lib/Models/Terria";
import { worker } from "../mocks/browser";
import describeCoverageXml from "../../wwwroot/test/WCS/DescribeCoverage.xml";
import wmsGetCapabilitiesXml from "../../wwwroot/test/WMS/wms_crs.xml";

describe("ExportWebCoverageServiceMixin", function () {
  let terria: Terria;

  beforeEach(function () {
    terria = new Terria({
      baseUrl: "./"
    });

    worker.use(
      http.get("https://some.ows.service/wms", ({ request }) => {
        const url = new URL(request.url);
        if (url.searchParams.get("request") !== "GetCapabilities")
          throw new Error(`Unexpected query params: ${url.search}`);
        return new HttpResponse(wmsGetCapabilitiesXml, {
          headers: { "Content-Type": "text/xml" }
        });
      }),
      http.get("https://some.ows.service/wcs", ({ request }) => {
        const url = new URL(request.url);
        const wcsRequest = url.searchParams.get("request");
        if (wcsRequest === "DescribeCoverage") {
          return new HttpResponse(describeCoverageXml, {
            headers: { "Content-Type": "text/xml" }
          });
        }
        if (wcsRequest === "GetCoverage") {
          return new HttpResponse("cool");
        }
        throw new Error(`Unexpected WCS request: ${url.search}`);
      })
    );
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
