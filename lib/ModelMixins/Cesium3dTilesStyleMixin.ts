import Cesium3DTileStyle from "terriajs-cesium/Source/Scene/Cesium3DTileStyle";
import AbstractConstructor from "../Core/AbstractConstructor";
import isDefined from "../Core/isDefined";
import Model, { BaseModel } from "../Models/Definition/Model";
import Cesium3dTilesTraits from "../Traits/TraitsClasses/Cesium3dTilesTraits";
import clone from "terriajs-cesium/Source/Core/clone";
import { computed, makeObservable, override, runInAction, toJS } from "mobx";
import Color from "terriajs-cesium/Source/Core/Color";
import LoadableStratum from "../Models/Definition/LoadableStratum";
import StratumOrder from "../Models/Definition/StratumOrder";

class Cesium3dTilesStyleStratum extends LoadableStratum(Cesium3dTilesTraits) {
  constructor(...args: any[]) {
    super(...args);
    makeObservable(this);
  }

  duplicateLoadableStratum(model: BaseModel): this {
    return new Cesium3dTilesStyleStratum(model) as this;
  }

  @computed
  get opacity() {
    return 1.0;
  }
}

// Register the I3SStratum
StratumOrder.instance.addLoadStratum(Cesium3dTilesStyleStratum.name);

type BaseType = Model<Cesium3dTilesTraits>;

const DEFAULT_HIGHLIGHT_COLOR = "#ff3f00";

function Cesium3dTilesStyleMixin<T extends AbstractConstructor<BaseType>>(
  Base: T
) {
  abstract class Cesium3dTilesStyleMixin extends Base {
    constructor(...args: any[]) {
      super(...args);
      makeObservable(this);
      runInAction(() => {
        this.strata.set(
          Cesium3dTilesStyleStratum.name,
          new Cesium3dTilesStyleStratum()
        );
      });
    }

    get hasCesium3dTilesStyleMixin() {
      return true;
    }

    /**
     * The color to use for highlighting features in this catalog item.
     *
     */
    @override
    get highlightColor(): string {
      return super.highlightColor || DEFAULT_HIGHLIGHT_COLOR;
    }

    @computed
    get showExpressionFromFilters() {
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

    @computed get cesiumTileStyle(): Cesium3DTileStyle | undefined {
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
      } else if (typeof style.color === "string") {
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
  }
  return Cesium3dTilesStyleMixin;
}

namespace Cesium3dTilesStyleMixin {
  export interface Instance
    extends InstanceType<ReturnType<typeof Cesium3dTilesStyleMixin>> {}
  export function isMixedInto(model: any): model is Instance {
    return model && model.hasCesium3dTilesStyleMixin;
  }
}

export default Cesium3dTilesStyleMixin;
