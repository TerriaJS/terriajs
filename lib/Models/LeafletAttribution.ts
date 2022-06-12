import Terria from "./Terria";
import { LeafletCredits } from "../ReactViews/Credits";
import L from "leaflet";
import React from "react";
import ReactDOM from "react-dom";

export class LeafletAttribution extends L.Control.Attribution {
  private readonly terria: Terria;
  private map?: L.Map;
  private _container!: HTMLElement;
  private currentAttibution?: HTMLElement;

  constructor(terria: Terria) {
    const options: L.Control.AttributionOptions = {
      position: "bottomleft"
    };
    if (terria.configParameters.leafletAttributionPrefix) {
      options.prefix = terria.configParameters.leafletAttributionPrefix;
    }
    super(options);

    this.terria = terria;
  }

  onAdd(map: L.Map) {
    map.attributionControl = this;
    this.map = map;

    this._container = L.DomUtil.create("div", "leaflet-control-attribution");
    L.DomEvent.disableClickPropagation(this._container);

    map.eachLayer(layer => {
      if (layer.getAttribution) {
        const att = layer.getAttribution();
        if (att) this.addAttribution(att);
      }
    });

    return this._container;
  }

  _update() {
    if (!this.map) {
      return;
    }
    if (this.currentAttibution) {
      this._container.removeChild(this.currentAttibution);
    }

    const attribs: string[] = [];
    //@ts-ignore
    const attributions = this._attributions;
    for (const i in attributions) {
      if (attributions[i]) {
        attribs.push(i);
      }
    }

    const domElement = document.createElement("div");
    const element = React.createElement(LeafletCredits, {
      hideTerriaLogo: !!this.terria.configParameters.hideTerriaLogo,
      prefix: `${this.options.prefix}`,
      credits: this.terria.configParameters.extraCreditLinks?.slice(),
      dataAttributions: attribs
    });
    ReactDOM.render(element, domElement);
    const child = domElement.firstElementChild as HTMLElement;
    if (child) {
      this.currentAttibution = child;
      this._container?.appendChild(child);
    }
  }
}
