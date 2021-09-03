import Rectangle from "terriajs-cesium/Source/Core/Rectangle";
import TilingScheme from "terriajs-cesium/Source/Core/TilingScheme";
import WebMercatorTilingScheme from "terriajs-cesium/Source/Core/WebMercatorTilingScheme";
import ImageryProvider from "terriajs-cesium/Source/Scene/ImageryProvider";

type FxImageryProviderOptions = {
  imageryProviders: ImageryProvider[];
};

export default class FxImageryProvider implements ImageryProvider {
  defaultAlpha = undefined;
  defaultNightAlpha = undefined;
  defaultDayAlpha = undefined;
  defaultBrightness = undefined;
  defaultContrast = undefined;
  defaultHue = undefined;
  defaultSaturation = undefined;
  defaultGamma = undefined;
  defaultMinificationFilter = undefined as any;
  defaultMagnificationFilter = undefined as any;

  readonly imageryProviders: ImageryProvider[] = [];
  readonly readyPromise: Promise<boolean>;
  readonly tilingScheme: TilingScheme;
  readonly tileWidth = 256;
  readonly tileHeight = 256;

  constructor(options: FxImageryProviderOptions) {
    this.imageryProviders = options.imageryProviders;
    this.readyPromise = Promise.all(
      this.imageryProviders.map(p => p.readyPromise)
    ).then(result => result.every(isReady => isReady));
    this.tilingScheme = new WebMercatorTilingScheme();
  }

  get ready() {
    return this.imageryProviders.every(p => p.ready);
  }

  get rectangle() {
    if (this.imageryProviders.length === 0) {
      return this.tilingScheme.rectangle;
    }

    return this.imageryProviders.reduce(
      (rectangle, provider) =>
        Rectangle.union(rectangle, provider.rectangle, rectangle),
      Rectangle.clone(this.imageryProviders[0].rectangle)
    );
  }
}
