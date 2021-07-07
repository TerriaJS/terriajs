import { computed, observable } from "mobx";
import ViewerMode from "../../Models/ViewerMode";
import React from "react";

export interface ICompositeBarItemController {
  readonly id: string;
  active: boolean;
  disabled: boolean;
  collapsed: boolean;
  pinned: boolean;
  visible: boolean;
  readonly glyph: any;
  readonly viewerMode: ViewerMode | undefined;
  itemRef: React.RefObject<HTMLDivElement>;
}

export abstract class CompositeBarItemController
  implements ICompositeBarItemController {
  static id: string;
  itemRef: React.RefObject<HTMLDivElement> = React.createRef();

  get id() {
    return CompositeBarItemController.id;
  }

  @observable
  private _disabled: boolean = false;

  @computed
  get disabled(): boolean {
    return this._disabled;
  }

  set disabled(value: boolean) {
    this._disabled = value;
  }

  @observable
  private _collapsed: boolean = false;

  @computed
  get collapsed(): boolean {
    return this._collapsed;
  }

  set collapsed(value: boolean) {
    this._collapsed = value;
  }

  @observable
  protected _active: boolean = false;

  @computed
  get active(): boolean {
    return !this.disabled && this._active;
  }

  @observable
  private _pinned: boolean = false;

  @computed
  get pinned(): boolean {
    return this._pinned;
  }

  set pinned(value: boolean) {
    this._pinned = value;
  }

  @observable
  private _visible: boolean = true;

  @computed
  get visible(): boolean {
    return this._visible;
  }

  set visible(value: boolean) {
    this._visible = value;
  }

  abstract get glyph(): { id: string };

  abstract get viewerMode(): ViewerMode | undefined;

  abstract handleClick(): void;
}
