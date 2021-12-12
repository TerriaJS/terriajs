import fetchMock from "fetch-mock";
import { fetchJson, fetchBlob } from "../../lib/Core/fetchWithProgress";
import { isJsonObject, JsonObject } from "../../lib/Core/Json";
import Terria from "../../lib/Models/Terria";

describe("fetchWithProgress", async () => {
  let terria: Terria;

  beforeEach(async () => {
    fetchMock.mock(
      "https://example.com/api/v2/catalog/datasets/weather-stations/",
      { body: "dataset" }
    );

    terria = new Terria();
  });

  afterEach(async () => {
    fetchMock.restore();
  });

  it("404", async () => {});

  it("501", async () => {});

  it("downloads JSON", async () => {
    // const fetchOptions: LoadOptionsWithMaxSize | LoadOptions = {
    //   bodyObject: this.requestData
    //     ? (toJS(this.requestData) as JsonObject)
    //     : undefined,
    //   asForm: this.postRequestDataAsFormData,
    //   fileSizeToPrompt: 50 * 1024 * 1024, // 50 MB,
    //   maxFileSize: 250 * 1024 * 1024, // 250 MB,
    //   model: this
    // };
    fetchMock.mock("some-json.json", { body: '{"some":"JSON"}' });
    const result = await fetchJson("some-json.json");

    const json = result.throwIfUndefined().response;
    expect(isJsonObject(json)).toBeTruthy();

    expect(json as JsonObject).toEqual({ some: "JSON" });
  });

  it("downloads blob", async () => {
    fetchMock.mock("some-string", { body: "what" });

    const result = await fetchBlob("some-string");

    const blob = result.throwIfUndefined().response;
    expect(blob instanceof Blob).toBeTruthy();

    expect(await blob.text()).toEqual("what");
  });

  it("downloads text", async () => {});

  describe("post with bodyObject", function() {
    it("as form", async () => {});
    it("body", async () => {});
  });

  describe("max file size", function() {
    it("header - under size", async () => {});
    it("header - over size", async () => {});
    it("stream - under size", async () => {});
    it("stream - over size", async () => {});
  });

  describe("file size - user prompt", function() {
    it("header - under size", async () => {});
    it("header - over size", async () => {});
    it("stream - under size", async () => {});
    it("stream - over size", async () => {});
  });

  describe("max file size", function() {
    it("header - under size", async () => {});
    it("header - over size", async () => {});
    it("stream - under size", async () => {});
    it("stream - over size", async () => {});
  });

  describe("file size - user prompt and maximum", function() {
    it("header - under max size", async () => {});
    it("header - over max size", async () => {});
    it("stream - under max size", async () => {});
    it("stream - over max size", async () => {});
  });
});
