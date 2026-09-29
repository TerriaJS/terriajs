import L from "leaflet";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import Color from "terriajs-cesium/Source/Core/Color";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CesiumMath from "terriajs-cesium/Source/Core/Math";
import writeTextToCanvas from "terriajs-cesium/Source/Core/writeTextToCanvas";
import BillboardGraphics from "terriajs-cesium/Source/DataSources/BillboardGraphics";
import CustomDataSource from "terriajs-cesium/Source/DataSources/CustomDataSource";
import Entity from "terriajs-cesium/Source/DataSources/Entity";
import LabelGraphics from "terriajs-cesium/Source/DataSources/LabelGraphics";
import LeafletScene from "../../../lib/Map/Leaflet/LeafletScene";
import LeafletVisualizer from "../../../lib/Map/Leaflet/LeafletVisualizer";

describe("LeafletVisualizer", function () {
  let container: HTMLElement;
  let map: L.Map;
  let scene: LeafletScene;
  let dataSource: CustomDataSource;

  beforeEach(function () {
    container = document.createElement("div");
    container.style.width = "200px";
    container.style.height = "200px";
    document.body.appendChild(container);
    map = L.map(container, { center: [0, 0], zoom: 3 });
    scene = new LeafletScene(map);
    dataSource = new CustomDataSource();
  });

  afterEach(function () {
    map.remove();
    document.body.removeChild(container);
  });

  function visualize() {
    const visualizer = new LeafletVisualizer().visualizersCallback(
      scene,
      undefined,
      dataSource
    )[0];
    visualizer.update(JulianDate.now());
  }

  describe("billboard", function () {
    it("applies a CSS rotate transform when the billboard defines a rotation", function () {
      const rotation = CesiumMath.toRadians(42);
      dataSource.entities.add(
        new Entity({
          position: Cartesian3.fromDegrees(0, 0) as any,
          billboard: new BillboardGraphics({
            // single pixel dot
            image:
              "data:image/gif;base64,R0lGODlhAQABAPAAAAAAAP///yH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
            width: 24,
            height: 24,
            rotation
          })
        })
      );
      visualize();

      const icon = container.querySelector<HTMLElement>(".leaflet-marker-icon");
      expect(icon).not.toBeNull();
      expect(icon!.style.transform).toMatch(/rotateZ\(0\.73\d*rad\)/);
      expect(icon!.style.transformOrigin.startsWith("center center")).toBe(
        true
      );
    });
  });

  describe("label", function () {
    const font = "20px sans-serif";
    const text = "Jetty";

    function findMarker(): L.Marker | undefined {
      let marker: L.Marker | undefined;
      map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
          marker = layer;
        }
      });
      return marker;
    }

    /**
     * Visualizes a single labelled entity and resolves with the icon options
     * once the label has been rendered to a canvas (which happens
     * asynchronously, after the generated data URL has loaded into an image).
     */
    async function visualizeLabel(label: LabelGraphics): Promise<any> {
      dataSource.entities.add(
        new Entity({
          position: Cartesian3.fromDegrees(0, 0) as any,
          label
        })
      );
      visualize();

      const marker = findMarker();
      expect(marker).toBeDefined();

      for (let attempt = 0; attempt < 200; ++attempt) {
        const options = marker!.options.icon?.options as any;
        if (options?.iconUrl?.startsWith("data:image/png")) {
          return options;
        }
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      throw new Error("Timed out waiting for the label to be drawn");
    }

    /** Loads a data URL and returns its dimensions and a pixel accessor. */
    async function readImage(dataUrl: string) {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = dataUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      return {
        width: image.width,
        height: image.height,
        pixelAt: (x: number, y: number) =>
          Array.from(context.getImageData(x, y, 1, 1).data)
      };
    }

    it("passes the background colour through to the icon options", async function () {
      const options = await visualizeLabel(
        new LabelGraphics({
          text,
          font,
          fillColor: Color.WHITE,
          backgroundColor: Color.RED
        })
      );

      expect(options.backgroundColor).toBe(Color.RED.toCssColorString());
      expect(options.color).toBe(Color.WHITE.toCssColorString());
    });

    it("fills the rendered label with the background colour", async function () {
      const options = await visualizeLabel(
        new LabelGraphics({
          text,
          font,
          fillColor: Color.WHITE,
          backgroundColor: Color.RED
        })
      );
      const image = await readImage(options.iconUrl);

      // The padding guarantees the corners are background rather than glyph.
      expect(image.pixelAt(0, 0)).toEqual([255, 0, 0, 255]);
      expect(image.pixelAt(image.width - 1, image.height - 1)).toEqual([
        255, 0, 0, 255
      ]);
    });

    it("leaves the background transparent when the label does not set one", async function () {
      const options = await visualizeLabel(
        new LabelGraphics({ text, font, fillColor: Color.WHITE })
      );
      const image = await readImage(options.iconUrl);

      expect(options.backgroundColor).toBe(
        Color.TRANSPARENT.toCssColorString()
      );
      expect(image.pixelAt(0, 0)[3]).toBe(0);
    });

    it("pads the rendered label around the glyphs", async function () {
      const options = await visualizeLabel(
        new LabelGraphics({
          text,
          font,
          fillColor: Color.WHITE,
          backgroundColor: Color.RED
        })
      );
      const image = await readImage(options.iconUrl);
      const unpadded = writeTextToCanvas(text, {
        fillColor: Color.WHITE,
        font
      })!;

      expect(unpadded).toBeDefined();
      expect(image.width).toBe(unpadded.width + 10);
      expect(image.height).toBe(unpadded.height + 10);
    });
  });
});
