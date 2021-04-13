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
  get id() {
    return CompositeBarItemController.id;
  }
  itemRef: React.RefObject<HTMLDivElement> = React.createRef();
  @observable
  private _disabled: boolean = false;
  @observable
  private _collapsed: boolean = false;
  @observable
  protected _active: boolean = false;

  @observable
  private _pinned: boolean = false;

  @observable
  private _visible: boolean = true;

  abstract get glyph(): { id: string };
  abstract get viewerMode(): ViewerMode | undefined;

  @computed
  get active(): boolean {
    return !this.disabled && this._active;
  }

  @computed
  get disabled(): boolean {
    return this._disabled;
  }
  set disabled(value: boolean) {
    this._disabled = value;
  }

  @computed
  get collapsed(): boolean {
    return this._collapsed;
  }
  set collapsed(value: boolean) {
    this._collapsed = value;
  }

  @computed
  get pinned(): boolean {
    return this._pinned;
  }
  set pinned(value: boolean) {
    this._pinned = value;
  }

  @computed
  get visible(): boolean {
    return this._visible;
  }
  set visible(value: boolean) {
    this._visible = value;
  }
  abstract handleClick(): void;
}
