import i18next from "i18next";
import {
  action,
  computed,
  isObservableArray,
  observable,
  runInAction,
  toJS
} from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import clone from "terriajs-cesium/Source/Core/clone";
import Color from "terriajs-cesium/Source/Core/Color";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTilePointFeature from "terriajs-cesium/Source/Scene/Cesium3DTilePointFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import { isJsonObject, JsonObject } from "../Core/Json";
import runLater from "../Core/runLater";
import TerriaError from "../Core/TerriaError";
import proxyCatalogItemUrl from "../Models/Catalog/proxyCatalogItemUrl";
import CommonStrata from "../Models/Definition/CommonStrata";
import createStratumInstance from "../Models/Definition/createStratumInstance";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import Model, { BaseModel } from "../Models/Definition/Model";
import StratumOrder from "../Models/Definition/StratumOrder";
import TerriaFeature from "../Models/Feature/Feature";
import Cesium3DTilesCatalogItemTraits from "../Traits/TraitsClasses/Cesium3DTilesCatalogItemTraits";
import Cesium3dTilesTraits, {
  OptionsTraits
} from "../Traits/TraitsClasses/Cesium3dTilesTraits";
import CatalogMemberMixin, { getName } from "./CatalogMemberMixin";
import ClippingMixin from "./ClippingMixin";
import MappableMixin from "./MappableMixin";
import ShadowMixin from "./ShadowMixin";

class Cesium3dTilesStratum extends LoadableStratum(Cesium3dTilesTraits) {
  duplicateLoadableStratum(model: BaseModel): this {
    return new Cesium3dTilesStratum() as this;
  }

  @computed
  get opacity() {
    return 1.0;
  }
}

// Register the Cesium3dTilesStratum
StratumOrder.instance.addLoadStratum(Cesium3dTilesStratum.name);

const DEFAULT_HIGHLIGHT_COLOR = "#ff3f00";

interface Cesium3DTilesCatalogItemIface
  extends InstanceType<ReturnType<typeof Cesium3dTilesMixin>> {}

class ObservableCesium3DTileset extends Cesium3DTileset {
  _catalogItem?: Cesium3DTilesCatalogItemIface;
  @observable destroyed = false;

  destroy() {
    super.destroy();
    // TODO: we are running later to prevent this
    // modification from happening in some computed up the call chain.
    // Figure out why that is happening and fix it.
    runLater(() => {
      runInAction(() => {
        this.destroyed = true;
      });
    });
  }
}

function Cesium3dTilesMixin<T extends Constructor<Model<Cesium3dTilesTraits>>>(
  Base: T
) {
  abstract class Cesium3dTilesMixin extends ClippingMixin(
    ShadowMixin(MappableMixin(CatalogMemberMixin(Base)))
  ) {
    protected tileset?: ObservableCesium3DTileset;

    constructor(...args: any[]) {
      super(...args);
      runInAction(() => {
        this.strata.set(Cesium3dTilesStratum.name, new Cesium3dTilesStratum());
      });
    }

    get hasCesium3dTilesMixin() {
      return true;
    }

    // Just a variable to save the original tileset.root.transform if it exists
    @observable
    private originalRootTransform: Matrix4 = Matrix4.IDENTITY.clone();

    // An observable tracker for tileset.ready
    @observable
    isTilesetReady: boolean = false;

    clippingPlanesOriginMatrix(): Matrix4 {
      if (this.tileset && this.isTilesetReady) {
        // clippingPlanesOriginMatrix is private.
        // We need it to find the position where cesium centers the clipping plane for the tileset.
        // See if we can find another way to get it.
        if ((this.tileset as any).clippingPlanesOriginMatrix) {
          return (this.tileset as any).clippingPlanesOriginMatrix.clone();
        }
      }
      return Matrix4.IDENTITY.clone();
    }

    protected async forceLoadMapItems() {
      try {
        this.loadTileset();
        if (this.tileset) {
          const tileset = await this.tileset.readyPromise;
          if (
            tileset.extras !== undefined &&
            tileset.extras.style !== undefined
          ) {
            runInAction(() => {
              this.strata.set(
                CommonStrata.defaults,
                createStratumInstance(Cesium3DTilesCatalogItemTraits, {
                  style: tileset.extras.style
                })
              );
            });
          }
        }
      } catch (e) {
        throw TerriaError.from(e, "Failed to load 3d-tiles tileset");
      }
    }

    private loadTileset() {
      if (!isDefined(this.url) && !isDefined(this.ionAssetId)) {
        throw `\`url\` and \`ionAssetId\` are not defined for ${getName(this)}`;
      }

      let resource = undefined;
      if (isDefined(this.ionAssetId)) {
        resource = this.createResourceFromIonId(
          this.ionAssetId,
          this.ionAccessToken,
          this.ionServer
        );
      } else if (isDefined(this.url)) {
        resource = this.createResourceFromUrl(
          proxyCatalogItemUrl(this, this.url)
        );
      }

      if (!isDefined(resource)) {
        return;
      }

      const tileset = new ObservableCesium3DTileset({
        ...this.optionsObj,
        url: resource
      });

      tileset._catalogItem = this;
      runLater(
        action(() => {
          this.isTilesetReady = tileset.ready;
        })
      );
      if (!tileset.destroyed) {
        this.tileset = tileset;
      }

      // Save the original root tile transform and set its value to an identity
      // matrix This lets us control the whole model transformation using just
      // tileset.modelMatrix We later derive a tilset.modelMatrix by combining
      // the root transform and transformation traits in mapItems.
      tileset.readyPromise.then(
        action(() => {
          this.isTilesetReady = tileset.ready;
          if (tileset.root !== undefined) {
            this.originalRootTransform = tileset.root.transform.clone();
            tileset.root.transform = Matrix4.IDENTITY.clone();
          }
        })
      );
    }

    /**
     * Computes a new model matrix by combining the given matrix with the
     * origin, rotation & scale trait values
     */
    private computeModelMatrixFromTransformationTraits(modelMatrix: Matrix4) {
      let scale = Matrix4.getScale(modelMatrix, new Cartesian3());
      let position = Matrix4.getTranslation(modelMatrix, new Cartesian3());
      let orientation = Quaternion.fromRotationMatrix(
        Matrix4.getMatrix3(modelMatrix, new Matrix3())
      );

      const { latitude, longitude, height } = this.origin;
      if (latitude !== undefined && longitude !== undefined) {
        const positionFromLatLng = Cartesian3.fromDegrees(
          longitude,
          latitude,
          height
        );
        position.x = positionFromLatLng.x;
        position.y = positionFromLatLng.y;
        if (height !== undefined) {
          position.z = positionFromLatLng.z;
        }
      }

      const { heading, pitch, roll } = this.rotation;
      if (heading !== undefined && pitch !== undefined && roll !== undefined) {
        const hpr = HeadingPitchRoll.fromDegrees(heading, pitch, roll);
        orientation = Transforms.headingPitchRollQuaternion(position, hpr);
      }

      if (this.scale !== undefined) {
        scale = new Cartesian3(this.scale, this.scale, this.scale);
      }

      return Matrix4.fromTranslationQuaternionRotationScale(
        position,
        orientation,
        scale
      );
    }

    /**
     * A computed that returns the result of transforming the original tileset
     * root transform with the origin, rotation & scale traits for this catalog
     * item
     */
    @computed
    get modelMatrix(): Matrix4 {
      const modelMatrixFromTraits =
        this.computeModelMatrixFromTransformationTraits(
          this.originalRootTransform
        );
      return modelMatrixFromTraits;
    }

    @computed
    get mapItems() {
      if (this.isLoadingMapItems || !isDefined(this.tileset)) {
        return [];
      }

      if (this.tileset.destroyed) {
        this.loadMapItems(true);
      }

      this.tileset.style = toJS(this.cesiumTileStyle);
      this.tileset.shadows = this.cesiumShadows;
      this.tileset.show = this.show;

      const key = this
        .colorBlendMode as keyof typeof Cesium3DTileColorBlendMode;
      const colorBlendMode = Cesium3DTileColorBlendMode[key];
      if (colorBlendMode !== undefined)
        this.tileset.colorBlendMode = colorBlendMode;
      this.tileset.colorBlendAmount = this.colorBlendAmount;

      // default is 16 (baseMaximumScreenSpaceError @ 2)
      // we want to reduce to 8 for higher levels of quality
      // the slider goes from [quality] 1 to 3 [performance]
      // in 0.1 steps
      const tilesetBaseSse =
        this.options.maximumScreenSpaceError !== undefined
          ? this.options.maximumScreenSpaceError / 2.0
          : 8;
      this.tileset.maximumScreenSpaceError =
        tilesetBaseSse * this.terria.baseMaximumScreenSpaceError;

      this.tileset.modelMatrix = this.modelMatrix;

      this.tileset.clippingPlanes = toJS(this.clippingPlaneCollection)!;
      this.clippingMapItems.forEach((mapItem) => {
        mapItem.show = this.show;
      });

      return [this.tileset, ...this.clippingMapItems];
    }

    @computed
    get shortReport(): string | undefined {
      if (this.terria.currentViewer.type === "Leaflet") {
        return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
      }
      return super.shortReport;
    }

    @computed get optionsObj() {
      const options: any = {};
      if (isDefined(this.options)) {
        Object.keys(OptionsTraits.traits).forEach((name) => {
          options[name] = (<any>this.options)[name];
        });
      }
      return options;
    }

    private createResourceFromUrl(url: Resource | string) {
      if (!isDefined(url)) {
        return;
      }

      let resource: Resource | undefined;
      if (url instanceof Resource) {
        resource = url;
      } else {
        resource = new Resource({ url });
      }

      return resource;
    }

    private async createResourceFromIonId(
      ionAssetId: number | undefined,
      ionAccessToken: string | undefined,
      ionServer: string | undefined
    ) {
      if (!isDefined(ionAssetId)) {
        return;
      }

      let resource: IonResource | undefined = await IonResource.fromAssetId(
        ionAssetId,
        {
          accessToken:
            ionAccessToken || this.terria.configParameters.cesiumIonAccessToken,
          server: ionServer
        }
      );
      return resource;
    }

    @computed get showExpressionFromFilters() {
      if (!isDefined(this.filters)) {
        return;
      }
      const terms = this.filters.map((filter) => {
        if (!isDefined(filter.property)) {
          return "";
        }

        // Escape single quotes, cast property value to number
        const property =
          "Number(${feature['" + filter.property.replace(/'/g, "\\'") + "']})";
        const min =
          isDefined(filter.minimumValue) &&
          isDefined(filter.minimumShown) &&
          filter.minimumShown > filter.minimumValue
            ? property + " >= " + filter.minimumShown
            : "";
        const max =
          isDefined(filter.maximumValue) &&
          isDefined(filter.maximumShown) &&
          filter.maximumShown < filter.maximumValue
            ? property + " <= " + filter.maximumShown
            : "";

        return [min, max].filter((x) => x.length > 0).join(" && ");
      });

      const showExpression = terms.filter((x) => x.length > 0).join("&&");
      if (showExpression.length > 0) {
        return showExpression;
      }
    }

    @computed get cesiumTileStyle() {
      if (
        !isDefined(this.style) &&
        (!isDefined(this.opacity) || this.opacity === 1) &&
        !isDefined(this.showExpressionFromFilters)
      ) {
        return;
      }

      const style = clone(toJS(this.style) || {});
      const opacity = clone(toJS(this.opacity));

      if (!isDefined(style.defines)) {
        style.defines = { opacity };
      } else {
        style.defines = Object.assign(style.defines, { opacity });
      }

      // Rewrite color expression to also use the models opacity setting
      if (!isDefined(style.color)) {
        // Some tilesets (eg. point clouds) have a ${COLOR} variable which
        // stores the current color of a feature, so if we have that, we should
        // use it, and only change the opacity.  We have to do it
        // component-wise because `undefined` is mapped to a large float value
        // (czm_infinity) in glsl in Cesium and so can only be compared with
        // another float value.
        //
        // There is also a subtle bug which prevents us from using an
        // expression in the alpha part of the rgba().  eg, using the
        // expression '${COLOR}.a === undefined ? ${opacity} : ${COLOR}.a * ${opacity}'
        // to generate an opacity value will cause Cesium to generate wrong
        // translucency values making the tileset translucent even when the
        // computed opacity is 1.0. It also makes the whole of the point cloud
        // appear white when zoomed out to some distance.  So for now, the only
        // solution is to discard the opacity from the tileset and only use the
        // value from the opacity trait.
        style.color =
          "(rgba(" +
          "(${COLOR}.r === undefined ? 1 : ${COLOR}.r) * 255," +
          "(${COLOR}.g === undefined ? 1 : ${COLOR}.g) * 255," +
          "(${COLOR}.b === undefined ? 1 : ${COLOR}.b) * 255," +
          "${opacity}" +
          "))";
      } else if (typeof style.color == "string") {
        // Check if the color specified is just a css color
        const cssColor = Color.fromCssColorString(style.color);
        if (isDefined(cssColor)) {
          style.color = `color('${style.color}', \${opacity})`;
        }
      }

      if (isDefined(this.showExpressionFromFilters)) {
        style.show = toJS(this.showExpressionFromFilters);
      }

      return new Cesium3DTileStyle(style);
    }

    /**
     * This function should return null if allowFeaturePicking = false
     * @param _screenPosition
     * @param pickResult
     */
    buildFeatureFromPickResult(
      _screenPosition: Cartesian2 | undefined,
      pickResult: any
    ) {
      if (
        this.allowFeaturePicking &&
        (pickResult instanceof Cesium3DTileFeature ||
          pickResult instanceof Cesium3DTilePointFeature)
      ) {
        const properties: { [name: string]: unknown } = {};
        pickResult.getPropertyNames().forEach((name) => {
          properties[name] = pickResult.getProperty(name);
        });

        const result = new TerriaFeature({
          properties
        });

        result._cesium3DTileFeature = pickResult;
        return result;
      }
    }

    /**
     * Returns the name of properties to be used as an ID for this catalog item.
     *
     * The return value is an array of strings as the Id value could be formed
     * by combining multiple properties. eg: ["latitudeprop", "longitudeprop"]
     */
    getIdPropertiesForFeature(feature: Cesium3DTileFeature): string[] {
      // If `featureIdProperties` is set return it, otherwise if the feature has
      // a property named `id` return it.
      if (this.featureIdProperties) return this.featureIdProperties.slice();
      const propretyNamedId = feature
        .getPropertyNames()
        .find((name) => name.toLowerCase() === "id");
      return propretyNamedId ? [propretyNamedId] : [];
    }

    /**
     * Returns a selector that can be used for filtering or styling the given
     * feature.  For this to work, the feature should have a property called
     * `id` or the catalog item should have the trait `featureIdProperties` defined.
     *
     * @returns Selector string or `undefined` when no unique selector can be constructed for the feature
     */
    getSelectorForFeature(feature: Cesium3DTileFeature): string | undefined {
      const idProperties = this.getIdPropertiesForFeature(feature).sort();
      if (idProperties.length === 0) {
        return;
      }

      const terms = idProperties.map(
        (p: string) => `\${${p}} === ${JSON.stringify(feature.getProperty(p))}`
      );
      const selector = terms.join(" && ");
      return selector ? selector : undefined;
    }

    setVisibilityForMatchingFeature(expression: string, visibility: boolean) {
      if (expression) {
        const style = this.style || {};
        const show = normalizeShowExpression(style?.show);
        show.conditions.unshift([expression, visibility]);
        this.setTrait(CommonStrata.user, "style", { ...style, show });
      }
    }

    /**
     * Modifies the style traits to show/hide a 3d tile feature
     *
     */
    @action
    setFeatureVisibility(feature: Cesium3DTileFeature, visibility: boolean) {
      const showExpr = this.getSelectorForFeature(feature);
      if (showExpr) {
        this.setVisibilityForMatchingFeature(showExpr, visibility);
      }
    }

    /**
     * Adds a new show expression to the styles trait.
     *
     * To ensure that we can add multiple show expressions, we first normalize
     * the show expressions to a `show.conditions` array and then add the new
     * expression. The new expression is added to the beginning of
     * `show.conditions` so it will have the highest priority.
     *
     * @param newShowExpr The new show expression to add to the styles trait
     */
    @action
    applyShowExpression(newShowExpr: { condition: string; show: boolean }) {
      const style = this.style || {};
      const show = normalizeShowExpression(style?.show);
      show.conditions.unshift([newShowExpr.condition, newShowExpr.show]);
      this.setTrait(CommonStrata.user, "style", { ...style, show });
    }

    /**
     * Remove all show expressions that match the given condition.
     *
     * @param condition The condition string used to match the show expression.
     */
    @action
    removeShowExpression(condition: string) {
      const show = this.style?.show;
      if (!isJsonObject(show)) return;
      if (!isObservableArray(show.conditions)) return;
      const conditions = show.conditions
        .slice()
        .filter((e) => e[0] !== condition);
      this.setTrait(CommonStrata.user, "style", {
        ...this.style,
        show: {
          ...show,
          conditions
        }
      });
    }

    /**
     * Adds a new color expression to the style traits.
     *
     * To ensure that we can add multiple color expressions, we first normalize the
     * color expression to a `color.conditions` array. Then add the new expression to the
     * beginning of the array. This gives the highest priority for the new color expression.
     *
     * @param newColorExpr The new color expression to add
     */
    @action
    applyColorExpression(newColorExpr: { condition: string; value: string }) {
      const style = this.style || {};
      const color = normalizeColorExpression(style?.color);
      color.conditions.unshift([newColorExpr.condition, newColorExpr.value]);
      if (!color.conditions.find((c) => c[0] === "true")) {
        color.conditions.push(["true", "color('#ffffff')"]); // ensure there is a default color
      }
      this.setTrait(CommonStrata.user, "style", {
        ...style,
        color
      } as JsonObject);
    }

    /**
     * Removes all color expressions with the given condition from the style traits.
     */
    @action
    removeColorExpression(condition: string) {
      const color = this.style?.color;
      if (!isJsonObject(color)) return;
      if (!isObservableArray(color.conditions)) return;
      const conditions = color.conditions
        .slice()
        .filter((e) => e[0] !== condition);
      this.setTrait(CommonStrata.user, "style", {
        ...this.style,
        color: {
          ...color,
          conditions
        }
      });
    }

    /**
     * The color to use for highlighting features in this catalog item.
     *
     */
    @computed
    get highlightColor(): string {
      return super.highlightColor || DEFAULT_HIGHLIGHT_COLOR;
    }
  }

  return Cesium3dTilesMixin;
}

namespace Cesium3dTilesMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof Cesium3dTilesMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCesium3dTilesMixin;
  }
}

export default Cesium3dTilesMixin;

function normalizeShowExpression(show: any): {
  conditions: [string, boolean][];
} {
  let conditions;
  if (Array.isArray(show?.conditions?.slice())) {
    conditions = [...show.conditions];
  } else if (typeof show === "string") {
    conditions = [[show, true]];
  } else {
    conditions = [["true", true]];
  }
  return { ...show, conditions };
}

function normalizeColorExpression(expr: any): {
  expression?: string;
  conditions: [string, string][];
} {
  const normalized: { expression?: string; conditions: [string, string][] } = {
    conditions: []
  };
  if (typeof expr === "string") normalized.expression = expr;
  if (isJsonObject(expr)) Object.assign(normalized, expr);
  return normalized;
}
