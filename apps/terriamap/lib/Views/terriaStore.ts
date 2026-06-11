import { makeObservable, observable, action } from "mobx";
import type Terria from "terriajs/lib/Models/Terria";
import type ViewState from "terriajs/lib/ReactViewModels/ViewState";

class TerriaStore {
  terria: Terria | undefined = undefined;
  viewState: ViewState | undefined = undefined;
  status: "loading" | "ready" = "loading";

  constructor() {
    makeObservable(this, {
      terria: observable,
      viewState: observable,
      status: observable,
      setReady: action
    });

    this.init();
  }

  async init() {
    //@ts-expect-error: need to convert to TS
    await import("terriajs/lib/Core/prerequisites");

    const { terria, viewState } = await import("../../index.js").then(
      (module) => module.default
    );

    this.setReady(terria, viewState);
  }

  setReady(terria: Terria, viewState: ViewState) {
    this.terria = terria;
    this.viewState = viewState;
    this.status = "ready";
  }
}

export const terriaStore = new TerriaStore();
