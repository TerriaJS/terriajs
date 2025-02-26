import { action, computed, makeObservable, observable } from "mobx";
import Terria from "./Terria";

export default class MeasureTools {
  @observable private _active = false;

  constructor(readonly terria: Terria) {
    makeObservable(this);
  }

  @computed
  get active() {
    return this._active;
  }

  @action
  activate() {
    this._active = true;
  }

  @action
  deactivate() {
    this._active = false;
  }
}
