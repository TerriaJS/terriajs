import {
  action,
  autorun,
  computed,
  IReactionDisposer,
  observable,
  runInAction
} from "mobx";
import Cartesian2 from "terriajs-cesium/Source/Core/Cartesian2";
import Cartesian3 from "terriajs-cesium/Source/Core/Cartesian3";
import EasingFunction from "terriajs-cesium/Source/Core/EasingFunction";
import CreditDisplay from "terriajs-cesium/Source/Scene/CreditDisplay";
import Scene from "terriajs-cesium/Source/Scene/Scene";
import SceneTransforms from "terriajs-cesium/Source/Scene/SceneTransforms";
import TweenCollection from "terriajs-cesium/Source/Scene/TweenCollection";
import isDefined from "../../Core/isDefined";

declare module "terriajs-cesium/Source/Scene/Scene" {
  export default interface Scene {
    tweens: TweenCollection;
    frameState: {
      creditDisplay: CreditDisplay;
    };
  }
}

var screenSpacePos = new Cartesian2();
var offScreen = "-1000px";

export default class CesiumSelectionIndicator {
  /**
   * Gets or sets the world position of the object for which to display the selection indicator.
   * @type {Cartesian3}
   */
  @observable
  position: Cartesian3 | undefined;

  /**
   * Gets or sets the visibility of the selection indicator.
   * @type {Boolean}
   */
  @observable
  showSelection: boolean = true;

  @observable
  transform: string = "";

  @observable
  opacity: number = 1.0;

  readonly container: Element;
  readonly selectionIndicatorElement: HTMLDivElement;
  readonly scene: Scene;

  @observable
  private _screenPositionX: string = offScreen;

  @observable
  private _screenPositionY: string = offScreen;

  private _cesium: import("../../Models/Cesium").default;
  private _tweens: any;
  private _selectionIndicatorTween: any;
  private _selectionIndicatorIsAppearing: boolean = false;
  private _disposeAutorun: IReactionDisposer;

  constructor(cesium: import("../../Models/Cesium").default) {
    this._cesium = cesium;
    this._tweens = cesium.scene.tweens;
    this.container = cesium.cesiumWidget.container;
    this.scene = cesium.scene;

    const el = document.createElement("div");
    el.className = "selection-indicator";
    this.container.appendChild(el);
    this.selectionIndicatorElement = el;

    const img = document.createElement("img");
    img.setAttribute(
      "src",
      require("../../../wwwroot/images/NM-LocationTarget.svg")
    );
    img.setAttribute("alt", "");
    img.setAttribute("width", "50px");
    img.setAttribute("height", "50px");
    el.appendChild(img);

    this._disposeAutorun = autorun(() => {
      el.style.top = this._screenPositionY;
      el.style.left = this._screenPositionX;
      el.style.transform = this.transform;
      el.style.opacity = this.opacity.toString();
    });
  }

  destroy() {
    if (this.selectionIndicatorElement.parentNode) {
      this.selectionIndicatorElement.parentNode.removeChild(
        this.selectionIndicatorElement
      );
    }
    this._disposeAutorun();
  }

  /**
   * Gets the visibility of the position indicator.  This can be false even if an
   * object is selected, when the selected object has no position.
   * @type {Boolean}
   */
  @computed
  get isVisible() {
    return this.showSelection && isDefined(this.position);
  }

  /**
   * Updates the view of the selection indicator to match the position and content properties of the view model.
   * This function should be called as part of the render loop.
   */
  @action
  update() {
    if (this.showSelection && isDefined(this.position)) {
      const screenPosition = SceneTransforms.wgs84ToWindowCoordinates(
        this._cesium.scene,
        this.position,
        screenSpacePos
      );
      if (!isDefined(screenPosition)) {
        this._screenPositionX = offScreen;
        this._screenPositionY = offScreen;
      } else {
        const container = this.container;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        const indicatorSize = this.selectionIndicatorElement.clientWidth;
        const halfSize = indicatorSize * 0.5;

        screenPosition.x =
          Math.min(
            Math.max(screenPosition.x, -indicatorSize),
            containerWidth + indicatorSize
          ) - halfSize;
        screenPosition.y =
          Math.min(
            Math.max(screenPosition.y, -indicatorSize),
            containerHeight + indicatorSize
          ) - halfSize;

        this._screenPositionX = Math.floor(screenPosition.x + 0.25) + "px";
        this._screenPositionY = Math.floor(screenPosition.y + 0.25) + "px";
      }
    }
  }

  /**
   * Animate the indicator to draw attention to the selection.
   */
  animateAppear() {
    if (isDefined(this._selectionIndicatorTween)) {
      if (this._selectionIndicatorIsAppearing) {
        // Already appearing; don't restart the animation.
        return;
      }
      this._selectionIndicatorTween.cancelTween();
      this._selectionIndicatorTween = undefined;
    }

    this._selectionIndicatorIsAppearing = true;

    this._selectionIndicatorTween = this._tweens.add({
      startObject: {
        scale: 2.0,
        opacity: 0.0,
        rotate: -180
      },
      stopObject: {
        scale: 1.0,
        opacity: 1.0,
        rotate: 0
      },
      duration: 0.8,
      easingFunction: EasingFunction.EXPONENTIAL_OUT,
      update: (value: any) => {
        runInAction(() => {
          this.opacity = value.opacity;
          this.transform =
            "scale(" + value.scale + ") rotate(" + value.rotate + "deg)";
        });
      },
      complete: () => {
        this._selectionIndicatorTween = undefined;
      },
      cancel: () => {
        this._selectionIndicatorTween = undefined;
      }
    });
  }

  /**
   * Animate the indicator to release the selection.
   */
  animateDepart() {
    if (isDefined(this._selectionIndicatorTween)) {
      if (!this._selectionIndicatorIsAppearing) {
        // Already disappearing, don't restart the animation.
        return;
      }
      this._selectionIndicatorTween.cancelTween();
      this._selectionIndicatorTween = undefined;
    }

    this._selectionIndicatorIsAppearing = false;

    this._selectionIndicatorTween = this._tweens.add({
      startObject: {
        scale: 1.0,
        opacity: 1.0
      },
      stopObject: {
        scale: 1.5,
        opacity: 0.0
      },
      duration: 0.8,
      easingFunction: EasingFunction.EXPONENTIAL_OUT,
      update: (value: any) => {
        runInAction(() => {
          this.opacity = value.opacity;
          this.transform = "scale(" + value.scale + ") rotate(0deg)";
        });
      },
      complete: () => {
        this._selectionIndicatorTween = undefined;
      },
      cancel: () => {
        this._selectionIndicatorTween = undefined;
      }
    });
  }
}
