import i18next from "i18next";
import { action, computed, observable, runInAction, toJS } from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import clone from "terriajs-cesium/Source/Core/clone";
import HeadingPitchRoll from "terriajs-cesium/Source/Core/HeadingPitchRoll";
import IonResource from "terriajs-cesium/Source/Core/IonResource";
import Matrix3 from "terriajs-cesium/Source/Core/Matrix3";
import Matrix4 from "terriajs-cesium/Source/Core/Matrix4";
import Quaternion from "terriajs-cesium/Source/Core/Quaternion";
import Resource from "terriajs-cesium/Source/Core/Resource";
import Transforms from "terriajs-cesium/Source/Core/Transforms";
import Color from "terriajs-cesium/Source/Core/Color";
import Cesium3DTileColorBlendMode from "terriajs-cesium/Source/Scene/Cesium3DTileColorBlendMode";
import Cesium3DTileFeature from "terriajs-cesium/Source/Scene/Cesium3DTileFeature";
import Cesium3DTileset from "terriajs-cesium/Source/Scene/Cesium3DTileset";
import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import Constructor from "../Core/Constructor";
import isDefined from "../Core/isDefined";
import makeRealPromise from "../Core/makeRealPromise";
import runLater from "../Core/runLater";
import CommonStrata from "../Models/CommonStrata";
import createStratumInstance from "../Models/createStratumInstance";
import Feature from "../Models/Feature";
import LoadableStratum from "../Models/LoadableStratum";
import Model, { BaseModel } from "../Models/Model";
import proxyCatalogItemUrl from "../Models/proxyCatalogItemUrl";
import StratumOrder from "../Models/StratumOrder";
import Cesium3DTilesCatalogItemTraits from "../Traits/Cesium3DCatalogItemTraits";
import Cesium3dTilesTraits, {
  OptionsTraits
} from "../Traits/Cesium3dTilesTraits";
import AsyncMappableMixin from "./AsyncMappableMixin";
import ShadowMixin from "./ShadowMixin";

class Cesium3dTilesStratum extends LoadableStratum(Cesium3dTilesTraits) {
  constructor() {
    super();
  }

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
  abstract class Cesium3dTilesMixin extends ShadowMixin(
    AsyncMappableMixin(Base)
  ) {
    readonly canZoomTo = true;

    private tileset?: ObservableCesium3DTileset;

    constructor(...args: any[]) {
      super(...args);
      runInAction(() => {
        this.strata.set(Cesium3dTilesStratum.name, new Cesium3dTilesStratum());
      });
    }

    get isMappable() {
      return true;
    }

    protected forceLoadMetadata() {
      return Promise.resolve();
    }

    protected forceLoadMapItems() {
      this.loadTileset();
      if (this.tileset) {
        return makeRealPromise<Cesium3DTileset>(this.tileset.readyPromise)
          .then(tileset => {
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
          }) // TODO: What should handle this error?
          .catch(e => console.error(e));
      } else {
        return Promise.resolve();
      }
    }

    private loadTileset() {
      if (!isDefined(this.url) && !isDefined(this.ionAssetId)) {
        return;
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
      if (!tileset.destroyed) {
        this.tileset = tileset;
      }
    }

    /**
     * Computes a modelMatrix from the origin, rotation & scale traits
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

    @computed
    get mapItems() {
      if (this.isLoadingMapItems || !isDefined(this.tileset)) {
        return [];
      }

      if (this.tileset.destroyed) {
        this.loadTileset();
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

      // To make it easier to perform transformation operations on the tileset we
      // set the root transform to IDENTIY (if it is already not) and instead control all
      // transformations using modelMatrix
      let modelMatrix: Matrix4;
      if (
        this.tileset.root &&
        !Matrix4.equals(this.tileset.root.transform, Matrix4.IDENTITY)
      ) {
        modelMatrix = this.tileset.root.transform.clone();
        this.tileset.root.transform = Matrix4.IDENTITY.clone();
      } else {
        modelMatrix = this.tileset.modelMatrix;
      }
      this.tileset.modelMatrix = this.computeModelMatrixFromTransformationTraits(
        modelMatrix
      );

      return [this.tileset];
    }

    @computed
    get shortReport(): string | undefined {
      if (this.terria.currentViewer.type === "Leaflet") {
        return i18next.t("models.commonModelErrors.3dTypeIn2dMode", this);
      }
      return undefined;
    }

    @computed get optionsObj() {
      const options: any = {};
      if (isDefined(this.options)) {
        Object.keys(OptionsTraits.traits).forEach(name => {
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
      const terms = this.filters.map(filter => {
        if (!isDefined(filter.property)) {
          return "";
        }

        const property =
          "${feature['" + filter.property.replace(/'/g, "\\'") + "']}";
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
        return [min, max].filter(x => x.length > 0).join(" && ");
      });

      const showExpression = terms.join("&&");
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

      if (!isDefined(style.color)) {
        style.color = "color('white', ${opacity})";
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

    buildFeatureFromPickResult(_screenPosition: Cartesian2, pickResult: any) {
      if (pickResult instanceof Cesium3DTileFeature) {
        const properties: { [name: string]: unknown } = {};
        pickResult.getPropertyNames().forEach(name => {
          properties[name] = pickResult.getProperty(name);
        });

        const result = new Feature({
          properties
        });

        result._cesium3DTileFeature = pickResult;
        return result;
      }
    }

    getIdPropertiesForFeature(feature: Cesium3DTileFeature): string[] {
      // If `featureIdProperties` is set return it, otherwise if the feature has
      // a property named `id` return it.
      if (this.featureIdProperties) return this.featureIdProperties.slice();
      const propretyNamedId = feature
        .getPropertyNames()
        .find(name => name.toLowerCase() === "id");
      return propretyNamedId ? [propretyNamedId] : [];
    }

    /**
     * Modifies the style traits to show/hide a 3d tile feature
     *
     */
    @action
    setFeatureVisibility(feature: Cesium3DTileFeature, visibiltiy: boolean) {
      const idProperties = this.getIdPropertiesForFeature(feature)?.sort();
      if (idProperties.length === 0) {
        return;
      }

      const terms = idProperties.map(
        (p: string) => `\${${p}} === ${JSON.stringify(feature.getProperty(p))}`
      );
      const showExpr = terms.join(" && ");
      if (showExpr) {
        const style = this.style || {};
        const show = normalizeShowExpression(style?.show);
        show.conditions.unshift([showExpr, visibiltiy]);
        this.setTrait(CommonStrata.user, "style", { ...style, show });
      }
    }
  }

  return Cesium3dTilesMixin;
}

export default Cesium3dTilesMixin;

function normalizeShowExpression(
  show: any
): { conditions: [string, boolean][] } {
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
