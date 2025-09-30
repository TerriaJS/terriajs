import { Sheet } from "protomaps-leaflet";
import Resource from "terriajs-cesium/Source/Core/Resource";
import { isJsonNumber } from "../../../../Core/Json";

/**
 * A sprite sheet implementation that reads a indexed raster sprite usually
 * specified using the "sprite" property in a maplibre style definition.
 */
export default class IndexedSpriteSheet extends Sheet {
  spriteUrls() {
    const dpr = window.devicePixelRatio;
    const dprSuffix = Math.round(dpr) > 1 ? "@2x" : "";
    return {
      indexUrl: `${this.src}${dprSuffix}.json`,
      imageUrl: `${this.src}${dprSuffix}.png`
    };
  }

  async load() {
    const { indexUrl, imageUrl } = this.spriteUrls();
    const [index, sprite] = await Promise.all([
      Resource.fetchJson({ url: indexUrl }),
      Resource.fetchImage({ url: imageUrl })
    ]);

    if (!index || !sprite) {
      console.error(`Bad sprite image or index. Ignoring sprite - ${this.src}`);
      return this;
    }

    this.canvas.width = sprite.width;
    this.canvas.height = sprite.height;

    const ctx = this.canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(sprite, 0, 0);
    }

    for (const iconId in index) {
      const icon = index[iconId] ?? {};
      const { x, y, width, height } = icon;
      if (
        isJsonNumber(x) &&
        isJsonNumber(y) &&
        isJsonNumber(width) &&
        isJsonNumber(height)
      ) {
        this.mapping.set(iconId, {
          x: x,
          y: y,
          w: width,
          h: height
        });
      }
    }

    return this;
  }
}
