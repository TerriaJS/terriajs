import {
  IObservableArray,
  runInAction,
  observable,
  makeObservable
} from "mobx";
import L from "leaflet";
import Terria from "./Terria";

export class LeafletAttribution extends L.Control.Attribution {
  private readonly _attributions: Record<string, number>;
  private map?: L.Map;
  private _container!: HTMLElement;
  @observable
  dataAttributions: IObservableArray<string>;

  constructor(terria: Terria) {
    const options: L.Control.AttributionOptions = {
      position: "bottomleft"
    };
    if (terria.configParameters.leafletAttributionPrefix) {
      options.prefix = terria.configParameters.leafletAttributionPrefix;
    }
    super(options);
    makeObservable(this);

    this._attributions = {};
    this.dataAttributions = observable([]);
  }

  onAdd(map: L.Map): HTMLElement {
    map.attributionControl = this;
    this.map = map;

    this._container = L.DomUtil.create("div", "leaflet-control-attribution");
    L.DomEvent.disableClickPropagation(this._container);

    map.eachLayer((layer) => {
      if (layer.getAttribution) {
        const att = layer.getAttribution();
        if (att) this.addAttribution(att);
      }
    });

    return this._container;
  }

  onRemove(): void {
    this.map = undefined;
  }

  _update(): void {
    if (!this.map) {
      return;
    }

    const attribs: string[] = [];
    const attributions = this._attributions;
    for (const i in attributions) {
      if (attributions[i]) {
        attribs.push(i);
      }
    }
  }

  addAttribution(text: string): this {
    super.addAttribution(text);
    if (this.map) {
      runInAction(() => {
        this.dataAttributions.push(text);
      });
    }
    return this;
  }

  removeAttribution(text: string): this {
    super.removeAttribution(text);
    if (this.map) {
      runInAction(() => {
        this.dataAttributions.remove(text);
      });
    }
    return this;
  }

  get attributions(): string[] {
    const attributionsList: string[] = [];
    const attributions = this._attributions;
    for (const i in attributions) {
      if (attributions[i]) {
        attributionsList.push(i);
      }
    }

    return attributionsList;
  }

  get prefix(): string | undefined {
    if (!this.options.prefix) return undefined;
    return `${this.options.prefix}`;
  }
}
